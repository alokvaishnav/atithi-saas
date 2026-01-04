from rest_framework import viewsets, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

from django.db.models import Sum, Count, Q, F
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, date
import csv
import json

# --- PDF Generation Imports ---
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
except ImportError:
    pass 

# --- Local Imports ---
from .utils import generate_ical_for_room, send_booking_email
from .models import (
    Room, Booking, HotelSettings, Guest, InventoryItem, Expense, 
    MenuItem, Order, HousekeepingTask, ActivityLog, BookingCharge, 
    BookingPayment, PlatformSettings
)
from .serializers import (
    RoomSerializer, BookingSerializer, GuestSerializer, InventorySerializer, 
    ExpenseSerializer, MenuItemSerializer, OrderSerializer, HousekeepingTaskSerializer,
    ActivityLogSerializer, StaffSerializer, HotelSettingsSerializer,
    PublicHotelSerializer, PublicRoomSerializer, PlatformSettingsSerializer
)
from core.models import CustomUser

# ==============================================================================
# 1. AUTHENTICATION & ONBOARDING
# ==============================================================================

class CustomTokenSerializer(TokenObtainPairSerializer):
    """
    Custom JWT Token that includes user Role, ID, and Hotel Name payload.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra user data to the response
        data['username'] = self.user.username
        data['role'] = self.user.role
        data['id'] = self.user.id
        data['is_superuser'] = self.user.is_superuser
        
        # Smartly fetch Hotel Name based on Role
        try: 
            if self.user.role == 'OWNER':
                # Owner sees their own settings
                settings = getattr(self.user, 'hotel_settings', None)
                data['hotel_name'] = settings.hotel_name if settings else 'Unconfigured'
                data['hotel_setup'] = settings.hotel_name != "My Hotel"
            else:
                # Staff sees their Owner's settings
                owner = self.user.hotel_owner
                if owner and hasattr(owner, 'hotel_settings'):
                    data['hotel_name'] = owner.hotel_settings.hotel_name
                else:
                    data['hotel_name'] = 'Atithi HMS'
        except Exception: 
            data['hotel_name'] = 'Atithi HMS'
            
        return data

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer

class RegisterView(APIView):
    """
    Registers a new SaaS Tenant (Hotel Owner).
    Automatically creates a HotelSettings object for them.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        data = request.data
        try:
            if CustomUser.objects.filter(username=data.get('username')).exists():
                return Response({'error': 'Username already exists'}, status=400)
            
            # Create the Owner User
            user = CustomUser.objects.create_user(
                username=data['username'], 
                email=data.get('email', ''), 
                password=data['password'], 
                role='OWNER',
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', '')
            )
            
            # Create Default Hotel Settings immediately
            HotelSettings.objects.create(owner=user, hotel_name=data.get('hotel_name', 'My Hotel'))
            
            return Response({'status': 'Success', 'message': 'Account created successfully'}, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        if not email: return Response({'error': 'Email required'}, status=400)
        # TODO: Integrate SendGrid/SMTP here using PlatformSettings
        return Response({'status': 'Email Sent (Mock)'})

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        return Response({'status': 'Password Reset Successful'})


# ==============================================================================
# 2. BASE SAAS VIEWSET (MULTI-TENANCY CORE)
# ==============================================================================

class BaseSaaSViewSet(viewsets.ModelViewSet):
    """
    Core ViewSet that implements Multi-Tenancy.
    It automatically filters data so Users ONLY see data belonging to their Hotel Owner.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_owner(self):
        # Identify who the data belongs to
        if self.request.user.role == 'OWNER':
            return self.request.user
        return self.request.user.hotel_owner

    def get_queryset(self):
        owner = self.get_owner()
        if not owner:
            return self.queryset.none() # Return empty if orphan user
        return self.queryset.filter(owner=owner)

    def perform_create(self, serializer):
        # Automatically assign the correct owner when creating data
        serializer.save(owner=self.get_owner())


# ==============================================================================
# 3. HOTEL OPERATIONS MODULES
# ==============================================================================

class RoomViewSet(BaseSaaSViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    
    @action(detail=True, methods=['patch'], url_path='mark-clean')
    def mark_clean(self, request, pk=None):
        room = self.get_object()
        room.status = 'AVAILABLE'
        room.save()
        
        # Auto-close housekeeping tasks for this room
        HousekeepingTask.objects.filter(room=room, status='PENDING').update(status='COMPLETED')

        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='HOUSEKEEPING',
            details=f"Room {room.room_number} marked CLEAN by {request.user.username}"
        )
        return Response({'status': 'Room Cleaned'})

    @action(detail=True, methods=['patch'], url_path='mark-dirty')
    def mark_dirty(self, request, pk=None):
        room = self.get_object()
        room.status = 'DIRTY'
        room.save()
        return Response({'status': 'Room Marked Dirty'})

class BookingViewSet(BaseSaaSViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    def get_queryset(self):
        # Optimization: Prefetch related data to minimize DB queries
        return super().get_queryset().select_related('guest', 'room').prefetch_related('payments', 'charges')

    @action(detail=True, methods=['get'])
    def folio(self, request, pk=None):
        """Calculates the full bill (Folio) for a booking"""
        booking = self.get_object()
        charges = BookingCharge.objects.filter(booking=booking)
        payments = BookingPayment.objects.filter(booking=booking)
        
        total_charges = sum(c.amount for c in charges) + booking.total_amount
        total_paid = sum(p.amount for p in payments)
        
        return Response({
            'booking_id': booking.id,
            'guest_name': booking.guest.full_name if booking.guest else 'Unknown',
            'room_number': booking.room.room_number if booking.room else 'N/A',
            'check_in': booking.check_in_date,
            'check_out': booking.check_out_date,
            'total_amount': total_charges,
            'paid_amount': total_paid,
            'balance': total_charges - total_paid,
            'status': booking.status,
            'charges': [{'description': c.description, 'amount': c.amount, 'date': c.date} for c in charges],
            'payments': [{'id': p.id, 'method': p.payment_mode, 'amount': p.amount, 'date': p.date} for p in payments]
        })

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        booking = self.get_object()
        amount = request.data.get('amount')
        mode = request.data.get('method', 'CASH')
        
        if not amount:
            return Response({'error': 'Amount is required'}, status=400)

        BookingPayment.objects.create(booking=booking, amount=amount, payment_mode=mode)
        
        # Check if fully paid
        charges = BookingCharge.objects.filter(booking=booking).aggregate(Sum('amount'))['amount__sum'] or 0
        total_due = booking.total_amount + charges
        total_paid = BookingPayment.objects.filter(booking=booking).aggregate(Sum('amount'))['amount__sum'] or 0
        
        if total_paid >= total_due:
            booking.payment_status = 'PAID'
            booking.save()
        
        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='PAYMENT',
            details=f"Received {amount} via {mode} for Booking #{booking.id}"
        )
        return Response({'status': 'Payment Recorded', 'new_balance': total_due - total_paid})

    @action(detail=True, methods=['post'])
    def charges(self, request, pk=None):
        booking = self.get_object()
        desc = request.data.get('description')
        amount = request.data.get('amount')
        BookingCharge.objects.create(booking=booking, description=desc, amount=amount)
        return Response({'status': 'Charge Added'})

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        booking = self.get_object()
        
        # 1. Update Booking Status
        booking.status = 'CHECKED_OUT'
        booking.checked_out_at = timezone.now()
        booking.save()
        
        # 2. Update Room Status -> Dirty
        if booking.room:
            booking.room.status = 'DIRTY'
            booking.room.save()
            
            # 3. Create Housekeeping Task
            HousekeepingTask.objects.create(
                owner=self.get_owner(),
                room=booking.room,
                task_type='CLEANING',
                priority='HIGH',
                description=f"Checkout cleaning for Guest {booking.guest.full_name}"
            )

        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='CHECKOUT',
            details=f"Checked out Guest {booking.guest.full_name}"
        )
        return Response({'status': 'Checked Out'})

    # Public endpoint for digital folio (No Auth Required for Guest View via QR)
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny], url_path='public_folio')
    def public_folio(self, request, pk=None):
        return self.folio(request, pk)


class GuestViewSet(BaseSaaSViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer

class InventoryViewSet(BaseSaaSViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventorySerializer

class ExpenseViewSet(BaseSaaSViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class MenuItemViewSet(BaseSaaSViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer

class OrderViewSet(BaseSaaSViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class HousekeepingViewSet(BaseSaaSViewSet):
    queryset = HousekeepingTask.objects.all()
    serializer_class = HousekeepingTaskSerializer

class ActivityLogViewSet(BaseSaaSViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer


# ==============================================================================
# 4. STAFF MANAGEMENT
# ==============================================================================

class StaffViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StaffSerializer
    
    def get_queryset(self):
        # Owners see their staff. Staff see their colleagues (or restricted).
        user = self.request.user
        owner = user if user.role == 'OWNER' else user.hotel_owner
        return CustomUser.objects.filter(hotel_owner=owner).exclude(id=owner.id)

class StaffRegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'OWNER' and not request.user.is_superuser:
            return Response({'error': 'Only Owners can add staff'}, status=403)
            
        data = request.data
        try:
            user = CustomUser.objects.create_user(
                username=data['username'],
                email=data.get('email', ''),
                password=data['password'],
                role=data.get('role', 'RECEPTIONIST'),
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                hotel_owner=request.user # Link new staff to the Owner
            )
            return Response({'status': 'Staff Created', 'id': user.id})
        except Exception as e: 
            return Response({'error': str(e)}, status=400)


# ==============================================================================
# 5. SETTINGS & ANALYTICS
# ==============================================================================

class SettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_owner(self, request):
        return request.user if request.user.role == 'OWNER' else request.user.hotel_owner

    def get(self, request):
        settings, _ = HotelSettings.objects.get_or_create(owner=self.get_owner(request))
        return Response(HotelSettingsSerializer(settings).data)
        
    def post(self, request):
        settings, _ = HotelSettings.objects.get_or_create(owner=self.get_owner(request))
        serializer = HotelSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        owner = request.user if request.user.role == 'OWNER' else request.user.hotel_owner
        
        # 1. Total Booking Revenue
        booking_rev = Booking.objects.filter(owner=owner).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # 2. Total Extra Charges
        extras_rev = BookingCharge.objects.filter(booking__owner=owner).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total_revenue = booking_rev + extras_rev
        
        # 3. Total Expenses
        total_expenses = Expense.objects.filter(owner=owner).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # 4. Operational Counts
        active_bookings = Booking.objects.filter(owner=owner, status='CHECKED_IN').count()
        rooms_available = Room.objects.filter(owner=owner, status='AVAILABLE').count()
        
        # 5. Last 7 Days Trend
        today = datetime.now().date()
        trend = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            # Sum payments made on this specific day
            day_rev = BookingPayment.objects.filter(booking__owner=owner, date=d).aggregate(Sum('amount'))['amount__sum'] or 0
            trend.append({'date': d.isoformat(), 'daily_revenue': day_rev})

        return Response({
            'financials': {
                'total_rev': total_revenue,
                'total_expenses': total_expenses,
                'net_profit': total_revenue - total_expenses
            },
            'operational': {
                'active_bookings': active_bookings,
                'rooms_available': rooms_available
            },
            'trend': trend
        })


# ==============================================================================
# 6. POS SYSTEM
# ==============================================================================

class POSChargeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        owner = request.user if request.user.role == 'OWNER' else request.user.hotel_owner
        data = request.data
        
        total_amt = data.get('total_amount')
        method = data.get('payment_method') # 'ROOM', 'CASH', 'UPI'
        booking_id = data.get('booking_id')
        items = data.get('items') # JSON list
        
        # A. Charge to Room Bill
        if method == 'ROOM' and booking_id:
            booking = get_object_or_404(Booking, id=booking_id, owner=owner)
            
            # Create Charge
            BookingCharge.objects.create(
                booking=booking,
                description="Restaurant/Service Charge",
                amount=total_amt
            )
            
            # Create Order
            Order.objects.create(
                owner=owner,
                booking=booking,
                items=json.dumps(items),
                total_amount=total_amt,
                status='BILLED'
            )
            return Response({'status': 'Charged to Room'})
            
        # B. Direct Payment
        Order.objects.create(
            owner=owner,
            items=json.dumps(items),
            total_amount=total_amt,
            status='COMPLETED'
        )
        
        return Response({'status': 'Payment Processed'})


# ==============================================================================
# 7. LICENSING & EXTERNAL
# ==============================================================================

class LicenseStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        # Mock Logic: In production, check expiry date in Database
        return Response({
            'status': 'ACTIVE', 
            'days_left': 365, 
            'expiry_date': (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'),
            'is_expired': False
        })

class LicenseActivateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        key = request.data.get('license_key')
        # Validate key logic here
        return Response({'status': 'ACTIVE', 'expiry_date': '2030-01-01'})

class RoomICalView(APIView):
    permission_classes = [permissions.AllowAny] # Must be public for OTAs to fetch
    
    def get(self, request, room_id):
        # 1. Fetch Room (Anyone can fetch if they have ID, security via obscurity URL in Prod)
        room = get_object_or_404(Room, id=room_id)
        
        # 2. Generate iCal content
        try:
            ical_content = generate_ical_for_room(room)
            
            # 3. Return as File
            response = HttpResponse(ical_content, content_type='text/calendar')
            filename = f"room_{room.room_number}_calendar.ics"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ==============================================================================
# 8. REPORTS & PDF GENERATION
# ==============================================================================

class DailyReportPDFView(APIView):
    # AllowAny so we can manually check token inside get() from URL param
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # --- LOGIC TO ALLOW URL TOKEN FOR DOWNLOADS ---
        token = request.query_params.get('token')
        if token:
            try:
                validated_token = JWTAuthentication().get_validated_token(token)
                user = JWTAuthentication().get_user(validated_token)
                if user:
                    request.user = user
            except (AuthenticationFailed, Exception):
                pass # If token invalid, fall back to default auth check
        # --------------------------------------------------

        # If still not authenticated, deny
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=401)

        # Prepare PDF response
        response = HttpResponse(content_type='application/pdf')
        filename = f"Night_Audit_{datetime.now().strftime('%Y-%m-%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Create PDF canvas
        p = canvas.Canvas(response, pagesize=letter)
        owner = request.user.hotel_owner if request.user.role != 'OWNER' else request.user
        hotel_name = owner.hotel_settings.hotel_name if hasattr(owner, 'hotel_settings') else "Atithi HMS"

        # --- PDF CONTENT ---
        p.setFont("Helvetica-Bold", 18)
        p.drawString(50, 750, f"{hotel_name} - Night Audit")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, 720, f"Date: {datetime.now().strftime('%d %B %Y')}")
        p.drawString(50, 700, f"Generated By: {request.user.username}")
        
        p.line(50, 680, 550, 680)
        
        # Fetch Real Data
        today_start = datetime.now().date()
        
        today_payments = BookingPayment.objects.filter(booking__owner=owner, date=today_start).aggregate(Sum('amount'))['amount__sum'] or 0
        today_expenses = Expense.objects.filter(owner=owner, date=today_start).aggregate(Sum('amount'))['amount__sum'] or 0
        occupancy = Booking.objects.filter(owner=owner, status='CHECKED_IN').count()
        
        p.drawString(50, 650, f"Total Revenue Collected: Rs. {today_payments}")
        p.drawString(50, 630, f"Total Expenses: Rs. {today_expenses}")
        p.drawString(50, 610, f"Current Occupancy: {occupancy} Rooms")
        p.drawString(50, 590, f"Net Daily Cash Flow: Rs. {today_payments - today_expenses}")
        
        p.showPage()
        p.save()
        return response

class ReportExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        report_type = request.query_params.get('type', 'bookings')
        owner = request.user.hotel_owner if request.user.role != 'OWNER' else request.user
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_export.csv"'
        
        writer = csv.writer(response)
        
        if report_type == 'bookings':
            writer.writerow(['ID', 'Guest Name', 'Room', 'Check-In', 'Check-Out', 'Total Amount', 'Status'])
            bookings = Booking.objects.filter(owner=owner)
            for b in bookings:
                room_num = b.room.room_number if b.room else 'N/A'
                guest_name = b.guest.full_name if b.guest else 'Unknown'
                writer.writerow([b.id, guest_name, room_num, b.check_in_date, b.check_out_date, b.total_amount, b.status])
                
        elif report_type == 'expenses':
            writer.writerow(['Date', 'Category', 'Description', 'Amount'])
            expenses = Expense.objects.filter(owner=owner)
            for e in expenses:
                writer.writerow([e.date, e.category, e.description, e.amount])
                
        return response


# ==============================================================================
# 9. SUPER ADMIN (PLATFORM OWNER)
# ==============================================================================

class PlatformSettingsView(APIView):
    """
    Manages Global SaaS Config: Logo, SMTP, Support Info.
    Singleton pattern enforced in Model.
    """
    permission_classes = [permissions.IsAdminUser] # Only Super Admin/CEO

    def get(self, request):
        settings, _ = PlatformSettings.objects.get_or_create(id=1)
        serializer = PlatformSettingsSerializer(settings)
        return Response(serializer.data)

    def post(self, request):
        settings, _ = PlatformSettings.objects.get_or_create(id=1)
        serializer = PlatformSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class SuperAdminStatsView(APIView):
    permission_classes = [permissions.IsAdminUser] # Ensures is_superuser=True
    
    def get(self, request):
        User = get_user_model()
        
        total_hotels = CustomUser.objects.filter(role='OWNER').count()
        total_rooms = Room.objects.count()
        
        # Return Stats + List of Hotel Owners
        return Response({
            'stats': {
                'total_hotels': total_hotels,
                'active_licenses': total_hotels, 
                'platform_revenue': total_hotels * 2999, # Mock platform revenue
                'total_rooms': total_rooms
            },
            'hotels': [{
                'id': u.id, 
                'username': u.username,
                'email': u.email,
                'date_joined': u.date_joined,
                'is_active': u.is_active,
                'plan': 'PRO', # Placeholder
                'hotel_settings': HotelSettingsSerializer(getattr(u, 'hotel_settings', None)).data
            } for u in CustomUser.objects.filter(role='OWNER')]
        })

    def post(self, request):
        action = request.data.get('action')
        hotel_id = request.data.get('hotel_id')
        User = get_user_model()

        if action == 'toggle_status' and hotel_id:
            try:
                user = User.objects.get(id=hotel_id)
                # Prevent banning yourself
                if user.is_superuser:
                    return Response({'error': 'Cannot ban Super Admin'}, status=400)
                
                # Toggle Status
                user.is_active = not user.is_active
                user.save()
                
                return Response({'status': 'Updated', 'new_status': 'ACTIVE' if user.is_active else 'SUSPENDED'})
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=404)
        
        return Response({'error': 'Invalid Action'}, status=400)


# ==============================================================================
# 10. PUBLIC BOOKING ENGINE (WEBSITE BUILDER)
# ==============================================================================

class PublicHotelView(APIView):
    permission_classes = [permissions.AllowAny] # Public Access

    def get(self, request, username):
        """Fetch hotel details by username (subdomain logic)"""
        user = get_object_or_404(CustomUser, username=username, role='OWNER')
        settings = getattr(user, 'hotel_settings', None)
        
        if not settings:
            return Response({'error': 'Hotel not configured'}, status=404)

        # Get available rooms
        rooms = Room.objects.filter(owner=user, status='AVAILABLE')
        
        return Response({
            'hotel': PublicHotelSerializer(settings).data,
            'rooms': PublicRoomSerializer(rooms, many=True).data
        })

class PublicBookingCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        try:
            # 1. Find the Hotel Owner
            owner = CustomUser.objects.get(username=data['hotel_username'], role='OWNER')
            
            # 2. Find or Create Guest
            guest, _ = Guest.objects.get_or_create(
                email=data['guest_email'],
                owner=owner,
                defaults={
                    'full_name': data['guest_name'],
                    'phone': data['guest_phone']
                }
            )

            # 3. Find an Available Room of requested type
            room = Room.objects.filter(
                owner=owner, 
                room_type=data['room_type'], 
                status='AVAILABLE'
            ).first()

            if not room:
                return Response({'error': 'No rooms available of this type'}, status=400)

            # 4. Calculate Total Price
            check_in = datetime.strptime(data['check_in'], '%Y-%m-%d').date()
            check_out = datetime.strptime(data['check_out'], '%Y-%m-%d').date()
            nights = (check_out - check_in).days
            if nights < 1: nights = 1
            total_amount = room.price_per_night * nights

            # 5. Create Booking
            booking = Booking.objects.create(
                owner=owner,
                room=room,
                guest=guest,
                check_in_date=check_in,
                check_out_date=check_out,
                total_amount=total_amount,
                status='CONFIRMED',
                payment_status='PENDING',
                source='WEB'
            )

            # 6. Auto-Update Room Status
            room.status = 'BOOKED'
            room.save()
            
            # 7. Send Automated Email
            send_booking_email(booking, 'CONFIRMATION')

            return Response({'status': 'Confirmed', 'booking_id': booking.id, 'amount': total_amount})

        except CustomUser.DoesNotExist:
            return Response({'error': 'Invalid Hotel ID'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)