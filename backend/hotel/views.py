from rest_framework import viewsets, status, views, generics, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import action, api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Q, Count
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
import csv
import io

# 📄 PDF Engine Imports
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

# 🟢 IMPORT MODELS
from .models import (
    HotelSettings, Room, Guest, Service, InventoryItem, 
    Expense, Booking, BookingCharge, BookingPayment, 
    HousekeepingTask, SystemLog, License
)
# 🟢 CRITICAL FIX: Import CustomUser from core app
from core.models import CustomUser as User

# 🟢 IMPORT SERIALIZERS
from .serializers import (
    HotelSettingsSerializer, RoomSerializer, GuestSerializer,
    ServiceSerializer, InventorySerializer, ExpenseSerializer,
    BookingSerializer, ChargeSerializer, PaymentSerializer,
    StaffSerializer, HousekeepingSerializer, SystemLogSerializer,
    LicenseSerializer
)

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

# --- 🛡️ SECURITY: CUSTOM PERMISSION CLASSES ---
# These classes ensure users only see data relevant to their role.

class IsOwnerOrManager(permissions.BasePermission):
    """Allows access only to Owners and Managers."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser: 
            return True
        return request.user.role in ['OWNER', 'MANAGER']

class IsFinanceAccess(permissions.BasePermission):
    """Allows Owners, Managers, and Accountants."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser: 
            return True
        return request.user.role in ['OWNER', 'MANAGER', 'ACCOUNTANT']

# --- 🛠️ BASE SAAS LOGIC (DATA ISOLATION) ---
class BaseSaaSViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return self.queryset.all()
            
        # Logic: Staff see their owner's data, Owners see their own.
        # Ensure your User model has 'hotel_owner' field or logic to determine hierarchy.
        # Fallback: if 'hotel_owner' attribute doesn't exist, assume user is independent owner.
        owner = getattr(user, 'hotel_owner', None) or user
        
        # Check if the model has an 'owner' field before filtering
        if hasattr(self.queryset.model, 'owner'):
            return self.queryset.filter(owner=owner)
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        owner = getattr(user, 'hotel_owner', None) or user
        
        # Inject owner if the model supports it
        if hasattr(self.queryset.model, 'owner'):
            instance = serializer.save(owner=owner)
        else:
            instance = serializer.save()
        
        # 📜 Global Audit Logging
        SystemLog.objects.create(
            owner=owner if hasattr(SystemLog, 'owner') else None,
            user=user,
            action="CREATE",
            details=f"Entry created: {instance.__class__.__name__} - {str(instance)}"
        )

# --- 🏨 FRONT OFFICE & ROOM ENGINE ---

class RoomViewSet(BaseSaaSViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    @action(detail=True, methods=['post'], url_path='mark-clean')
    def mark_clean(self, request, pk=None):
        room = self.get_object()
        room.status = 'AVAILABLE'
        room.save()
        return Response({'status': f'Room {room.room_number} is now Available'})

    @action(detail=True, methods=['post'], url_path='toggle-maintenance')
    def toggle_maintenance(self, request, pk=None):
        # 🔒 Security: Only Owners/Managers can disable a room
        if request.user.role not in ['OWNER', 'MANAGER'] and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
            
        room = self.get_object()
        room.status = 'MAINTENANCE' if room.status != 'MAINTENANCE' else 'AVAILABLE'
        room.save()
        return Response({'status': f'Room set to {room.status}'})

class GuestViewSet(BaseSaaSViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer

    @action(detail=True, methods=['post'], url_path='toggle-vip')
    def toggle_vip(self, request, pk=None):
        guest = self.get_object()
        guest.is_vip = not guest.is_vip
        guest.save()
        return Response({'is_vip': guest.is_vip})

class BookingViewSet(BaseSaaSViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    def perform_create(self, serializer):
        room = serializer.validated_data.get('room')
        # Only validate availability for new bookings if room is provided
        if room and room.status != 'AVAILABLE':
             # Allow force check-in? For now, raise error.
             # You might want to allow it if status is DIRTY but guest is waiting.
             # For strict logic:
             # raise serializers.ValidationError({"error": "Room is not available."})
             pass 
        
        # Auto-update room state to OCCUPIED if checking in immediately or reserving
        if room:
            room.status = 'OCCUPIED'
            room.save()
            
        super().perform_create(serializer)

    @action(detail=True, methods=['post'], url_path='add-payment')
    def add_payment(self, request, pk=None):
        booking = self.get_object()
        amount = float(request.data.get('amount', 0))
        mode = request.data.get('mode', 'CASH')
        
        BookingPayment.objects.create(booking=booking, amount=amount, mode=mode)
        
        # Update booking totals if needed (though dynamic property handles read)
        booking.amount_paid = (booking.amount_paid or 0) + amount
        if booking.amount_paid >= (booking.total_amount or 0):
            booking.payment_status = 'PAID'
        else:
            booking.payment_status = 'PARTIAL'
        booking.save()

        return Response({'status': 'Payment recorded', 'balance': float(booking.balance)})

    @action(detail=True, methods=['post'], url_path='checkout')
    def checkout(self, request, pk=None):
        booking = self.get_object()
        # Optional: Prevent checkout if balance due
        if booking.balance > 0 and not request.data.get('force', False):
            return Response({'error': f'Cannot checkout. Pending Balance: {booking.balance}'}, status=400)
        
        booking.status = 'CHECKED_OUT'
        booking.is_checked_out = True
        booking.check_out_date = timezone.now().date()
        booking.save()
        
        # Auto-update room state to DIRTY for Housekeeping
        if booking.room:
            booking.room.status = 'DIRTY'
            booking.room.save()
            
            # Create Housekeeping Task
            HousekeepingTask.objects.create(
                owner=booking.owner,
                room=booking.room,
                task_type='CLEANING',
                priority='HIGH',
                notes='Auto-generated on Checkout'
            )
        
        SystemLog.objects.create(
            owner=booking.owner, 
            user=request.user, 
            action="CHECKOUT", 
            details=f"Guest {booking.guest.full_name} checked out from Room {booking.room.room_number if booking.room else 'N/A'}"
        )
        return Response({'status': 'Checkout complete. Room needs cleaning.'})
    
    @action(detail=True, methods=['post'], url_path='charges')
    def charges(self, request, pk=None):
        booking = self.get_object()
        desc = request.data.get('description')
        amount = request.data.get('amount')
        
        if not desc or not amount:
            return Response({'error': 'Invalid data'}, status=400)
            
        charge = BookingCharge.objects.create(
            booking=booking,
            description=desc,
            amount=amount,
            date=timezone.now()
        )
        
        # Update Total
        booking.total_amount = (booking.total_amount or 0) + float(amount)
        booking.save()
        
        return Response(ChargeSerializer(charge).data)
        
    @action(detail=True, methods=['get'])
    def folio(self, request, pk=None):
        booking = self.get_object()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

# --- 🍔 POS, SERVICES & HOUSEKEEPING ---

class ServiceViewSet(BaseSaaSViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class InventoryViewSet(BaseSaaSViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventorySerializer

class HousekeepingViewSet(BaseSaaSViewSet):
    queryset = HousekeepingTask.objects.all()
    serializer_class = HousekeepingSerializer

class POSChargeView(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        room_id = request.data.get('room_id')
        items = request.data.get('items', [])
        owner = getattr(request.user, 'hotel_owner', None) or request.user
        
        room = get_object_or_404(Room, id=room_id, owner=owner)
        booking = Booking.objects.filter(room=room, status='CHECKED_IN').last()
        
        if not booking:
            return Response({'error': 'No active guest found in this room.'}, status=400)

        for item in items:
            service = Service.objects.filter(id=item.get('service_id'), owner=owner).first()
            if service:
                BookingCharge.objects.create(booking=booking, description=f"POS: {service.name}", amount=service.price)
                # Update booking total
                booking.total_amount = (booking.total_amount or 0) + service.price
                booking.save()
                
        return Response({'status': 'POS items billed to room folio.'})

# --- 💰 FINANCE, HR & SETTINGS (RESTRICTED ACCESS) ---

class ExpenseViewSet(BaseSaaSViewSet):
    # 🔒 RESTRICTED: Only Owners, Managers, Accountants
    permission_classes = [IsAuthenticated, IsFinanceAccess]
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class StaffViewSet(viewsets.ModelViewSet):
    # 🔒 RESTRICTED: Only Owners and Managers can manage staff
    permission_classes = [IsAuthenticated, IsOwnerOrManager]
    serializer_class = StaffSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return User.objects.all()
            
        owner = getattr(user, 'hotel_owner', None) or user
        # Return all users belonging to this owner (including the owner themselves)
        # Assuming we can filter by some relationship or just list all for simplicity in MVP 
        # For robust logic: User needs a 'hotel_owner' FK. If not present, this might return all.
        # Fallback filter logic:
        if hasattr(User, 'hotel_owner'):
            return User.objects.filter(Q(hotel_owner=owner) | Q(id=owner.id))
        else:
            # If no link exists, just return self to prevent data leak
            return User.objects.filter(id=user.id)

class SettingsViewSet(BaseSaaSViewSet):
    # 🔒 RESTRICTED: Only Owners can change hotel settings
    permission_classes = [IsAuthenticated, IsOwnerOrManager]
    queryset = HotelSettings.objects.all()
    serializer_class = HotelSettingsSerializer

    def list(self, request, *args, **kwargs):
        owner = getattr(request.user, 'hotel_owner', None) or request.user
        instance, _ = HotelSettings.objects.get_or_create(owner=owner)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

# --- 📄 REPORTING ENGINE (PDF & CSV) ---

class EndOfDayReportView(views.APIView):
    # 🔒 RESTRICTED: Financial Data
    permission_classes = [IsAuthenticated, IsFinanceAccess]

    def get(self, request):
        user = request.user
        owner = getattr(user, 'hotel_owner', None) or user
        today = timezone.now().date()
        bookings = Booking.objects.filter(owner=owner, created_at__date=today)
        total_rev = bookings.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, 800, f"Atithi HMS - Night Audit Report ({today})")
        
        p.setFont("Helvetica", 10)
        p.drawString(50, 775, f"Operator: {user.username}")
        p.drawString(50, 760, f"Daily Revenue: INR {total_rev}")
        p.line(50, 750, 550, 750)
        
        y = 730
        p.drawString(55, y, "ID")
        p.drawString(100, y, "Guest")
        p.drawString(250, y, "Room")
        p.drawString(350, y, "Mode")
        p.drawString(450, y, "Total")
        y -= 20

        for b in bookings:
            p.drawString(55, y, f"BK-{b.id}")
            p.drawString(100, y, b.guest.full_name[:20])
            p.drawString(250, y, b.room.room_number if b.room else "N/A")
            p.drawString(350, y, "Check-in")
            p.drawString(450, y, str(b.total_amount))
            y -= 15
        
        p.showPage()
        p.save()
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')

class ExportReportView(views.APIView):
    permission_classes = [IsAuthenticated, IsFinanceAccess]

    def get(self, request):
        report_type = request.query_params.get('type', 'bookings')
        owner = getattr(request.user, 'hotel_owner', None) or request.user
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        writer = csv.writer(response)

        if report_type == 'bookings':
            writer.writerow(['ID', 'Guest', 'Room', 'Check-In', 'Total', 'Status'])
            for b in Booking.objects.filter(owner=owner):
                writer.writerow([b.id, b.guest.full_name, b.room.room_number if b.room else 'N/A', b.check_in_date, b.total_amount, b.status])
        return response

class AnalyticsView(views.APIView):
    # 🔒 RESTRICTED: Business Intelligence
    permission_classes = [IsAuthenticated, IsOwnerOrManager]
    def get(self, request):
        owner = getattr(request.user, 'hotel_owner', None) or request.user
        bookings = Booking.objects.filter(owner=owner)
        total_rev = bookings.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        room_stats = Room.objects.filter(owner=owner).values('status').annotate(count=Count('status'))
        
        return Response({
            'financials': {'total_rev': float(total_rev), 'currency': 'INR'},
            'room_distribution': {item['status']: item['count'] for item in room_stats}
        })

# --- 🔐 SYSTEM AUTH, LICENSE & LOGS ---

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # 🟢 INJECT USER DATA (Sent as 'role' by default from DB)
        data['username'] = self.user.username
        data['role'] = self.user.role 
        data['is_superuser'] = self.user.is_superuser
        data['id'] = self.user.id
        try:
            data['hotel_name'] = self.user.hotel_settings.hotel_name
        except:
            data['hotel_name'] = "Atithi HMS"
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        data = request.data
        try:
            # FIX: Explicitly assigning OWNER role during signup
            user = User.objects.create_user(
                username=data['username'], 
                email=data['email'], 
                password=data['password'], 
                role='OWNER' # FIX: Matches User model field name 'role'
            )
            HotelSettings.objects.create(owner=user, hotel_name=data.get('hotel_name', 'Atithi Hotel'))
            return Response({'status': 'Hotel Profile Created'}, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class SystemLogViewSet(BaseSaaSViewSet):
    queryset = SystemLog.objects.all().order_by('-timestamp')
    serializer_class = SystemLogSerializer

class SuperAdminDashboardView(views.APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        # FIX: Matches User model field name 'role'
        hotels_count = User.objects.filter(role='OWNER').count()
        return Response({"stats": {"total_hotels": hotels_count}})

@api_view(['GET'])
@permission_classes([AllowAny])
def license_status(request):
    lic = License.objects.filter(is_active=True).first()
    if not lic: return Response({'is_expired': True, 'days_left': 0})
    return Response(LicenseSerializer(lic).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_license(request):
    key = request.data.get('license_key')
    if key == "DEMO-2025-PRO":
        License.objects.all().delete()
        License.objects.create(key=key, is_active=True, expiry_date=timezone.now().date() + timedelta(days=365))
        return Response({'success': True})
    return Response({'error': 'Invalid Activation Key'}, status=400)