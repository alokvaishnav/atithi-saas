from rest_framework import viewsets, status, views, generics
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

from .models import *
from .serializers import *
from core.models import User

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


# --- 🛠️ BASE SAAS LOGIC (DATA ISOLATION) ---
class BaseSaaSViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Logic: Staff see their owner's data, Owners see their own.
        owner = getattr(user, 'hotel_owner', None) or user
        return self.queryset.filter(owner=owner)

    def perform_create(self, serializer):
        user = self.request.user
        owner = getattr(user, 'hotel_owner', None) or user
        instance = serializer.save(owner=owner)
        
        # 📜 Global Audit Logging for every creation
        SystemLog.objects.create(
            owner=owner,
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
        room = serializer.validated_data['room']
        if room.status != 'AVAILABLE':
            raise serializers.ValidationError({"error": "Room is not available for check-in."})
        
        # Auto-update room state to OCCUPIED
        room.status = 'OCCUPIED'
        room.save()
        super().perform_create(serializer)

    @action(detail=True, methods=['post'], url_path='add-payment')
    def add_payment(self, request, pk=None):
        booking = self.get_object()
        amount = float(request.data.get('amount', 0))
        mode = request.data.get('mode', 'CASH')
        BookingPayment.objects.create(booking=booking, amount=amount, mode=mode)
        return Response({'status': 'Payment recorded', 'balance': float(booking.balance)})

    @action(detail=True, methods=['post'], url_path='checkout')
    def checkout(self, request, pk=None):
        booking = self.get_object()
        if booking.balance > 0:
            return Response({'error': f'Cannot checkout. Pending Balance: ₹{booking.balance}'}, status=400)
        
        booking.status = 'CHECKED_OUT'
        booking.is_checked_out = True
        booking.check_out_date = timezone.now().date()
        booking.save()
        
        # Auto-update room state to DIRTY for Housekeeping
        booking.room.status = 'DIRTY'
        booking.room.save()
        
        SystemLog.objects.create(
            owner=booking.owner, 
            user=request.user, 
            action="CHECKOUT", 
            details=f"Guest {booking.guest.full_name} checked out from Room {booking.room.room_number}"
        )
        return Response({'status': 'Checkout complete. Room needs cleaning.'})

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
        return Response({'status': 'POS items billed to room folio.'})

# --- 💰 FINANCE, HR & SETTINGS ---

class ExpenseViewSet(BaseSaaSViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class StaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StaffSerializer

    def get_queryset(self):
        owner = getattr(self.request.user, 'hotel_owner', None) or self.request.user
        return User.objects.filter(Q(hotel_owner=owner) | Q(id=owner.id))

class SettingsViewSet(BaseSaaSViewSet):
    queryset = HotelSettings.objects.all()
    serializer_class = HotelSettingsSerializer

    def list(self, request, *args, **kwargs):
        owner = getattr(request.user, 'hotel_owner', None) or request.user
        instance, _ = HotelSettings.objects.get_or_create(owner=owner)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

# --- 📄 REPORTING ENGINE (PDF & CSV) ---

class EndOfDayReportView(views.APIView):
    permission_classes = [IsAuthenticated]

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
            p.drawString(250, y, b.room.room_number)
            p.drawString(350, y, "Check-in")
            p.drawString(450, y, str(b.total_amount))
            y -= 15
        
        p.showPage()
        p.save()
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')

class ExportReportView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        report_type = request.query_params.get('type', 'bookings')
        owner = getattr(request.user, 'hotel_owner', None) or request.user
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        writer = csv.writer(response)

        if report_type == 'bookings':
            writer.writerow(['ID', 'Guest', 'Room', 'Check-In', 'Total', 'Status'])
            for b in Booking.objects.filter(owner=owner):
                writer.writerow([b.id, b.guest.full_name, b.room.room_number, b.check_in_date, b.total_amount, b.status])
        return response

class AnalyticsView(views.APIView):
    permission_classes = [IsAuthenticated]
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
        # 🟢 THIS INJECTS THE USER DATA INTO THE LOGIN RESPONSE
        data['username'] = self.user.username
        data['role'] = self.user.role  # Mapping the 'role' field we found in DB
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
                user_role='OWNER'
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
        hotels_count = User.objects.filter(user_role='OWNER').count()
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