from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from django.utils import timezone
from django.db.models import Sum, Q
from django.db.models.functions import TruncDate
from django.http import JsonResponse, HttpResponse
from django.core.management import call_command
from django.template.loader import get_template, render_to_string
from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings
from django.core.mail import EmailMessage, get_connection
from django.utils.dateparse import parse_date

import csv
import razorpay
import uuid 
from datetime import timedelta
from io import BytesIO
from xhtml2pdf import pisa

# ==============================
# 📦 IMPORT MODELS & SERIALIZERS
# ==============================
from .models import (
    Guest, Room, Booking, Service, BookingCharge, Expense, PropertySetting,
    InventoryItem, HousekeepingTask 
)
from .serializers import (
    GuestSerializer, 
    RoomSerializer, 
    BookingSerializer, 
    ServiceSerializer, 
    BookingChargeSerializer,
    ExpenseSerializer,
    PropertySettingSerializer,
    InventoryItemSerializer,      
    HousekeepingTaskSerializer    
)
from core.models import Subscription, Payment, HotelSMTPSettings

# Initialize User Model
User = get_user_model()

# ==============================
# 💳 RAZORPAY CONFIG (FORCE LIVE)
# ==============================
RAZORPAY_LIVE_ID = "rzp_live_RvBOgLN1rxP9zd"
RAZORPAY_LIVE_SECRET = "LhT40VfsBxIX5VUJjrTE2W9h"

razorpay_client = razorpay.Client(auth=(RAZORPAY_LIVE_ID, RAZORPAY_LIVE_SECRET))

# ==============================
# 🔐 UTILITY: Get the Hotel Owner
# ==============================
def get_hotel_owner(user):
    """
    Returns the Owner User instance based on the logged-in user's role.
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
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser: return Guest.objects.all()
        owner = get_hotel_owner(user)
        return Guest.objects.filter(owner=owner) if owner else Guest.objects.none()

    def perform_create(self, serializer):
        owner = get_hotel_owner(self.request.user)
        serializer.save(owner=owner)

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser: return Room.objects.all()
        owner = get_hotel_owner(user)
        return Room.objects.filter(owner=owner) if owner else Room.objects.none()

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
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Booking.objects.select_related('guest', 'room', 'owner').prefetch_related('charges')
        if user.is_superuser: return queryset.all()
        owner = get_hotel_owner(user)
        return queryset.filter(owner=owner) if owner else Booking.objects.none()

    def perform_create(self, serializer):
        owner = get_hotel_owner(self.request.user)
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
                return Response({'status': 'Email functionality ready'})
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
# 2. POS, SERVICES & INVENTORY
# ==============================

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser: return InventoryItem.objects.all()
        return InventoryItem.objects.filter(owner=get_hotel_owner(user))

    def perform_create(self, serializer):
        serializer.save(owner=get_hotel_owner(self.request.user))

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser: return Service.objects.all()
        return Service.objects.filter(owner=get_hotel_owner(user))

    def perform_create(self, serializer):
        serializer.save(owner=get_hotel_owner(self.request.user))

class BookingChargeViewSet(viewsets.ModelViewSet):
    queryset = BookingCharge.objects.all()
    serializer_class = BookingChargeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser: return BookingCharge.objects.all()
        owner = get_hotel_owner(user)
        return BookingCharge.objects.filter(booking__owner=owner)

    def perform_create(self, serializer):
        serializer.save()

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser: return Expense.objects.all()
        return Expense.objects.filter(owner=get_hotel_owner(user))

    def perform_create(self, serializer):
        serializer.save(owner=get_hotel_owner(self.request.user), paid_by=self.request.user)

# ==============================
# 3. HOUSEKEEPING
# ==============================

class HousekeepingTaskViewSet(viewsets.ModelViewSet):
    queryset = HousekeepingTask.objects.all()
    serializer_class = HousekeepingTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser: return HousekeepingTask.objects.all()
        return HousekeepingTask.objects.filter(owner=get_hotel_owner(user))

    def perform_create(self, serializer):
        serializer.save(owner=get_hotel_owner(self.request.user))

# ==============================
# 4. SETTINGS (SAAS ISOLATION)
# ==============================

class SettingViewSet(viewsets.ModelViewSet):
    queryset = PropertySetting.objects.all()
    serializer_class = PropertySettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser: return PropertySetting.objects.all()
        owner = get_hotel_owner(user)
        if owner: return PropertySetting.objects.filter(owner=owner)
        return PropertySetting.objects.none()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# ==============================
# 5. EXECUTIVE ANALYTICS
# ==============================

class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        owner = get_hotel_owner(user)
        
        if user.is_superuser:
            bookings = Booking.objects.all()
            expenses = Expense.objects.all()
            rooms = Room.objects.all()
        elif owner:
            bookings = Booking.objects.filter(owner=owner)
            expenses = Expense.objects.filter(owner=owner)
            rooms = Room.objects.filter(owner=owner)
        else:
            return Response({"error": "No Hotel Profile Linked"}, status=400)

        # Revenue
        rev_stats = bookings.aggregate(
            total_rev=Sum('total_amount'),
            total_tax=Sum('tax_amount'),
            total_advance=Sum('advance_paid')
        )
        exp_total = expenses.aggregate(total_exp=Sum('amount'))['total_exp'] or 0

        # Calculations
        total_revenue = float(rev_stats['total_rev'] or 0)
        total_tax = float(rev_stats['total_tax'] or 0)
        total_advance = float(rev_stats['total_advance'] or 0)
        total_expenses = float(exp_total)
        net_profit = total_revenue - total_expenses

        # Occupancy
        total_room_count = rooms.count()
        occupied_count = rooms.filter(status='OCCUPIED').count()
        occupancy_rate = (occupied_count / total_room_count * 100) if total_room_count > 0 else 0

        # Trend
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
                "total_expenses": total_expenses,
                "net_profit": net_profit,
                "total_advance": float(rev_stats['total_advance'] or 0)
            },
            "occupancy": round(occupancy_rate, 1),
            "trend": formatted_trend,
            "room_count": total_room_count
        })

# ==============================
# 6. PUBLIC / UTILITY
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
    permission_classes = [permissions.AllowAny]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
            charges = BookingCharge.objects.filter(booking=booking)
            hotel_settings = PropertySetting.objects.filter(owner=booking.owner).first()
            
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
                
                'room_total': booking.total_amount,
                'charges': charges,
                'subtotal': booking.subtotal_amount + sum(c.subtotal for c in charges),
                'tax': booking.tax_amount + sum(c.tax_amount for c in charges),
                'advance': booking.advance_paid,
                'balance': booking.balance_due
            }

            template_path = 'hotel/templates/invoice.html'
            template = get_template(template_path)
            html = template.render(context)

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

# ==============================
# 💳 SUBSCRIPTION PAYMENT (SAAS ONLY)
# ==============================

class CreatePaymentOrderView(APIView):
    """
    Creates an Order ID for SUBSCRIPTIONS (Hotel Owners Paying You).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            plan_price = request.data.get('amount')
            
            data = {
                "amount": int(plan_price) * 100,
                "currency": "INR",
                "receipt": f"sub_{request.user.id}",
                "payment_capture": 1
            }
            order = razorpay_client.order.create(data=data)
            
            sub = Subscription.objects.get(owner=get_hotel_owner(request.user))
            Payment.objects.create(
                subscription=sub,
                razorpay_order_id=order['id'],
                amount=plan_price,
                status='PENDING'
            )

            # 👇 CRITICAL FIX: Return the Key ID to frontend so the popup opens
            response_data = order
            response_data['key_id'] = RAZORPAY_LIVE_ID 
            
            return Response(response_data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class VerifyPaymentView(APIView):
    """
    Verifies Subscription Payment Signature and extends license
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            check = {
                'razorpay_order_id': data['razorpay_order_id'],
                'razorpay_payment_id': data['razorpay_payment_id'],
                'razorpay_signature': data['razorpay_signature']
            }
            
            # Verify Signature
            razorpay_client.utility.verify_payment_signature(check)
            
            # Update Payment Record
            payment = Payment.objects.get(razorpay_order_id=data['razorpay_order_id'])
            payment.razorpay_payment_id = data['razorpay_payment_id']
            payment.status = 'SUCCESS'
            payment.save()
            
            # Extend Subscription License
            sub = payment.subscription
            sub.is_active = True
            
            now = timezone.now()
            # If expired, start from now. If active, add to existing expiry.
            if sub.expiry_date and sub.expiry_date > now:
                sub.expiry_date += timedelta(days=365) # Add 1 year
            else:
                sub.expiry_date = now + timedelta(days=365)
            
            sub.plan_name = "PRO"
            sub.save()
            
            return Response({"status": "Payment Verified & License Extended!"})
            
        except Exception as e:
            print(f"Sub Verify Error: {e}")
            return Response({"error": "Verification Failed"}, status=400)

# ==============================
# 📧 EMAIL AUTOMATION
# ==============================

class EmailInvoiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            owner = get_hotel_owner(request.user)
            booking = Booking.objects.get(id=pk, owner=owner)
            charges = BookingCharge.objects.filter(booking=booking)
            
            if not booking.guest.email:
                return Response({"error": "Guest has no email address."}, status=400)

            try:
                smtp_config = HotelSMTPSettings.objects.get(owner=owner)
                connection = get_connection(
                    host=smtp_config.email_host,
                    port=smtp_config.email_port,
                    username=smtp_config.email_host_user,
                    password=smtp_config.email_host_password,
                    use_tls=True
                )
                sender_email = smtp_config.email_host_user
            except HotelSMTPSettings.DoesNotExist:
                return Response({"error": "Configure SMTP Settings first."}, status=400)

            template_path = 'hotel/templates/invoice.html'
            context = {'booking': booking, 'charges': charges, 'total': booking.total_amount, 'owner': booking.owner}
            html = render_to_string(template_path, context)
            result = BytesIO()
            pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
            
            if pdf.err: return Response({"error": "PDF Error"}, status=500)

            subject = f"Invoice from {owner.hotel_name if hasattr(owner, 'hotel_name') else 'Hotel'}"
            message = f"Dear {booking.guest.full_name},\n\nPlease find attached your invoice.\n\nRegards,\n{owner.hotel_name if hasattr(owner, 'hotel_name') else 'Hotel'}"
            
            email = EmailMessage(
                subject,
                message,
                sender_email,
                [booking.guest.email],
                connection=connection
            )
            email.attach(f'Invoice_{booking.id}.pdf', result.getvalue(), 'application/pdf')
            email.send()

            return Response({"status": "Email Sent! 📧"})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
class HotelSMTPSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            conf = HotelSMTPSettings.objects.get(owner=get_hotel_owner(request.user))
            return Response({
                "email": conf.email_host_user,
                "has_password": True
            })
        except HotelSMTPSettings.DoesNotExist:
            return Response({"email": "", "has_password": False})

    def post(self, request):
        owner = get_hotel_owner(request.user)
        email = request.data.get('email')
        password = request.data.get('password')

        obj, created = HotelSMTPSettings.objects.get_or_create(owner=owner)
        obj.email_host_user = email
        if password:
            obj.email_host_password = password
        obj.save()

        return Response({"status": "Saved!"})

# ==============================
# 🚀 REGISTRATION & AUTH
# ==============================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    try:
        data = request.data
        if User.objects.filter(username=data.get('username')).exists():
            return Response({'detail': 'Username taken'}, status=400)
        
        with transaction.atomic():
            user = User.objects.create_user(
                username=data.get('username'), 
                email=data.get('email'), 
                password=data.get('password'), 
                phone=data.get('phone'),
                role='OWNER' 
            )
            PropertySetting.objects.create(owner=user, hotel_name=data.get('hotel_name', "My Hotel"))
            Subscription.objects.create(owner=user, plan_name='TRIAL', is_active=True, expiry_date=timezone.now() + timedelta(days=14), license_key=str(uuid.uuid4()))
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_role': 'OWNER', 
                'username': user.username,
                'hotel_name': data.get('hotel_name', "My Hotel")
            }, status=201)
    except Exception as e:
        return Response({'detail': str(e)}, status=500)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user_role'] = self.user.role
        data['username'] = self.user.username
        data['hotel_name'] = self.user.get_hotel_name()
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# 🪄 MISC / REPORTS
class AdvancedAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({"status": "Advanced stats active"})

class ExportReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="report.csv"'
        return response

class ActivateLicenseView(APIView):
    def post(self, request): return Response({"status": "Active"})

class CheckLicenseView(APIView):
    def get(self, request):
        sub, _ = Subscription.objects.get_or_create(owner=get_hotel_owner(request.user))
        return Response({"is_active": sub.is_active, "days_left": sub.days_left})

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def seed_data_trigger(request):
    try:
        call_command('seed_data')
        return JsonResponse({"status": "Success"})
    except: return JsonResponse({"status": "Error"})