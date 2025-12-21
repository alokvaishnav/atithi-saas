from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.core.management import call_command
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.http import HttpResponse

from .models import Guest, Room, Booking, Service, BookingCharge, Expense, PropertySetting
from .serializers import (
    GuestSerializer, 
    RoomSerializer, 
    BookingSerializer, 
    ServiceSerializer, 
    BookingChargeSerializer,
    ExpenseSerializer,
    PropertySettingSerializer
)

import csv
from datetime import timedelta
from django.http import HttpResponse
from django.utils.dateparse import parse_date
from core.models import Subscription

import razorpay
from django.conf import settings
from core.models import Payment, Subscription
# You will need to add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your settings.py later

# ==============================
# 🔐 UTILITY: Get the Hotel Owner
# ==============================
def get_hotel_owner(user):
    """
    Returns the Owner User instance based on the logged-in user's role.
    - If user is OWNER -> returns self.
    - If user is STAFF -> returns their boss (user.hotel_owner).
    - If Superuser -> returns None (Handled separately).
    """
    if user.is_superuser:
        return None
    if user.role == 'OWNER':
        return user
    return user.hotel_owner

# ==============================
# 1. CORE HOTEL OPERATIONS
# ==============================

class GuestViewSet(viewsets.ModelViewSet):
    # ✅ FIX: Router needs this to generate URLs
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Guest.objects.all()
        
        owner = get_hotel_owner(user)
        if owner:
            return Guest.objects.filter(owner=owner)
        return Guest.objects.none()

    def perform_create(self, serializer):
        # Auto-assign the guest to the hotel owner
        owner = get_hotel_owner(self.request.user)
        serializer.save(owner=owner)

class RoomViewSet(viewsets.ModelViewSet):
    # ✅ FIX: Router needs this
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Room.objects.all()
        
        owner = get_hotel_owner(user)
        if owner:
            return Room.objects.filter(owner=owner)
        return Room.objects.none()

    def perform_create(self, serializer):
        owner = get_hotel_owner(self.request.user)
        serializer.save(owner=owner)

    @action(detail=True, methods=['post'], url_path='mark-clean')
    def mark_clean(self, request, pk=None):
        room = self.get_object()
        room.status = 'AVAILABLE'
        room.save()
        return Response({'status': f'Room {room.room_number} is now Clean.'})

class BookingViewSet(viewsets.ModelViewSet):
    # ✅ FIX: Router needs this
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Booking.objects.all()
        
        owner = get_hotel_owner(user)
        if owner:
            return Booking.objects.filter(owner=owner)
        return Booking.objects.none()

    def perform_create(self, serializer):
        owner = get_hotel_owner(self.request.user)
        # Save with Owner AND Creator (Audit)
        booking = serializer.save(owner=owner, created_by=self.request.user)
        
        if booking.room:
            room = booking.room
            room.status = 'OCCUPIED'
            room.save()

    @action(detail=True, methods=['post'], url_path='send-confirmation')
    def send_confirmation(self, request, pk=None):
        booking = self.get_object()
        if booking.guest.email:
            try:
                booking.send_confirmation_email()
                return Response({'status': 'Email sent successfully'})
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'error': 'Guest has no email'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='checkout')
    def checkout(self, request, pk=None):
        booking = self.get_object()
        if booking.status != 'CHECKED_IN':
            return Response({'error': 'Not Checked In'}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = 'CHECKED_OUT'
        booking.save()
        
        if booking.room:
            booking.room.status = 'DIRTY'
            booking.room.save()
            
        return Response({'status': 'Checkout successful.'})

# ==============================
# 2. POS, SERVICES & EXPENSES
# ==============================

class ServiceViewSet(viewsets.ModelViewSet):
    # ✅ FIX: Router needs this
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Service.objects.all()
        return Service.objects.filter(owner=get_hotel_owner(user))

    def perform_create(self, serializer):
        serializer.save(owner=get_hotel_owner(self.request.user))

class BookingChargeViewSet(viewsets.ModelViewSet):
    # ✅ FIX: Router needs this
    queryset = BookingCharge.objects.all()
    serializer_class = BookingChargeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter charges by the Booking's Owner
        user = self.request.user
        if user.is_superuser:
            return BookingCharge.objects.all()
        
        owner = get_hotel_owner(user)
        return BookingCharge.objects.filter(booking__owner=owner)

    def perform_create(self, serializer):
        serializer.save()

class ExpenseViewSet(viewsets.ModelViewSet):
    # ✅ FIX: Router needs this
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Expense.objects.all()
        return Expense.objects.filter(owner=get_hotel_owner(user))

    def perform_create(self, serializer):
        serializer.save(
            owner=get_hotel_owner(self.request.user),
            paid_by=self.request.user
        )

# ==============================
# 3. SETTINGS (SAAS ISOLATION)
# ==============================

class SettingViewSet(viewsets.ModelViewSet):
    # ✅ FIX: Router needs this
    queryset = PropertySetting.objects.all()
    serializer_class = PropertySettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return PropertySetting.objects.all()
        
        # Only OWNERS have settings. Staff generally read their Owner's settings.
        owner = get_hotel_owner(user)
        if owner:
            return PropertySetting.objects.filter(owner=owner)
        return PropertySetting.objects.none()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# ==============================
# 4. EXECUTIVE ANALYTICS (SCOPED)
# ==============================

class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        owner = get_hotel_owner(user)
        
        # Base QuerySets (Scoped to Hotel)
        if user.is_superuser:
            bookings = Booking.objects.all()
            expenses = Expense.objects.all()
            rooms = Room.objects.all()
        elif owner:
            bookings = Booking.objects.filter(owner=owner)
            expenses = Expense.objects.filter(owner=owner)
            rooms = Room.objects.filter(owner=owner)
        else:
            # Fallback for unlinked staff
            return Response({"error": "No Hotel Profile Linked"}, status=400)

        # 1. Revenue
        rev_stats = bookings.aggregate(
            total_rev=Sum('total_amount'),
            total_tax=Sum('tax_amount'),
            total_advance=Sum('advance_paid')
        )

        # 2. Expense
        exp_total = expenses.aggregate(total_exp=Sum('amount'))['total_exp'] or 0

        # 3. Conversions
        total_revenue = float(rev_stats['total_rev'] or 0)
        total_tax = float(rev_stats['total_tax'] or 0)
        total_advance = float(rev_stats['total_advance'] or 0)
        total_expenses = float(exp_total)
        net_profit = total_revenue - total_expenses

        # 4. Occupancy
        total_room_count = rooms.count()
        occupied_count = rooms.filter(status='OCCUPIED').count()
        occupancy_rate = (occupied_count / total_room_count * 100) if total_room_count > 0 else 0

        # 5. Trend (Scoped)
        raw_trend = bookings.annotate(date=TruncDate('check_in_date')) \
            .values('date') \
            .annotate(daily_revenue=Sum('total_amount')) \
            .order_by('-date')[:7]

        formatted_trend = [{
            "date": item['date'],
            "daily_revenue": float(item['daily_revenue'] or 0)
        } for item in raw_trend]

        return Response({
            "financials": {
                "total_rev": total_revenue,
                "total_tax": total_tax,
                "total_advance": total_advance,
                "total_expenses": total_expenses,
                "net_profit": net_profit
            },
            "occupancy": round(occupancy_rate, 1),
            "trend": formatted_trend,
            "room_count": total_room_count
        })

# ==============================
# 5. PUBLIC / UTILITY
# ==============================

class PublicFolioView(APIView):
    permission_classes = [permissions.AllowAny] 
    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response({"error": "Not Found"}, status=404)

# ==============================
# 📄 PDF INVOICE GENERATOR
# ==============================
class InvoicePDFView(APIView):
    permission_classes = [permissions.AllowAny] # Or IsAuthenticated if you prefer strictness

    def get(self, request, booking_id):
        try:
            # 1. Fetch Data
            booking = Booking.objects.get(id=booking_id)
            charges = BookingCharge.objects.filter(booking=booking)
            
            # 2. Get Hotel Settings (Owner of the booking)
            hotel_settings = PropertySetting.objects.filter(owner=booking.owner).first()
            
            # 3. Prepare Context for HTML
            context = {
                'hotel_name': hotel_settings.hotel_name if hotel_settings else "Atithi Hotel",
                'hotel_address': hotel_settings.address if hotel_settings else "",
                'hotel_phone': hotel_settings.contact_number if hotel_settings else "",
                'hotel_email': hotel_settings.email if hotel_settings else "",
                'hotel_gstin': hotel_settings.gstin if hotel_settings else "Unregistered",
                'currency': hotel_settings.currency_symbol if hotel_settings else "₹",
                
                'booking_id': booking.id,
                'date_now': timezone.now().strftime("%d %b %Y"),
                'guest_name': booking.guest.full_name,
                'guest_phone': booking.guest.phone,
                'guest_address': booking.guest.address,
                
                'room_number': booking.room.room_number if booking.room else "N/A",
                'room_type': booking.room.room_type if booking.room else "-",
                'check_in': booking.check_in_date.strftime("%d %b %Y"),
                'check_out': booking.check_out_date.strftime("%d %b %Y"),
                'nights': (booking.check_out_date - booking.check_in_date).days or 1,
                
                'room_total': booking.total_amount, # Assuming this stores room cost + tax
                'charges': charges,
                'subtotal': booking.subtotal_amount + sum(c.subtotal for c in charges),
                'tax': booking.tax_amount + sum(c.tax_amount for c in charges),
                'advance': booking.advance_paid,
                'balance': booking.balance_due
            }

            # 4. Render HTML
            template_path = 'hotel/templates/invoice.html'
            template = get_template(template_path)
            html = template.render(context)

            # 5. Convert to PDF
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_{booking_id}.pdf"'
            
            pisa_status = pisa.CreatePDF(html, dest=response)
            
            if pisa_status.err:
                return HttpResponse('We had some errors <pre>' + html + '</pre>')
            return response

        except Booking.DoesNotExist:
            return HttpResponse("Booking not found", status=404)
        except Exception as e:
            return HttpResponse(f"Error generating PDF: {str(e)}", status=500)
        


def seed_data_trigger(request):
    try:
        call_command('seed_data')
        return JsonResponse({"status": "Success", "message": "DB Seeded!"})
    except Exception as e:
        return JsonResponse({"status": "Error", "message": str(e)})
    
# ==============================
# 📊 REPORTS & EXCEL EXPORT
# ==============================

class AdvancedAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        owner = get_hotel_owner(user)
        
        # Date Filter (Default: Last 30 Days)
        start_date_str = request.query_params.get('start')
        end_date_str = request.query_params.get('end')
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)

        if start_date_str and end_date_str:
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)

        # Scoped Data
        if user.is_superuser:
            bookings = Booking.objects.filter(created_at__range=[start_date, end_date])
            expenses = Expense.objects.filter(date__range=[start_date, end_date])
        elif owner:
            bookings = Booking.objects.filter(owner=owner, created_at__range=[start_date, end_date])
            expenses = Expense.objects.filter(owner=owner, date__range=[start_date, end_date])
        else:
            return Response({"error": "No Access"}, status=400)

        # 1. Financial Pie Chart Data
        income = bookings.aggregate(sum=Sum('total_amount'))['sum'] or 0
        expense = expenses.aggregate(sum=Sum('amount'))['sum'] or 0
        profit = income - expense

        # 2. Daily Bar Chart Data
        daily_income = bookings.annotate(day=TruncDate('created_at')).values('day').annotate(amount=Sum('total_amount')).order_by('day')
        daily_expense = expenses.annotate(day=TruncDate('date')).values('day').annotate(amount=Sum('amount')).order_by('day')
        
        # Merge Data for Chart
        chart_data = []
        # (Simplified merging logic for the frontend to handle)
        for i in daily_income:
            chart_data.append({"date": i['day'], "income": i['amount'], "expense": 0})
        
        return Response({
            "summary": {"income": income, "expense": expense, "profit": profit},
            "chart_data": chart_data
        })

class ExportReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        owner = get_hotel_owner(user)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="daily_report.csv"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Type', 'Description', 'Amount', 'Payment Mode'])

        if owner:
            bookings = Booking.objects.filter(owner=owner)
            expenses = Expense.objects.filter(owner=owner)

            for b in bookings:
                writer.writerow([b.created_at.date(), 'INCOME', f'Booking #{b.id} - {b.guest_name}', b.total_amount, b.payment_status])
            
            for e in expenses:
                writer.writerow([e.date, 'EXPENSE', e.description, e.amount, e.category])

        return response

# ==============================
# 💳 LICENSE MANAGEMENT
# ==============================
class ActivateLicenseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        key = request.data.get('license_key')
        user = request.user
        
        # Simple Validation Logic (You can make this complex later)
        # Format: ATITHI-PRO-365 (Adds 365 days)
        if key == "ATITHI-PRO-365":
            sub, created = Subscription.objects.get_or_create(owner=get_hotel_owner(user))
            sub.plan_name = "PRO"
            sub.expiry_date = timezone.now() + timedelta(days=365)
            sub.is_active = True
            sub.save()
            return Response({"status": "Activated", "days": 365})
        
        return Response({"error": "Invalid License Key"}, status=400)

class CheckLicenseView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        owner = get_hotel_owner(request.user)
        if not owner: return Response({"status": "Active", "days": 999}) # Superuser
        
        sub, created = Subscription.objects.get_or_create(owner=owner)
        return Response({
            "is_active": sub.is_active and sub.days_left > 0,
            "days_left": sub.days_left,
            "plan": sub.plan_name
        })
    

# ==============================
# 💳 PAYMENT GATEWAY (RAZORPAY)
# ==============================

class CreatePaymentOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            plan_price = request.data.get('amount') # e.g., 999
            plan_name = request.data.get('plan_name') # e.g., 'STARTER'
            
            # Initialize Razorpay Client (We will set keys in settings.py next)
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            
            # Razorpay expects amount in PAISE (multiply by 100)
            data = {
                "amount": int(plan_price) * 100,
                "currency": "INR",
                "receipt": f"sub_{request.user.id}",
                "payment_capture": 1
            }
            order = client.order.create(data=data)
            
            # Save a pending payment record
            sub = Subscription.objects.get(owner=get_hotel_owner(request.user))
            Payment.objects.create(
                subscription=sub,
                razorpay_order_id=order['id'],
                amount=plan_price,
                status='PENDING'
            )

            return Response(order)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            # Verify Signature
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            
            check = {
                'razorpay_order_id': data['razorpay_order_id'],
                'razorpay_payment_id': data['razorpay_payment_id'],
                'razorpay_signature': data['razorpay_signature']
            }
            
            if client.utility.verify_payment_signature(check):
                # ✅ PAYMENT SUCCESS!
                
                # 1. Update Payment Record
                payment = Payment.objects.get(razorpay_order_id=data['razorpay_order_id'])
                payment.razorpay_payment_id = data['razorpay_payment_id']
                payment.status = 'SUCCESS'
                payment.save()
                
                # 2. AUTO-ACTIVATE SUBSCRIPTION
                sub = payment.subscription
                sub.is_active = True
                
                # Logic: Add 30 days to existing expiry, or reset if already expired
                now = timezone.now()
                if sub.expiry_date and sub.expiry_date > now:
                    sub.expiry_date += timedelta(days=30) # Extend
                else:
                    sub.expiry_date = now + timedelta(days=30) # Reset/Start Fresh
                
                sub.save()
                
                return Response({"status": "Payment Verified & License Extended!"})
            else:
                return Response({"error": "Signature Verification Failed"}, status=400)
                
        except Exception as e:
            print(e)
            return Response({"error": "Verification Failed"}, status=500)