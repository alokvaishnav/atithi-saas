from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.core.management import call_command

from .models import Guest, Room, Booking, Service, BookingCharge, Expense
from .serializers import (
    GuestSerializer, 
    RoomSerializer, 
    BookingSerializer, 
    ServiceSerializer, 
    BookingChargeSerializer,
    ExpenseSerializer
)

# ==============================
# 1. CORE HOTEL OPERATIONS
# ==============================

class GuestViewSet(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    permission_classes = [permissions.IsAuthenticated]

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 🧹 ACTION: Housekeeping Mark Clean
    @action(detail=True, methods=['post'], url_path='mark-clean')
    def mark_clean(self, request, pk=None):
        """ Transitions a room from DIRTY or MAINTENANCE back to AVAILABLE. """
        room = self.get_object()
        room.status = 'AVAILABLE'
        room.save()
        return Response(
            {'status': f'Room {room.room_number} is now Clean and Available.'},
            status=status.HTTP_200_OK
        )

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # 1. Save the Booking with the user who created it
        booking = serializer.save(created_by=self.request.user)
        
        # 2. Auto-occupy the room
        if booking.room:
            room = booking.room
            room.status = 'OCCUPIED'
            room.save()

    # 📧 ACTION: Manually resend confirmation email
    @action(detail=True, methods=['post'], url_path='send-confirmation')
    def send_confirmation(self, request, pk=None):
        booking = self.get_object()
        if booking.guest.email:
            try:
                booking.send_confirmation_email()
                return Response({'status': 'Email sent successfully'}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'error': 'Guest has no email address'}, status=status.HTTP_400_BAD_REQUEST)

    # 🧹 ACTION: Professional Checkout Logic
    @action(detail=True, methods=['post'], url_path='checkout')
    def checkout(self, request, pk=None):
        """ Finalizes stay and moves room to DIRTY for Housekeeping. """
        booking = self.get_object()
        
        if booking.status != 'CHECKED_IN':
            return Response(
                {'error': 'Checkout only allowed for Checked-In guests.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'CHECKED_OUT'
        booking.save()
        
        if booking.room:
            room = booking.room
            room.status = 'DIRTY'
            room.save()
            
        return Response(
            {'status': 'Checkout successful. Room RM{} moved to DIRTY status.'.format(booking.room.room_number)}, 
            status=status.HTTP_200_OK
        )

# ==============================
# 2. POS, SERVICES & EXPENSES
# ==============================

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

class BookingChargeViewSet(viewsets.ModelViewSet):
    queryset = BookingCharge.objects.all()
    serializer_class = BookingChargeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

class ExpenseViewSet(viewsets.ModelViewSet):
    """ Manage Hotel Operational Costs (Salaries, Utilities, etc.) """
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(paid_by=self.request.user)

# ==============================
# 3. EXECUTIVE ANALYTICS (REVENUE + EXPENSES)
# ==============================

class AnalyticsView(APIView):
    """ Provides Profit & Loss data and occupancy rates for the Owner. """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Revenue Stats
        rev_stats = Booking.objects.aggregate(
            total_rev=Sum('total_amount'),
            total_tax=Sum('tax_amount'),
            total_advance=Sum('advance_paid')
        )

        # 2. Expense Stats
        exp_total = Expense.objects.aggregate(total_exp=Sum('amount'))['total_exp'] or 0

        # 3. Safe Math Conversion (Decimal -> Float) 
        # 🚨 FIX: This prevents the 500 Error when subtracting Decimal vs Float
        total_revenue = float(rev_stats['total_rev'] or 0)
        total_tax = float(rev_stats['total_tax'] or 0)
        total_advance = float(rev_stats['total_advance'] or 0)
        total_expenses = float(exp_total)

        # Now subtraction works perfectly
        net_profit = total_revenue - total_expenses

        # 4. Live Occupancy
        total_rooms = Room.objects.count()
        occupied_rooms = Room.objects.filter(status='OCCUPIED').count()
        occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0

        # 5. Revenue Trend (Last 7 Days)
        trend = Booking.objects.annotate(date=TruncDate('check_in_date')) \
            .values('date') \
            .annotate(daily_revenue=Sum('total_amount')) \
            .order_by('-date')[:7]

        return Response({
            "financials": {
                "total_rev": total_revenue,
                "total_tax": total_tax,
                "total_advance": total_advance,
                "total_expenses": total_expenses,
                "net_profit": net_profit
            },
            "occupancy": round(occupancy_rate, 1),
            "trend": list(trend),
            "room_count": total_rooms
        })

# ==============================
# 4. PUBLIC GUEST FOLIO
# ==============================

class PublicFolioView(APIView):
    """ 🔓 Open link for guests to view their live bill. """
    permission_classes = [permissions.AllowAny] 

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response({"error": "Folio record not found"}, status=status.HTTP_404_NOT_FOUND)

# ==============================
# 5. 🪄 MAGIC SEED TRIGGER (Render Hack)
# ==============================

def seed_data_trigger(request):
    """
    Runs 'python manage.py seed_data' when visited.
    This bypasses Render Free Tier shell restrictions.
    """
    try:
        call_command('seed_data')
        return JsonResponse({
            "status": "Success", 
            "message": "✅ Database has been populated with 50 bookings & rooms!"
        })
    except Exception as e:
        return JsonResponse({
            "status": "Error", 
            "message": str(e)
        })