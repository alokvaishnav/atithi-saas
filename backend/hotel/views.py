# ==========================================
#  STANDARD LIBRARY IMPORTS
# ==========================================
import csv
import json
from datetime import datetime, timedelta, date

# ==========================================
#  DJANGO CORE IMPORTS
# ==========================================
from django.db import transaction  # Critical for Public Booking locking
from django.db.models import Sum, Count, Q, F
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import get_connection, EmailMultiAlternatives

# ==========================================
#  DJANGO REST FRAMEWORK (DRF) IMPORTS
# ==========================================
from rest_framework import viewsets, permissions, status, filters, serializers, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import AuthenticationFailed

# ==========================================
#  THIRD-PARTY LIBRARIES
# ==========================================
# JWT Authentication
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication

# Filtering
from django_filters.rest_framework import DjangoFilterBackend

# PDF Generation (ReportLab)
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
except ImportError:
    pass 

# ==========================================
#  LOCAL APP IMPORTS
# ==========================================
from core.models import CustomUser

# Utilities (Ensure these functions exist in backend/hotel/utils.py)
from .utils import (
    generate_ical_for_room, 
    send_booking_email, 
    send_welcome_email
)

# Models
from .models import (
    Room, 
    Booking, 
    HotelSettings, 
    Guest, 
    InventoryItem, 
    Expense, 
    MenuItem, 
    Order, 
    HousekeepingTask, 
    ActivityLog, 
    BookingCharge, 
    BookingPayment, 
    PlatformSettings, 
    GlobalAnnouncement
)

# Serializers
from .serializers import (
    RoomSerializer, 
    BookingSerializer, 
    GuestSerializer, 
    InventorySerializer, 
    ExpenseSerializer, 
    MenuItemSerializer, 
    OrderSerializer, 
    HousekeepingTaskSerializer, 
    ActivityLogSerializer, 
    StaffSerializer, 
    HotelSettingsSerializer,
    PublicHotelSerializer, 
    PublicRoomSerializer, 
    PlatformSettingsSerializer
)

HousekeepingSerializer = HousekeepingTaskSerializer

# ==============================================================================
# 1. AUTHENTICATION & ONBOARDING
# ==============================================================================

# --- CUSTOM JWT SERIALIZER ---
class CustomTokenSerializer(TokenObtainPairSerializer):
    """
    Custom JWT Token that includes user Role, ID, and dynamic Hotel Name payload.
    Fetches 'App Name' from PlatformSettings for global branding fallbacks.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # 1. Fetch Global App Name (for fallback branding)
        try:
            platform = PlatformSettings.objects.first()
            global_app_name = platform.app_name if platform else "Atithi HMS"
        except Exception:
            global_app_name = "Atithi HMS"

        # 2. Add Standard User Data to Response
        data['username'] = self.user.username
        data['role'] = self.user.role
        data['id'] = self.user.id
        data['is_superuser'] = self.user.is_superuser
        
        # 3. Smartly fetch Hotel Name based on Role
        try: 
            if self.user.is_superuser:
                # Super Admin View (Global HQ)
                data['hotel_name'] = "Global HQ"
                data['hotel_setup'] = True

            elif self.user.role == 'OWNER':
                # Owner sees their own hotel settings
                settings = getattr(self.user, 'hotel_settings', None)
                data['hotel_name'] = settings.hotel_name if settings else 'Unconfigured'
                # Check if setup is complete (Name changed from default)
                data['hotel_setup'] = settings.hotel_name != "My Hotel" if settings else False

            else:
                # Staff sees their Owner's hotel settings
                owner = self.user.hotel_owner
                if owner and hasattr(owner, 'hotel_settings'):
                    data['hotel_name'] = owner.hotel_settings.hotel_name
                    data['hotel_setup'] = True
                else:
                    # Orphaned staff gets Global App Name
                    data['hotel_name'] = global_app_name
                    data['hotel_setup'] = False

        except Exception as e: 
            # Safe Fallback in case of DB errors
            data['hotel_name'] = global_app_name
            data['hotel_setup'] = False
            
        return data

# --- CUSTOM LOGIN VIEW ---
class CustomLoginView(TokenObtainPairView):
    """
    Login View that uses the CustomTokenSerializer to inject
    role and hotel data into the JWT response.
    """
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
            # 1. Validate Uniqueness
            if CustomUser.objects.filter(username=data.get('username')).exists():
                return Response({'error': 'Username already exists'}, status=400)
            
            if 'email' in data and CustomUser.objects.filter(email=data.get('email')).exists():
                return Response({'error': 'Email is already registered'}, status=400)
            
            # 2. Create the Owner User
            user = CustomUser.objects.create_user(
                username=data['username'], 
                email=data.get('email', ''), 
                password=data['password'], 
                role='OWNER',
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', '')
            )
            
            # 3. Create Default Hotel Settings immediately
            # This ensures the user has a linked hotel profile from the start
            HotelSettings.objects.create(
                owner=user, 
                hotel_name=data.get('hotel_name', 'My Hotel')
            )
            
            # 4. Trigger Welcome Email (Uses Global SMTP + Editable Template)
            # We wrap this in a separate try/except so email failures don't block registration
            try:
                send_welcome_email(user, data['password'])
            except Exception as email_error:
                print(f"Warning: Welcome email could not be sent. Error: {str(email_error)}")
            
            return Response({'status': 'Success', 'message': 'Account created successfully'}, status=201)
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class PasswordResetRequestView(APIView):
    """
    Handles Password Reset requests.
    Generates a token and sends an email using the Global SaaS SMTP settings.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email: 
            return Response({'error': 'Email required'}, status=400)
        
        User = get_user_model()
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # SECURITY: Always return success to prevent Email Enumeration attacks
            return Response({'status': 'If an account exists, a reset link has been sent.'})

        # 1. Fetch Global SMTP Settings
        try:
            platform = PlatformSettings.objects.first()
            if not platform or not platform.smtp_host:
                print("Error: Global SMTP not configured in PlatformSettings")
                return Response({'error': 'System email service unavailable'}, status=503)

            # 2. Generate Reset Token & Link
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # NOTE: Update the IP/Domain below to match your Frontend URL
            reset_link = f"http://16.171.144.127/reset-password/{uid}/{token}/"

            # 3. Configure Email Connection Dynamically
            connection = get_connection(
                host=platform.smtp_host,
                port=int(platform.smtp_port),
                username=platform.smtp_user,
                password=platform.smtp_password,
                use_tls=True
            )

            # 4. Construct Email Content
            subject = f"Password Reset Request - {platform.app_name}"
            text_content = (
                f"Hello {user.first_name or user.username},\n\n"
                f"You requested a password reset for {platform.app_name}.\n"
                f"Click the link below to reset it:\n\n"
                f"{reset_link}\n\n"
                f"If you did not request this, please ignore this email.\n\n"
                f"Regards,\n{platform.company_name} Support"
            )

            # 5. Send Email
            email_msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=platform.support_email,
                to=[email],
                connection=connection
            )
            email_msg.send()

            return Response({'status': 'If an account exists, a reset link has been sent.'})

        except Exception as e:
            print(f"Password Reset Error: {e}")
            return Response({'error': 'Failed to send email. Please try again later.'}, status=500)

class PasswordResetConfirmView(APIView):
    """
    Validates the UID and Token from the email link.
    If valid, sets the new password for the user.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response({'error': 'Missing requirements (UID, Token, or Password)'}, status=400)

        User = get_user_model()

        try:
            # 1. Decode the User ID from base64
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid link or user does not exist'}, status=400)

        # 2. Check validity of the token
        if user is not None and default_token_generator.check_token(user, token):
            # 3. Set the new password
            user.set_password(new_password)
            user.save()
            return Response({'status': 'Password Reset Successful. You can now login.'})
        else:
            return Response({'error': 'Invalid or expired token. Please request a new link.'}, status=400)


# ==============================================================================
# 2. BASE SAAS VIEWSET (MULTI-TENANCY CORE)
# ==============================================================================

class BaseSaaSViewSet(viewsets.ModelViewSet):
    """
    Core ViewSet that implements Multi-Tenancy.
    It automatically filters data so Users ONLY see data belonging to their Hotel Owner.
    
    - Super Admin: Sees ALL data (Global Visibility).
    - Hotel Owner: Sees only their own data.
    - Hotel Staff: Sees only their Owner's data.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_owner(self):
        """
        Helper to find the 'Data Owner' for the current user.
        """
        if self.request.user.role == 'OWNER':
            return self.request.user
        # Safe way to get hotel_owner, returns None if not set
        return getattr(self.request.user, 'hotel_owner', None)

    def get_queryset(self):
        """
        Filters the database query to ensure data isolation.
        """
        # 1. Super Admin (Global HQ) - See Everything
        if self.request.user.is_superuser:
            return self.queryset.all()

        # 2. Get the Context Owner
        owner = self.get_owner()
        
        # 3. Orphan Check: If a staff member has no owner, they see nothing
        if not owner:
            return self.queryset.none() 

        # 4. Standard Tenant Filter
        return self.queryset.filter(owner=owner)

    def perform_create(self, serializer):
        """
        Automatically assigns the 'owner' field when creating new records.
        """
        # If Super Admin, allow creating without forcing owner (or let serializer handle it)
        if self.request.user.is_superuser:
            serializer.save()
            return

        owner = self.get_owner()
        
        if not owner:
            raise serializers.ValidationError({"detail": "You are not associated with a valid Hotel Owner."})

        # Save the object with the correct owner attached
        serializer.save(owner=owner)

# ==============================================================================
# 3. HOTEL OPERATIONS MODULES
# ==============================================================================

class RoomViewSet(BaseSaaSViewSet):
    """
    Manages Room Inventory.
    Includes custom actions for Housekeeping (Clean/Dirty/Maintenance).
    """
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    
    @action(detail=True, methods=['patch'], url_path='mark-clean')
    def mark_clean(self, request, pk=None):
        """
        Marks a room as AVAILABLE and auto-completes any pending housekeeping tasks.
        """
        room = self.get_object()
        old_status = room.status
        room.status = 'AVAILABLE'
        room.save()
        
        # Auto-close related pending housekeeping tasks
        HousekeepingTask.objects.filter(room=room, status='PENDING').update(
            status='COMPLETED',
            completed_at=timezone.now()
        )

        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='HOUSEKEEPING',
            details=f"Room {room.room_number} changed from {old_status} to AVAILABLE by {request.user.username}"
        )
        return Response({'status': 'Room Cleaned', 'room_status': room.status})

    @action(detail=True, methods=['patch'], url_path='mark-dirty')
    def mark_dirty(self, request, pk=None):
        """
        Marks a room as DIRTY and automatically creates a Housekeeping Task.
        """
        room = self.get_object()
        room.status = 'DIRTY'
        room.save()
        
        # Auto-create a Housekeeping Task so staff sees it on Dashboard
        HousekeepingTask.objects.create(
            owner=self.get_owner(),
            room=room,
            task_type='CLEANING',
            status='PENDING',
            priority='NORMAL',
            description=f"Auto-generated: Room marked dirty by {request.user.username}"
        )
        
        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='HOUSEKEEPING',
            details=f"Room {room.room_number} marked DIRTY by {request.user.username}"
        )
        return Response({'status': 'Room Marked Dirty', 'room_status': room.status})

    @action(detail=True, methods=['patch'], url_path='mark-maintenance')
    def mark_maintenance(self, request, pk=None):
        """
        Blocks a room for Maintenance (O.O.O - Out of Order).
        """
        room = self.get_object()
        room.status = 'MAINTENANCE'
        room.save()
        
        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='MAINTENANCE',
            details=f"Room {room.room_number} placed in MAINTENANCE by {request.user.username}"
        )
        return Response({'status': 'Room Blocked for Maintenance', 'room_status': room.status})

class BookingViewSet(BaseSaaSViewSet):
    """
    Manages Bookings, Folios (Bills), Payments, and Checkouts.
    """
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
        
        # Calculate Totals
        extras = sum(c.amount for c in charges)
        total_charges = booking.total_amount + extras
        total_paid = sum(p.amount for p in payments)
        
        return Response({
            'booking_id': booking.id,
            'guest_name': booking.guest.full_name if booking.guest else 'Unknown',
            'room_number': booking.room.room_number if booking.room else 'N/A',
            'check_in': booking.check_in_date,
            'check_out': booking.check_out_date,
            'base_amount': booking.total_amount,
            'total_charges': total_charges,
            'paid_amount': total_paid,
            'balance': total_charges - total_paid,
            'status': booking.status,
            'payment_status': booking.payment_status,
            'charges': [{'description': c.description, 'amount': c.amount, 'date': c.date} for c in charges],
            'payments': [{'id': p.id, 'method': p.payment_mode, 'amount': p.amount, 'date': p.date} for p in payments]
        })

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Records a payment and updates the booking status"""
        booking = self.get_object()
        amount = request.data.get('amount')
        mode = request.data.get('method', 'CASH')
        
        if not amount:
            return Response({'error': 'Amount is required'}, status=400)

        # 1. Record the Payment
        BookingPayment.objects.create(booking=booking, amount=amount, payment_mode=mode)
        
        # 2. Recalculate Financials
        total_extras = BookingCharge.objects.filter(booking=booking).aggregate(Sum('amount'))['amount__sum'] or 0
        total_due = booking.total_amount + total_extras
        total_paid = BookingPayment.objects.filter(booking=booking).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # 3. Update Status
        if total_paid >= total_due:
            booking.payment_status = 'PAID'
        elif total_paid > 0:
            booking.payment_status = 'PARTIAL'
        else:
            booking.payment_status = 'PENDING'
            
        booking.save()
        
        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='PAYMENT',
            details=f"Received {amount} via {mode} for Booking #{booking.id}"
        )
        return Response({
            'status': 'Payment Recorded', 
            'new_balance': total_due - total_paid,
            'payment_status': booking.payment_status
        })

    @action(detail=True, methods=['post'])
    def charges(self, request, pk=None):
        """Adds an extra charge (e.g., Food, Laundry)"""
        booking = self.get_object()
        desc = request.data.get('description')
        amount = request.data.get('amount')
        
        BookingCharge.objects.create(booking=booking, description=desc, amount=amount)
        
        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='CHARGE',
            details=f"Added charge '{desc}' of {amount} to Booking #{booking.id}"
        )
        return Response({'status': 'Charge Added'})

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """Processes Checkout: Updates status, marks room dirty, alerts housekeeping"""
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
                status='PENDING',
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
    """
    Manages Guest Profiles (CRM).
    - Search by Name, Email, or Phone.
    - View Guest History.
    - Blacklist Guests.
    """
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'email', 'phone', 'id_proof_number']

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Returns all past bookings for a specific guest.
        """
        guest = self.get_object()
        bookings = Booking.objects.filter(guest=guest).order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        
        # Calculate Lifetime Value (Total Spent)
        total_spent = sum(b.total_amount for b in bookings)
        
        return Response({
            'guest': GuestSerializer(guest).data,
            'total_spent': total_spent,
            'total_stays': bookings.count(),
            'bookings': serializer.data
        })

    @action(detail=True, methods=['patch'], url_path='toggle-blacklist')
    def toggle_blacklist(self, request, pk=None):
        """
        Marks or unmarks a guest as Blacklisted.
        """
        guest = self.get_object()
        guest.is_blacklisted = not guest.is_blacklisted
        guest.save()
        
        status = "BLACKLISTED" if guest.is_blacklisted else "WHITELISTED"
        
        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='GUEST_UPDATE',
            details=f"Guest {guest.full_name} marked as {status} by {request.user.username}"
        )
        
        return Response({'status': 'Success', 'is_blacklisted': guest.is_blacklisted})
    
class InventoryViewSet(BaseSaaSViewSet):
    """
    Manages Hotel Inventory (Supplies, Toiletries, Food, etc.).
    Includes Low Stock Alerts and Adjustments.
    """
    queryset = InventoryItem.objects.all()
    serializer_class = InventorySerializer

    @action(detail=True, methods=['post'], url_path='adjust-stock')
    def adjust_stock(self, request, pk=None):
        """
        Add or Remove stock.
        Payload: { "amount": 10, "type": "ADD" or "CONSUME" }
        """
        item = self.get_object()
        amount = int(request.data.get('amount', 0))
        action_type = request.data.get('type', 'ADD') # ADD or CONSUME

        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=400)

        if action_type == 'ADD':
            item.current_stock += amount
            details = f"Restocked {amount} units of {item.name}"
        elif action_type == 'CONSUME':
            if item.current_stock < amount:
                return Response({'error': 'Insufficient stock'}, status=400)
            item.current_stock -= amount
            details = f"Consumed {amount} units of {item.name}"
        else:
            return Response({'error': 'Invalid Action Type'}, status=400)

        item.save()

        # Low Stock Check
        alert = False
        if item.current_stock <= item.min_stock_alert:
            alert = True
            details += " (LOW STOCK ALERT)"

        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='INVENTORY',
            details=details
        )

        return Response({
            'status': 'Stock Updated', 
            'current_stock': item.current_stock,
            'low_stock_alert': alert
        })

class ExpenseViewSet(BaseSaaSViewSet):
    """
    Manages Operational Expenses.
    Supports filtering by Category and Date for Reports.
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    
    # Enable Filtering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'date']
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'amount']
    ordering = ['-date'] # Default sort: Newest first

class MenuItemViewSet(BaseSaaSViewSet):
    """
    Manages Restaurant/Room Service Menu.
    Supports filtering by Category (e.g., 'Starter', 'Drink') and Availability.
    """
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    
    # Enable Searching & Filtering for POS
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_available']
    search_fields = ['name', 'description']

    @action(detail=True, methods=['patch'], url_path='toggle-stock')
    def toggle_stock(self, request, pk=None):
        """
        Quickly mark an item as In Stock / Out of Stock from the POS.
        """
        item = self.get_object()
        item.is_available = not item.is_available
        item.save()
        
        status = "Available" if item.is_available else "Out of Stock"
        
        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='MENU_UPDATE',
            details=f"Menu Item '{item.name}' marked as {status} by {request.user.username}"
        )
        
        return Response({'status': 'Updated', 'is_available': item.is_available})

class OrderViewSet(BaseSaaSViewSet):
    """
    Manages POS Orders (Restaurant / Room Service).
    Automatically adds charges to the Room Bill if linked to a booking.
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def perform_create(self, serializer):
        """
        Custom create logic:
        1. Save the Order.
        2. If linked to a Booking, add a 'BookingCharge' automatically.
        3. Log the activity.
        """
        # 1. Save the Order first
        order = serializer.save(owner=self.get_owner())
        
        # 2. If it's Room Service (linked to a Booking), add to the bill
        if order.booking:
            BookingCharge.objects.create(
                booking=order.booking,
                description=f"POS Order #{order.id} (Food/Service)",
                amount=order.total_amount
            )
            
            # Log specific Room Service action
            ActivityLog.objects.create(
                owner=self.get_owner(),
                action='POS_ORDER',
                details=f"Room Service Order #{order.id} of {order.total_amount} added to Booking #{order.booking.id}"
            )
        else:
            # Log generic POS action (Walk-in / Cash)
            ActivityLog.objects.create(
                owner=self.get_owner(),
                action='POS_ORDER',
                details=f"Direct POS Order #{order.id} created for {order.total_amount}"
            )
class HousekeepingViewSet(BaseSaaSViewSet):
    """
    Manages Housekeeping Tasks.
    - Managers can assign tasks.
    - Staff can mark tasks as Completed.
    - Completing a 'CLEANING' task automatically makes the Room 'AVAILABLE'.
    """
    queryset = HousekeepingTask.objects.all()
    serializer_class = HousekeepingSerializer
    
    # Enable Filtering (e.g., Show me only 'PENDING' tasks or tasks for 'John')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'room']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-priority', '-created_at'] # High priority first

    @action(detail=True, methods=['patch'], url_path='complete')
    def complete_task(self, request, pk=None):
        """
        Marks a task as Done.
        If it was a Cleaning task, it auto-updates the Room to AVAILABLE.
        """
        task = self.get_object()
        
        # 1. Update Task
        task.status = 'COMPLETED'
        task.completed_at = timezone.now()
        task.save()
        
        # 2. Automation: If Cleaning, make Room Available
        if task.task_type == 'CLEANING' and task.room:
            task.room.status = 'AVAILABLE'
            task.room.save()
            room_update_msg = f" & Room {task.room.room_number} marked AVAILABLE"
        else:
            room_update_msg = ""

        # 3. Log Activity
        ActivityLog.objects.create(
            owner=self.get_owner(),
            action='HOUSEKEEPING',
            details=f"Task '{task.task_type}' for Room {task.room.room_number if task.room else '?'} completed by {request.user.username}{room_update_msg}"
        )
        
        return Response({'status': 'Task Completed', 'room_status': task.room.status if task.room else 'N/A'})

class ActivityLogViewSet(viewsets.GenericViewSet, 
                         mixins.ListModelMixin, 
                         mixins.RetrieveModelMixin):
    """
    Read-Only ViewSet for Audit Logs.
    Prevents modification of logs to ensure security and integrity.
    Supports filtering by User, Action Type, and Date.
    """
    # Note: We don't inherit BaseSaaSViewSet fully because we want to restrict Create/Update/Delete
    # But we still need the SaaS filtering logic, so we manually implement get_queryset/get_owner
    
    serializer_class = ActivityLogSerializer
    
    # Enable Filtering & Search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'timestamp'] # e.g. ?action=PAYMENT
    search_fields = ['details', 'owner__username'] # Search log text
    ordering = ['-timestamp'] # Newest logs first

    def get_owner(self):
        """Re-using the SaaS Owner Logic"""
        if self.request.user.role == 'OWNER':
            return self.request.user
        return getattr(self.request.user, 'hotel_owner', None)

    def get_queryset(self):
        """
        SaaS Security: Users only see logs for their specific Hotel.
        Super Admin sees all logs.
        """
        if self.request.user.is_superuser:
            return ActivityLog.objects.all()

        owner = self.get_owner()
        if not owner:
            return ActivityLog.objects.none()
            
        return ActivityLog.objects.filter(owner=owner)


# ==============================================================================
# 4. STAFF MANAGEMENT
# ==============================================================================

class StaffViewSet(viewsets.ModelViewSet):
    """
    Manages Hotel Staff (Employees).
    - Owners can create/view/delete staff.
    - Automatically links new staff to the Owner's Hotel.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StaffSerializer
    
    def get_queryset(self):
        """
        Owners see their own staff.
        Staff see their colleagues (excluding the Owner from the list for clarity).
        """
        user = self.request.user
        
        # Determine the "Boss" (Owner)
        if user.role == 'OWNER':
            owner = user
        else:
            owner = user.hotel_owner

        # Safety check for unassigned staff
        if not owner:
            return CustomUser.objects.none()

        # Return all users linked to this owner, excluding the owner themselves
        return CustomUser.objects.filter(hotel_owner=owner)

    def perform_create(self, serializer):
        """
        When creating a new staff member:
        1. Link them to the current Owner.
        2. Hash their password (handled by serializer/model, but ensure logic holds).
        3. Log the 'Staff Hired' activity.
        """
        # Ensure only Owners (or authorized Managers) can create staff
        if self.request.user.role not in ['OWNER', 'MANAGER'] and not self.request.user.is_superuser:
            raise permissions.PermissionDenied("Only Owners or Managers can add staff.")

        owner = self.request.user if self.request.user.role == 'OWNER' else self.request.user.hotel_owner
        
        # Save the new user with the link to the owner
        new_staff = serializer.save(hotel_owner=owner)
        
        # Log it
        ActivityLog.objects.create(
            owner=owner,
            action='STAFF_MGMT',
            details=f"Hired new staff: {new_staff.username} ({new_staff.role}) by {self.request.user.username}"
        )

class StaffRegisterView(APIView):
    """
    Dedicated Endpoint for Owners to register new Staff members.
    Links the new staff directly to the authenticated Owner's account.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # 1. Permission Check: Only Owners or Super Admins can add staff
        if request.user.role != 'OWNER' and not request.user.is_superuser:
            return Response({'error': 'Permission Denied: Only Hotel Owners can add staff.'}, status=403)
            
        data = request.data
        
        # 2. Validation: Check if username exists
        if CustomUser.objects.filter(username=data.get('username')).exists():
            return Response({'error': 'Username already exists. Please choose another.'}, status=400)

        try:
            # 3. Create the Staff User
            # We explicitly set 'hotel_owner' to the current logged-in Owner
            user = CustomUser.objects.create_user(
                username=data['username'],
                email=data.get('email', ''),
                password=data['password'],
                role=data.get('role', 'RECEPTIONIST'),
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                hotel_owner=request.user 
            )
            
            # 4. Log the Action
            ActivityLog.objects.create(
                owner=request.user,
                action='STAFF_MGMT',
                details=f"Hired {user.role}: {user.first_name} {user.last_name} ({user.username})"
            )
            
            return Response({'status': 'Staff Created Successfully', 'id': user.id}, status=201)
            
        except Exception as e: 
            return Response({'error': str(e)}, status=400)


# ==============================================================================
# 5. SETTINGS & ANALYTICS
# ==============================================================================

class SettingsView(APIView):
    """
    Manages Hotel Configuration (Logo, Name, Currency, Timezones).
    - GET: Available to all Staff (Read-Only).
    - POST: Restricted to Owners (Write).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_owner(self, request):
        """Helper to find the Hotel Owner context"""
        if request.user.role == 'OWNER':
            return request.user
        return request.user.hotel_owner

    def get(self, request):
        """
        Retrieve Hotel Settings. 
        Auto-creates default settings if they don't exist yet.
        """
        owner = self.get_owner(request)
        if not owner:
            return Response({'error': 'You are not assigned to any hotel.'}, status=404)

        # get_or_create prevents crashes for new accounts
        settings, _ = HotelSettings.objects.get_or_create(owner=owner)
        return Response(HotelSettingsSerializer(settings).data)
        
    def post(self, request):
        """
        Update Hotel Settings.
        """
        # 1. Security Check: Only Owners can change settings
        if request.user.role != 'OWNER' and not request.user.is_superuser:
            return Response({'error': 'Permission Denied: Only Owners can modify settings.'}, status=403)

        owner = self.get_owner(request)
        settings, _ = HotelSettings.objects.get_or_create(owner=owner)
        
        # 2. Update Data (partial=True allows updating single fields like just the logo)
        serializer = HotelSettingsSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # 3. Log the Activity
            ActivityLog.objects.create(
                owner=owner,
                action='SETTINGS_UPDATE',
                details=f"Hotel Settings updated by {request.user.username}"
            )
            
            return Response(serializer.data)
            
        return Response(serializer.errors, status=400)

class AnalyticsView(APIView):
    """
    Provides Dashboard Stats for the Hotel Owner + Global Announcements.
    Merges Financial Logic with Dashboard UI requirements.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # 1. Determine Data Context (Owner vs Staff)
        # If user is staff, use their assigned hotel_owner. If Owner, use themselves.
        if request.user.role == 'OWNER':
            owner = request.user
        else:
            # Safety fallback for unassigned staff
            owner = getattr(request.user, 'hotel_owner', None)
            
        if not owner:
            # Return empty/zero stats for orphaned users to prevent crash
            return Response({
                'stats': {
                    'revenue': 0, 'total_expenses': 0, 'net_profit': 0,
                    'total_bookings': 0, 'occupied_rooms': 0, 'available_rooms': 0
                },
                'trend': [], 'recent_bookings': [], 'announcements': []
            })
        
        # --- A. FINANCIALS ---
        
        # Total Booking Revenue (Room Charges)
        booking_rev = Booking.objects.filter(owner=owner).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Total Extra Charges (Services, Food, etc.)
        extras_rev = BookingCharge.objects.filter(booking__owner=owner).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total_revenue = booking_rev + extras_rev
        
        # Total Expenses
        total_expenses = Expense.objects.filter(owner=owner).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # --- B. OPERATIONAL COUNTS ---
        
        # Active Bookings (Checked In or Confirmed)
        active_bookings = Booking.objects.filter(owner=owner, status__in=['CHECKED_IN', 'CONFIRMED']).count()
        
        # Occupied Rooms (Includes Dirty rooms waiting for cleaning)
        occupied_rooms = Room.objects.filter(owner=owner, status__in=['OCCUPIED', 'BOOKED', 'DIRTY']).count()
        
        # Available Rooms
        rooms_available = Room.objects.filter(owner=owner, status='AVAILABLE').count()
        
        # --- C. 7-DAY TREND (Cash Flow) ---
        today = timezone.now().date()
        trend = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            # Sum actual payments collected on this specific day
            day_rev = BookingPayment.objects.filter(booking__owner=owner, date=d).aggregate(Sum('amount'))['amount__sum'] or 0
            trend.append({'date': d.isoformat(), 'daily_revenue': day_rev})

        # --- D. RECENT BOOKINGS (For Dashboard Table) ---
        recent_bookings = Booking.objects.filter(owner=owner).order_by('-created_at')[:5]
        recent_bookings_data = BookingSerializer(recent_bookings, many=True).data

        # --- E. GLOBAL ANNOUNCEMENTS (From Super Admin) ---
        # Only fetch active announcements
        announcements = GlobalAnnouncement.objects.filter(is_active=True).order_by('-created_at').values('title', 'message', 'created_at')

        # --- RETURN RESPONSE ---
        return Response({
            'stats': {
                'revenue': total_revenue,           # Total Billed
                'total_expenses': total_expenses,
                'net_profit': total_revenue - total_expenses,
                'total_bookings': active_bookings,  # Active guests
                'occupied_rooms': occupied_rooms,   # Rooms in use
                'available_rooms': rooms_available  # Rooms ready to sell
            },
            'trend': trend,                         # Graph Data
            'recent_bookings': recent_bookings_data,# Table Data
            'announcements': list(announcements)    # Alert Banner
        })


# ==============================================================================
# 6. POS SYSTEM
# ==============================================================================

class POSChargeView(APIView):
    """
    Handles Point of Sale (POS) Transactions.
    - Supports Charging to Room Bill.
    - Supports Direct Cash/UPI Payments.
    - Automatically updates Inventory (if applicable).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # 1. Determine Owner Context
        owner = request.user if request.user.role == 'OWNER' else request.user.hotel_owner
        if not owner:
            return Response({'error': 'User not associated with a hotel'}, status=403)

        data = request.data
        total_amt = data.get('total_amount')
        method = data.get('payment_method') # 'ROOM', 'CASH', 'UPI', 'CARD'
        booking_id = data.get('booking_id')
        items = data.get('items', []) # Expecting list of dicts: [{'id': 1, 'name': 'Coke', 'qty': 2}]
        
        if not total_amt or not items:
            return Response({'error': 'Invalid Order Data'}, status=400)

        # 2. Logic: Charge to Room vs Direct Payment
        booking = None
        order_status = 'COMPLETED'
        
        if method == 'ROOM':
            if not booking_id:
                return Response({'error': 'Booking ID required for Room Charge'}, status=400)
                
            booking = get_object_or_404(Booking, id=booking_id, owner=owner)
            
            # Create Charge on Folio
            BookingCharge.objects.create(
                booking=booking,
                description=f"POS Charge (Ref: {method})",
                amount=total_amt
            )
            order_status = 'BILLED' # Not paid yet, just billed
            
            log_detail = f"POS Order of {total_amt} charged to Room {booking.room.room_number if booking.room else 'Unknown'}"
        else:
            log_detail = f"POS Order of {total_amt} paid via {method}"

        # 3. Create the Order Record
        order = Order.objects.create(
            owner=owner,
            booking=booking,
            items=json.dumps(items) if isinstance(items, list) else items,
            total_amount=total_amt,
            status=order_status
        )

        # 4. Inventory Deduction Logic
        # Iterates through items and deducts stock if an 'inventory_id' is provided
        for item in items:
            inv_id = item.get('inventory_id')
            qty = int(item.get('qty', 1))
            if inv_id:
                try:
                    inv_item = InventoryItem.objects.get(id=inv_id, owner=owner)
                    if inv_item.current_stock >= qty:
                        inv_item.current_stock -= qty
                        inv_item.save()
                except InventoryItem.DoesNotExist:
                    pass # Skip if inventory item not found, don't break the transaction

        # 5. Log Activity
        ActivityLog.objects.create(
            owner=owner,
            action='POS_ORDER',
            details=log_detail
        )

        return Response({
            'status': 'Success', 
            'message': 'Order Processed', 
            'order_id': order.id
        })


# ==============================================================================
# 7. LICENSING & EXTERNAL
# ==============================================================================

class LicenseStatusView(APIView):
    """
    Checks the Subscription/License Status of the Hotel.
    Returns the days remaining and active status.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # 1. Determine Owner Context
        user = request.user
        owner = user if user.role == 'OWNER' else getattr(user, 'hotel_owner', None)
        
        if not owner:
            return Response({'error': 'No Hotel Associated'}, status=400)
            
        try:
            # 2. Fetch Settings
            settings = HotelSettings.objects.get(owner=owner)
            
            # 3. Calculate Status
            if settings.license_expiry:
                today = timezone.now().date()
                expiry = settings.license_expiry
                delta = (expiry - today).days
                
                is_expired = delta < 0
                status = 'EXPIRED' if is_expired else 'ACTIVE'
                days_left = max(0, delta)
                expiry_str = expiry.strftime('%Y-%m-%d')
            else:
                # Fallback for lifetime/unset licenses
                status = 'ACTIVE'
                days_left = 999
                expiry_str = 'Lifetime'
                is_expired = False

            return Response({
                'status': status,
                'days_left': days_left,
                'expiry_date': expiry_str,
                'is_expired': is_expired,
                'license_key': settings.license_key or 'Standard'
            })
            
        except HotelSettings.DoesNotExist:
            return Response({'status': 'UNCONFIGURED', 'days_left': 0, 'is_expired': True})
        
class LicenseActivateView(APIView):
    """
    Activates or Renews the Hotel's SaaS License.
    Only Owners can perform this action.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # 1. Security Check: Only Owners can activate licenses
        if request.user.role != 'OWNER' and not request.user.is_superuser:
            return Response({'error': 'Only Hotel Owners can manage licenses.'}, status=403)

        key = request.data.get('license_key')
        if not key:
            return Response({'error': 'License Key is required.'}, status=400)

        # 2. Validation Logic (Simple Example)
        # In a real production app, you might validate this against a central license server
        # Here, we accept any key starting with "PRO-" as valid for demo purposes.
        is_valid = key.startswith("PRO-") or request.user.is_superuser
        
        if not is_valid:
            return Response({'error': 'Invalid License Key.'}, status=400)

        # 3. Apply License to Settings
        try:
            settings, _ = HotelSettings.objects.get_or_create(owner=request.user)
            
            # Extend for 1 Year from today (or from current expiry if valid)
            current_expiry = settings.license_expiry or timezone.now().date()
            if current_expiry < timezone.now().date():
                current_expiry = timezone.now().date()
                
            new_expiry = current_expiry + timedelta(days=365)
            
            settings.license_key = key
            settings.license_expiry = new_expiry
            settings.save()

            # 4. Audit Log
            ActivityLog.objects.create(
                owner=request.user,
                action='LICENSE_UPDATE',
                details=f"License renewed until {new_expiry} with key {key}"
            )

            return Response({
                'status': 'Activated', 
                'message': 'License activated successfully.',
                'new_expiry_date': new_expiry.strftime('%Y-%m-%d')
            })

        except Exception as e:
            return Response({'error': f"Activation failed: {str(e)}"}, status=500)

class RoomICalView(APIView):
    """
    Public Endpoint for Calendar Sync (iCal / .ics).
    Used by OTAs (Airbnb, Booking.com) to fetch availability.
    """
    permission_classes = [permissions.AllowAny] # Must be public for external fetch
    authentication_classes = [] # Disable auth for this specific endpoint
    
    def get(self, request, room_id):
        # 1. Fetch Room (Standard 404 if not found)
        room = get_object_or_404(Room, id=room_id)
        
        try:
            # 2. Generate iCal content string
            ical_content = generate_ical_for_room(room)
            
            # 3. Return as a Calendar File
            response = HttpResponse(ical_content, content_type='text/calendar; charset=utf-8')
            filename = f"room_{room.room_number}_calendar.ics"
            
            # Headers to force download/recognition
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate' # Prevent OTAs from caching old data
            
            return response

        except Exception as e:
            # Log the error internally here if you have a logger
            print(f"iCal Gen Error: {e}")
            return Response({'error': 'Failed to generate calendar'}, status=500)

# ==============================================================================
# 8. REPORTS & PDF GENERATION
# ==============================================================================

class DailyReportPDFView(APIView):
    """
    Generates a Night Audit / Daily Financial Report PDF.
    Supports JWT via URL param '?token=...' to allow browser-native downloads.
    """
    # AllowAny is technically used here because we manually check the token in logic
    permission_classes = [permissions.AllowAny] 
    
    def get(self, request):
        # --- 1. MANUAL AUTHENTICATION LOGIC (URL TOKEN SUPPORT) ---
        token = request.query_params.get('token')
        if token:
            try:
                # Manually validate the token if passed in URL
                validated_token = JWTAuthentication().get_validated_token(token)
                user = JWTAuthentication().get_user(validated_token)
                if user:
                    request.user = user
            except (AuthenticationFailed, Exception):
                pass # If token is invalid/expired, fall back to standard checks

        # Final Auth Check: If still not authenticated, reject
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=401)

        # --- 2. DETERMINE DATA CONTEXT (OWNER VS STAFF) ---
        if request.user.role == 'OWNER':
            owner = request.user
        else:
            owner = getattr(request.user, 'hotel_owner', None)

        if not owner:
            return Response({'error': 'User not associated with a hotel'}, status=403)

        # --- 3. FETCH REPORT DATA ---
        today_date = datetime.now().date()
        
        # Financial Aggregations
        today_payments = BookingPayment.objects.filter(booking__owner=owner, date=today_date).aggregate(Sum('amount'))['amount__sum'] or 0
        today_expenses = Expense.objects.filter(owner=owner, date=today_date).aggregate(Sum('amount'))['amount__sum'] or 0
        occupancy = Booking.objects.filter(owner=owner, status='CHECKED_IN').count()
        net_cash = today_payments - today_expenses

        # Hotel Name Resolution
        hotel_name = "Atithi HMS"
        if hasattr(owner, 'hotel_settings') and owner.hotel_settings:
            hotel_name = owner.hotel_settings.hotel_name or "Atithi HMS"

        # --- 4. GENERATE PDF ---
        response = HttpResponse(content_type='application/pdf')
        filename = f"Night_Audit_{today_date.strftime('%Y-%m-%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        p = canvas.Canvas(response, pagesize=letter)
        
        # Header
        p.setFont("Helvetica-Bold", 18)
        p.drawString(50, 750, f"{hotel_name} - Night Audit Report")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, 720, f"Date: {datetime.now().strftime('%d %B %Y')}")
        p.drawString(50, 705, f"Generated By: {request.user.username}")
        
        # Divider Line
        p.line(50, 690, 550, 690)
        
        # Financial Summary Section
        y_pos = 650
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y_pos, "Financial Summary")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, y_pos - 30, f"Total Revenue Collected (Today):")
        p.drawString(300, y_pos - 30, f"Rs. {today_payments:,.2f}")
        
        p.drawString(50, y_pos - 50, f"Total Expenses (Today):")
        p.drawString(300, y_pos - 50, f"Rs. {today_expenses:,.2f}")
        
        p.line(50, y_pos - 65, 400, y_pos - 65)
        
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y_pos - 85, f"Net Daily Cash Flow:")
        p.drawString(300, y_pos - 85, f"Rs. {net_cash:,.2f}")
        
        # Operational Section
        y_pos = 500
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y_pos, "Operational Snapshot")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, y_pos - 30, f"Current Occupancy (Active Rooms):")
        p.drawString(300, y_pos - 30, f"{occupancy}")

        # Footer
        p.setFont("Helvetica-Oblique", 10)
        p.drawString(50, 50, f"Generated automatically by Atithi HMS on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        p.showPage()
        p.save()
        return response

class ReportExportView(APIView):
    """
    Exports data (Bookings, Expenses, Inventory) to CSV.
    - Supports Date Filtering (start_date, end_date).
    - Supports Token via URL for direct browser downloads.
    - formatting for Excel (UTF-8 BOM).
    """
    permission_classes = [permissions.AllowAny] # We handle auth manually for URL tokens

    def get(self, request):
        # --- 1. AUTHENTICATION LOGIC (Token in URL support) ---
        token = request.query_params.get('token')
        if token:
            try:
                validated_token = JWTAuthentication().get_validated_token(token)
                user = JWTAuthentication().get_user(validated_token)
                if user:
                    request.user = user
            except (AuthenticationFailed, Exception):
                pass 

        if not request.user.is_authenticated:
            return HttpResponse('Unauthorized', status=401)

        # --- 2. DETERMINE OWNER ---
        owner = request.user if request.user.role == 'OWNER' else getattr(request.user, 'hotel_owner', None)
        if not owner:
            return HttpResponse('User not associated with a hotel', status=403)

        # --- 3. GET PARAMS ---
        report_type = request.query_params.get('type', 'bookings')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # --- 4. PREPARE RESPONSE ---
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        filename = f"{report_type}_export_{timezone.now().strftime('%Y-%m-%d')}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        # Write BOM for Excel compatibility (forces UTF-8 reading)
        response.write(u'\ufeff'.encode('utf8'))
        
        writer = csv.writer(response)

        # --- 5. EXPORT LOGIC ---
        
        # === A. BOOKINGS REPORT ===
        if report_type == 'bookings':
            writer.writerow(['ID', 'Guest Name', 'Room', 'Check-In', 'Check-Out', 'Total Amount', 'Paid', 'Payment Status', 'Booking Status'])
            
            queryset = Booking.objects.filter(owner=owner)
            if start_date and end_date:
                queryset = queryset.filter(check_in_date__range=[start_date, end_date])
            
            for b in queryset:
                room_num = b.room.room_number if b.room else 'N/A'
                guest_name = b.guest.full_name if b.guest else 'Unknown'
                # Calculate paid amount dynamically if not stored, or fetch from model
                # Assuming you might want to calculate it or just show status
                writer.writerow([
                    b.id, 
                    guest_name, 
                    room_num, 
                    b.check_in_date, 
                    b.check_out_date, 
                    b.total_amount, 
                    b.payment_status, # Assuming you added this field
                    b.status
                ])

        # === B. EXPENSES REPORT ===
        elif report_type == 'expenses':
            writer.writerow(['Date', 'Category', 'Title', 'Description', 'Amount'])
            
            queryset = Expense.objects.filter(owner=owner)
            if start_date and end_date:
                queryset = queryset.filter(date__range=[start_date, end_date])
                
            for e in queryset:
                writer.writerow([e.date, e.category, e.title, e.description, e.amount])

        # === C. INVENTORY REPORT ===
        elif report_type == 'inventory':
            writer.writerow(['Item Name', 'Category', 'Current Stock', 'Min Stock Alert', 'Last Updated'])
            
            queryset = InventoryItem.objects.filter(owner=owner)
            for i in queryset:
                writer.writerow([i.name, i.category, i.current_stock, i.min_stock_alert, i.updated_at.strftime('%Y-%m-%d')])

        else:
            writer.writerow(['Error: Invalid Report Type'])

        return response


# ==============================================================================
# 9. SUPER ADMIN (PLATFORM OWNER)
# ==============================================================================

class PlatformSettingsView(APIView):
    """
    Manages Global SaaS Config: Logo, SMTP, Support Info.
    Singleton pattern enforced (always fetches ID=1).
    
    - GET: Public (AllowAny) so the Login Page can show the correct Logo/App Name.
    - POST: Restricted to Super Admin only.
    """

    def get_permissions(self):
        """
        Dynamic permissions based on request method.
        """
        if self.request.method == 'POST':
            # Critical: Only Super Admin can update SMTP/Global settings
            return [permissions.IsAdminUser()]
        # Allow public access for GET so the frontend can load branding on the Login Screen
        return [permissions.AllowAny()]

    def get(self, request):
        """
        Fetch Global Settings. 
        Auto-creates default settings if they don't exist yet.
        """
        # Singleton: Always fetch the first record or create it
        settings, _ = PlatformSettings.objects.get_or_create(id=1)
        serializer = PlatformSettingsSerializer(settings)
        return Response(serializer.data)

    def post(self, request):
        """
        Update Global Settings (SMTP, App Name, etc.).
        """
        settings, _ = PlatformSettings.objects.get_or_create(id=1)
        
        # Partial update allows changing just the logo or just the SMTP host
        serializer = PlatformSettingsSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Log this critical administrative action
            # Note: We use 'id=1' or similar for owner if Super Admin doesn't have a hotel profile
            ActivityLog.objects.create(
                owner=request.user if not request.user.is_superuser else None, 
                action='SYSTEM_UPDATE',
                details=f"Global Platform Settings updated by Super Admin ({request.user.username})"
            )
            
            return Response(serializer.data)
            
        return Response(serializer.errors, status=400)

class SuperAdminStatsView(APIView):
    """
    Control Plane for the Super Admin (Global HQ).
    - GET: Fetch Stats, Hotel List, and Announcements.
    - POST: Perform actions (Ban, Edit Tenant, Manage Announcements).
    """
    permission_classes = [permissions.IsAdminUser] # Ensures is_superuser=True

    def get(self, request):
        User = get_user_model()
        
        # 1. Calculate Stats
        total_hotels = User.objects.filter(role='OWNER').count()
        active_licenses = User.objects.filter(role='OWNER', is_active=True).count()
        total_rooms = Room.objects.count()
        
        # Mock revenue calculation (e.g., 2999 per active hotel)
        # In a real app, this would sum up actual Invoice/Payment records
        platform_revenue = active_licenses * 2999 

        # 2. Fetch Announcements
        announcements = GlobalAnnouncement.objects.filter(is_active=True).order_by('-created_at').values()

        # 3. Build Hotel List Data
        hotels_data = []
        owners = User.objects.filter(role='OWNER').select_related('hotel_settings').order_by('-date_joined')
        
        for u in owners:
            # Safely get hotel settings (handle potential missing settings for new signups)
            settings = getattr(u, 'hotel_settings', None)
            
            hotels_data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'date_joined': u.date_joined,
                'is_active': u.is_active,
                'hotel_name': settings.hotel_name if settings else "N/A",
                'license_expiry': settings.license_expiry if settings else None,
                # Determine Plan based on license key presence
                'plan': 'PRO' if (settings and settings.license_key and settings.license_key != 'FREE') else 'FREE'
            })

        return Response({
            'stats': {
                'total_hotels': total_hotels,
                'active_licenses': active_licenses,
                'platform_revenue': platform_revenue,
                'total_rooms': total_rooms
            },
            'hotels': hotels_data,
            'announcements': list(announcements)
        })

    def post(self, request):
        """
        Handles Admin Actions: Ban User, Edit Tenant, Announcements.
        """
        action = request.data.get('action')
        User = get_user_model()

        # --- ACTION: TOGGLE STATUS (Ban/Unban) ---
        if action == 'toggle_status':
            hotel_id = request.data.get('hotel_id')
            try:
                user = User.objects.get(id=hotel_id)
                
                # SAFETY: Prevent banning yourself
                if user.id == request.user.id:
                    return Response({'error': 'You cannot ban your own Super Admin account.'}, status=400)
                
                user.is_active = not user.is_active
                user.save()
                
                status_msg = 'Active' if user.is_active else 'Suspended'
                return Response({'status': 'success', 'new_status': status_msg})
                
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=404)

        # --- ACTION: EDIT TENANT (Update Name/Expiry) ---
        elif action == 'edit_tenant':
            hotel_id = request.data.get('hotel_id')
            try:
                user = User.objects.get(id=hotel_id)
                
                # Robustness: Use get_or_create so we can fix broken profiles
                settings, _ = HotelSettings.objects.get_or_create(owner=user)
                
                if 'hotel_name' in request.data:
                    settings.hotel_name = request.data['hotel_name']
                
                if 'license_expiry' in request.data:
                    # Handle empty string (Lifetime) vs Date
                    expiry = request.data['license_expiry']
                    settings.license_expiry = expiry if expiry else None
                
                settings.save()
                
                # Log this admin action
                ActivityLog.objects.create(
                    owner=request.user, # Super Admin is the actor
                    action='ADMIN_UPDATE',
                    details=f"Updated Tenant {user.username}: {settings.hotel_name}"
                )
                
                return Response({'status': 'success', 'msg': 'Tenant updated successfully'})
                
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=404)

        # --- ACTION: POST ANNOUNCEMENT ---
        elif action == 'create_announcement':
            title = request.data.get('title')
            message = request.data.get('message')
            
            if title and message:
                GlobalAnnouncement.objects.create(title=title, message=message)
                return Response({'status': 'success', 'msg': 'Announcement Posted'})
            return Response({'error': 'Title and Message required'}, status=400)
            
        # --- ACTION: DELETE ANNOUNCEMENT ---
        elif action == 'delete_announcement':
            ann_id = request.data.get('id')
            GlobalAnnouncement.objects.filter(id=ann_id).delete()
            return Response({'status': 'success'})

        return Response({'error': 'Invalid Action'}, status=400)
    

# ==============================================================================
# 10. PUBLIC BOOKING ENGINE (WEBSITE BUILDER)
# ==============================================================================

class PublicHotelView(APIView):
    """
    Public Access Endpoint for the Guest Booking Engine.
    Allows guests to view Hotel Details and Available Rooms via the Owner's Username.
    
    Example URL: /api/public/hotel/myhotelname/
    """
    permission_classes = [permissions.AllowAny] # Open to the world (No Auth required)

    def get(self, request, username):
        """
        Fetch hotel details by username (subdomain logic).
        """
        # 1. Fetch the Hotel Owner
        # We also check is_active=True so suspended hotels cannot take bookings.
        user = get_object_or_404(CustomUser, username=username, role='OWNER', is_active=True)
        
        # 2. Get Hotel Settings safely
        settings = getattr(user, 'hotel_settings', None)
        
        if not settings:
            return Response(
                {'error': 'This hotel is registered but not fully configured yet.'}, 
                status=404
            )

        # 3. Get Available Rooms
        # Only fetch rooms that are explicitly 'AVAILABLE' (Clean & Ready).
        # Ordered by price so guests see the cheapest options first.
        rooms = Room.objects.filter(owner=user, status='AVAILABLE').order_by('price_per_night')
        
        # 4. Return Data
        return Response({
            'hotel': PublicHotelSerializer(settings).data,
            'rooms': PublicRoomSerializer(rooms, many=True).data
        })

class PublicBookingCreateView(APIView):
    """
    Handles Public Bookings from the Guest Engine (Web).
    - Prevents Double Bookings using Database Locking.
    - Validates Dates.
    - Updates Guest profiles if they already exist.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        try:
            # 1. Validate Date Format & Logic
            try:
                check_in = datetime.strptime(data['check_in'], '%Y-%m-%d').date()
                check_out = datetime.strptime(data['check_out'], '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid Date Format. Use YYYY-MM-DD.'}, status=400)

            if check_in >= check_out:
                return Response({'error': 'Check-out date must be after check-in date'}, status=400)

            # 2. Database Transaction: Ensures Atomicity (All or Nothing)
            with transaction.atomic():
                # Find the Hotel Owner (Subdomain context)
                owner = get_object_or_404(CustomUser, username=data['hotel_username'], role='OWNER')

                # 3. Find or Create Guest (Update details if returning)
                guest, created = Guest.objects.get_or_create(
                    email=data['guest_email'],
                    owner=owner,
                    defaults={
                        'full_name': data['guest_name'],
                        'phone': data['guest_phone']
                    }
                )
                
                # If guest exists, update their latest contact info
                if not created:
                    guest.full_name = data['guest_name']
                    guest.phone = data['guest_phone']
                    guest.save()

                # 4. Find Available Room (CRITICAL: Database Lock)
                # select_for_update() locks the selected rows until the transaction finishes.
                # This prevents "Race Conditions" where 2 people book the same room instantly.
                room = Room.objects.select_for_update().filter(
                    owner=owner, 
                    room_type=data['room_type'], 
                    status='AVAILABLE'
                ).first()

                if not room:
                    return Response({'error': 'Sorry, this room type is no longer available.'}, status=400)

                # 5. Calculate Price
                nights = (check_out - check_in).days
                total_amount = room.price_per_night * nights

                # 6. Create Booking
                booking = Booking.objects.create(
                    owner=owner,
                    room=room,
                    guest=guest,
                    check_in_date=check_in,
                    check_out_date=check_out,
                    total_amount=total_amount,
                    status='CONFIRMED', # Change to 'PENDING' if integrating Payment Gateway
                    payment_status='PENDING',
                    source='WEB'
                )

                # 7. Update Room Status immediately
                room.status = 'BOOKED'
                room.save()

            # 8. Send Email (Outside transaction block to not slow down DB)
            try:
                send_booking_email(booking, 'CONFIRMATION')
            except Exception as e:
                # Log error but don't fail the booking response
                print(f"Email sending failed: {e}")

            return Response({
                'status': 'Confirmed', 
                'booking_id': booking.id, 
                'amount': total_amount,
                'room_number': room.room_number,
                'guest_name': guest.full_name
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)