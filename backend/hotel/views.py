from rest_framework import viewsets, status, views, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import action, api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Q, Count
from django.http import HttpResponse
from datetime import timedelta
from django.utils import timezone
import csv

from .models import *
from .serializers import *
from core.models import User

# --- Base Class to Isolate Data per Hotel ---
class BaseSaaSViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Logic: If user is staff, get their owner's ID, otherwise they ARE the owner
        owner = getattr(user, 'hotel_owner', None) or user
        return self.queryset.filter(owner=owner)

    def perform_create(self, serializer):
        user = self.request.user
        owner = getattr(user, 'hotel_owner', None) or user
        serializer.save(owner=owner)

# --- Core ViewSets ---

class RoomViewSet(BaseSaaSViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    @action(detail=True, methods=['post'], url_path='mark-clean')
    def mark_clean(self, request, pk=None):
        room = self.get_object()
        room.status = 'AVAILABLE'
        room.save()
        return Response({'status': 'Room marked clean', 'room_number': room.room_number})

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
        return Response({'status': 'VIP updated', 'is_vip': guest.is_vip})

class ServiceViewSet(BaseSaaSViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class InventoryViewSet(BaseSaaSViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventorySerializer

    @action(detail=True, methods=['post'], url_path='update-stock')
    def update_stock(self, request, pk=None):
        item = self.get_object()
        change = int(request.data.get('change', 0))
        item.current_stock += change
        item.save()
        return Response({'status': 'Stock Updated', 'new_count': item.current_stock})

class ExpenseViewSet(BaseSaaSViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class HousekeepingViewSet(BaseSaaSViewSet):
    queryset = HousekeepingTask.objects.all()
    serializer_class = HousekeepingSerializer

class StaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StaffSerializer

    def get_queryset(self):
        user = self.request.user
        owner = getattr(user, 'hotel_owner', None) or user
        return User.objects.filter(Q(hotel_owner=owner) | Q(id=owner.id))

class SettingsViewSet(BaseSaaSViewSet):
    queryset = HotelSettings.objects.all()
    serializer_class = HotelSettingsSerializer

    def list(self, request, *args, **kwargs):
        user = self.request.user
        owner = getattr(user, 'hotel_owner', None) or user
        instance, created = HotelSettings.objects.get_or_create(owner=owner)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class BookingViewSet(BaseSaaSViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    def perform_create(self, serializer):
        room = serializer.validated_data['room']
        if room.status != 'AVAILABLE':
            return Response({'error': 'Room is not available'}, status=400)
        room.status = 'OCCUPIED'
        room.save()
        super().perform_create(serializer)

    @action(detail=True, methods=['post'], url_path='add-payment')
    def add_payment(self, request, pk=None):
        booking = self.get_object()
        amount = float(request.data.get('amount', 0))
        mode = request.data.get('mode', 'CASH')
        BookingPayment.objects.create(booking=booking, amount=amount, mode=mode)
        
        total_paid = booking.payments.aggregate(Sum('amount'))['amount__sum'] or 0
        booking.amount_paid = total_paid
        booking.payment_status = 'PAID' if total_paid >= booking.total_amount else 'PARTIAL'
        booking.save()
        return Response({'status': 'Payment added', 'balance_remaining': float(booking.balance)})

    @action(detail=True, methods=['post'], url_path='checkout')
    def checkout(self, request, pk=None):
        booking = self.get_object()
        if booking.balance > 0:
            return Response({'error': f'Outstanding balance of {booking.balance} must be settled.'}, status=400)
        
        booking.status = 'CHECKED_OUT'
        booking.is_checked_out = True
        booking.check_out_date = timezone.now().date()
        booking.save()
        booking.room.status = 'DIRTY'
        booking.room.save()
        return Response({'status': 'Guest checked out successfully.'})
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny], url_path='public_folio')
    def public_folio(self, request, pk=None):
        booking = get_object_or_404(Booking, pk=pk)
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

# --- 👑 SUPER ADMIN VIEW ---
class SuperAdminDashboardView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_hotels = User.objects.filter(user_role='OWNER').count()
        total_rooms = Room.objects.count()
        active_licenses = License.objects.filter(is_active=True).count()
        platform_revenue = Booking.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        recent_hotels = HotelSettings.objects.select_related('owner').all().order_by('-id')[:10]
        hotel_list = [{
            "id": h.id,
            "name": h.hotel_name,
            "owner": h.owner.username,
            "joined": h.owner.date_joined
        } for h in recent_hotels]

        return Response({
            "stats": {
                "total_hotels": total_hotels,
                "total_rooms": total_rooms,
                "active_licenses": active_licenses,
                "platform_revenue": float(platform_revenue)
            },
            "hotels": hotel_list
        })

# --- 📊 REPORTING & EXPORT ---
class ExportReportView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        report_type = request.query_params.get('type', 'bookings')
        user = request.user
        owner = getattr(user, 'hotel_owner', None) or user

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report_{timezone.now().date()}.csv"'
        writer = csv.writer(response)

        if report_type == 'bookings':
            writer.writerow(['ID', 'Guest', 'Room', 'Check-In', 'Check-Out', 'Total Amount', 'Status'])
            data = Booking.objects.filter(owner=owner)
            for b in data:
                writer.writerow([b.id, b.guest.full_name, b.room.room_number, b.check_in_date, b.check_out_date, b.total_amount, b.status])
        
        elif report_type == 'expenses':
            writer.writerow(['Date', 'Title', 'Category', 'Amount'])
            data = Expense.objects.filter(owner=owner)
            for e in data:
                writer.writerow([e.date, e.title, e.category, e.amount])

        return response

# --- ANALYTICS ---
class AnalyticsView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        owner = getattr(user, 'hotel_owner', None) or user
        
        bookings = Booking.objects.filter(owner=owner)
        expenses = Expense.objects.filter(owner=owner)
        total_rev = bookings.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_exp = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        
        room_stats = Room.objects.filter(owner=owner).values('status').annotate(count=Count('status'))
        
        trend = []
        for i in range(6, -1, -1):
            day = timezone.now().date() - timedelta(days=i)
            day_rev = bookings.filter(created_at__date=day).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            trend.append({'date': str(day), 'daily_revenue': float(day_rev)})
            
        return Response({
            'financials': {
                'total_rev': float(total_rev),
                'total_expenses': float(total_exp),
                'net_profit': float(total_rev - total_exp),
            },
            'room_distribution': {item['status']: item['count'] for item in room_stats},
            'trend': trend
        })

# --- AUTH & POS ---
class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        data = request.data
        try:
            if User.objects.filter(username=data['username']).exists():
                return Response({'error': 'Username already exists'}, status=400)
            user = User.objects.create_user(
                username=data['username'], email=data['email'], 
                password=data['password'], user_role='OWNER'
            )
            HotelSettings.objects.create(owner=user, hotel_name=data.get('hotel_name', 'Atithi Hotel'))
            return Response({'status': 'User created'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class POSChargeView(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        room_id = request.data.get('room_id')
        items = request.data.get('items', [])
        user = request.user
        owner = getattr(user, 'hotel_owner', None) or user
        room = get_object_or_404(Room, id=room_id, owner=owner)
        booking = Booking.objects.filter(room=room, status='CHECKED_IN').last()
        
        if not booking:
            return Response({'error': 'No active checked-in guest found.'}, status=400)

        for item in items:
            service = Service.objects.filter(id=item.get('service_id'), owner=owner).first()
            if service:
                BookingCharge.objects.create(booking=booking, description=f"POS: {service.name}", amount=service.price)
        return Response({'status': 'POS items charged to folio'})

# --- LICENSE ---
@api_view(['GET'])
@permission_classes([AllowAny])
def license_status(request):
    license_obj = License.objects.filter(is_active=True).first()
    if not license_obj:
        return Response({'is_expired': True, 'days_left': 0})
    serializer = LicenseSerializer(license_obj)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_license(request):
    key = request.data.get('license_key')
    if key == "DEMO-2025-PRO":
        License.objects.all().delete()
        new_license = License.objects.create(key=key, is_active=True, expiry_date=timezone.now().date() + timedelta(days=365))
        return Response({'success': True, 'expiry_date': new_license.expiry_date})
    return Response({'error': 'Invalid activation key'}, status=400)
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

# PDF Engine Imports (Install with: pip install reportlab)
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from .models import *
from .serializers import *
from core.models import User

# --- Base Class to Isolate Data per Hotel ---
class BaseSaaSViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Ensures staff see their owner's data, owners see their own data
        owner = getattr(user, 'hotel_owner', None) or user
        return self.queryset.filter(owner=owner)

    def perform_create(self, serializer):
        user = self.request.user
        owner = getattr(user, 'hotel_owner', None) or user
        instance = serializer.save(owner=owner)
        # Audit Log
        SystemLog.objects.create(
            owner=owner,
            action="CREATE",
            details=f"Created {instance.__class__.__name__}: {str(instance)}"
        )

# --- Core ViewSets ---

class RoomViewSet(BaseSaaSViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    @action(detail=True, methods=['post'], url_path='mark-clean')
    def mark_clean(self, request, pk=None):
        room = self.get_object()
        room.status = 'AVAILABLE'
        room.save()
        return Response({'status': 'Room marked clean'})

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
        return Response({'status': 'VIP updated', 'is_vip': guest.is_vip})

class BookingViewSet(BaseSaaSViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    def perform_create(self, serializer):
        room = serializer.validated_data['room']
        if room.status != 'AVAILABLE':
            raise serializers.ValidationError("Room is not available for booking.")
        room.status = 'OCCUPIED'
        room.save()
        super().perform_create(serializer)

    @action(detail=True, methods=['post'], url_path='add-payment')
    def add_payment(self, request, pk=None):
        booking = self.get_object()
        amount = float(request.data.get('amount', 0))
        mode = request.data.get('mode', 'CASH')
        BookingPayment.objects.create(booking=booking, amount=amount, mode=mode)
        # Note: Signal in models.py handles recalculation
        return Response({'status': 'Payment recorded', 'new_balance': float(booking.balance)})

    @action(detail=True, methods=['post'], url_path='checkout')
    def checkout(self, request, pk=None):
        booking = self.get_object()
        if booking.balance > 0:
            return Response({'error': f'Outstanding balance: ₹{booking.balance}'}, status=400)
        
        booking.status = 'CHECKED_OUT'
        booking.is_checked_out = True
        booking.check_out_date = timezone.now().date()
        booking.save()
        
        booking.room.status = 'DIRTY'
        booking.room.save()
        
        SystemLog.objects.create(owner=booking.owner, action="CHECKOUT", details=f"Guest {booking.guest.full_name} checked out")
        return Response({'status': 'Guest checked out. Room marked DIRTY.'})

# --- 📄 PDF & ADVANCED REPORTING ---

class EndOfDayReportView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        owner = getattr(user, 'hotel_owner', None) or user
        today = timezone.now().date()
        
        # Data Retrieval
        bookings = Booking.objects.filter(owner=owner, created_at__date=today)
        total_rev = bookings.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # PDF Creation
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        p.setFont("Helvetica-Bold", 20)
        p.drawString(100, 800, "Daily Audit Report")
        p.setFont("Helvetica", 12)
        p.drawString(100, 775, f"Date: {today}")
        p.drawString(100, 755, f"Total Revenue: ₹{total_rev}")
        p.drawString(100, 735, f"Total Check-ins: {bookings.count()}")
        
        # Drawing a simple table header
        p.line(100, 720, 500, 720)
        p.drawString(100, 705, "Booking ID")
        p.drawString(200, 705, "Guest Name")
        p.drawString(400, 705, "Amount")
        
        y = 685
        for b in bookings:
            p.drawString(100, y, f"BK-{b.id}")
            p.drawString(200, y, b.guest.full_name[:20])
            p.drawString(400, y, f"₹{b.total_amount}")
            y -= 20
            
        p.showPage()
        p.save()
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')

# --- 👑 SUPER ADMIN CONTROLS ---

class SuperAdminDashboardView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_hotels = User.objects.filter(user_role='OWNER').count()
        total_rooms = Room.objects.count()
        active_licenses = License.objects.filter(is_active=True).count()
        platform_rev = Booking.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        recent = HotelSettings.objects.select_related('owner').all().order_by('-id')[:10]
        hotels = [{"id": h.id, "name": h.hotel_name, "owner": h.owner.username, "joined": h.owner.date_joined} for h in recent]

        return Response({
            "stats": {
                "total_hotels": total_hotels,
                "total_rooms": total_rooms,
                "active_licenses": active_licenses,
                "platform_revenue": float(platform_rev)
            },
            "hotels": hotels
        })

# --- 📊 ANALYTICS & LOGS ---

class AnalyticsView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        owner = getattr(user, 'hotel_owner', None) or user
        
        bookings = Booking.objects.filter(owner=owner)
        total_rev = bookings.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        room_stats = Room.objects.filter(owner=owner).values('status').annotate(count=Count('status'))
        
        return Response({
            'financials': {
                'total_rev': float(total_rev),
                'gst_estimate': float(total_rev) * 0.12,
                'net_profit': float(total_rev) * 0.88
            },
            'room_distribution': {item['status']: item['count'] for item in room_stats},
            'health_score': 98.2
        })

class ExportReportView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        report_type = request.query_params.get('type', 'bookings')
        user = request.user
        owner = getattr(user, 'hotel_owner', None) or user
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        writer = csv.writer(response)

        if report_type == 'bookings':
            writer.writerow(['ID', 'Guest', 'Room', 'Check-In', 'Check-Out', 'Total', 'Status'])
            data = Booking.objects.filter(owner=owner)
            for b in data:
                writer.writerow([b.id, b.guest.full_name, b.room.room_number, b.check_in_date, b.check_out_date, b.total_amount, b.status])
        return response

# --- AUTH, POS & LICENSE ---

class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        data = request.data
        try:
            user = User.objects.create_user(username=data['username'], email=data['email'], password=data['password'], user_role='OWNER')
            HotelSettings.objects.create(owner=user, hotel_name=data.get('hotel_name', 'Atithi Hotel'))
            return Response({'status': 'Registration successful'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class POSChargeView(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        room_id = request.data.get('room_id')
        items = request.data.get('items', [])
        user = request.user
        owner = getattr(user, 'hotel_owner', None) or user
        room = get_object_or_404(Room, id=room_id, owner=owner)
        booking = Booking.objects.filter(room=room, status='CHECKED_IN').last()
        
        if not booking:
            return Response({'error': 'No active guest found.'}, status=400)

        for item in items:
            service = Service.objects.filter(id=item.get('service_id'), owner=owner).first()
            if service:
                BookingCharge.objects.create(booking=booking, description=f"POS: {service.name}", amount=service.price)
        return Response({'status': 'Charged to folio'})

@api_view(['GET'])
@permission_classes([AllowAny])
def license_status(request):
    license_obj = License.objects.filter(is_active=True).first()
    if not license_obj:
        return Response({'is_expired': True, 'days_left': 0})
    return Response(LicenseSerializer(license_obj).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_license(request):
    key = request.data.get('license_key')
    if key == "DEMO-2025-PRO":
        License.objects.all().delete()
        License.objects.create(key=key, is_active=True, expiry_date=timezone.now().date() + timedelta(days=365))
        return Response({'success': True})
    return Response({'error': 'Invalid Key'}, status=400)

# Helper ViewSets
class ServiceViewSet(BaseSaaSViewSet): queryset = Service.objects.all(); serializer_class = ServiceSerializer
class InventoryViewSet(BaseSaaSViewSet): queryset = InventoryItem.objects.all(); serializer_class = InventorySerializer
class ExpenseViewSet(BaseSaaSViewSet): queryset = Expense.objects.all(); serializer_class = ExpenseSerializer
class HousekeepingViewSet(BaseSaaSViewSet): queryset = HousekeepingTask.objects.all(); serializer_class = HousekeepingSerializer
class StaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StaffSerializer
    def get_queryset(self):
        owner = getattr(self.request.user, 'hotel_owner', None) or self.request.user
        return User.objects.filter(Q(hotel_owner=owner) | Q(id=owner.id))
class SettingsViewSet(BaseSaaSViewSet): queryset = HotelSettings.objects.all(); serializer_class = HotelSettingsSerializer
class SystemLogViewSet(BaseSaaSViewSet): queryset = SystemLog.objects.all().order_by('-timestamp'); serializer_class = SystemLogSerializer
