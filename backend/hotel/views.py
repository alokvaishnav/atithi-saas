from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from .models import Guest, Room, Booking, Service, BookingCharge
from .serializers import (
    GuestSerializer, 
    RoomSerializer, 
    BookingSerializer, 
    ServiceSerializer, 
    BookingChargeSerializer
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

    # 📧 NEW ACTION: Manually resend confirmation email from the dashboard
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

# ==============================
# 2. POS & SERVICES
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

# ==============================
# 3. EXECUTIVE ANALYTICS (NEW)
# ==============================

class AnalyticsView(APIView):
    """
    Provides financial trends and occupancy rates for the Owner Dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Financial Totals
        stats = Booking.objects.aggregate(
            total_rev=Sum('total_amount'),
            total_tax=Sum('tax_amount'),
            total_advance=Sum('advance_paid')
        )

        # 2. Live Occupancy
        total_rooms = Room.objects.count()
        occupied_rooms = Room.objects.filter(status='OCCUPIED').count()
        occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0

        # 3. Revenue Trend (Last 7 Days)
        trend = Booking.objects.annotate(date=TruncDate('check_in_date')) \
            .values('date') \
            .annotate(daily_revenue=Sum('total_amount')) \
            .order_by('-date')[:7]

        return Response({
            "financials": stats,
            "occupancy": round(occupancy_rate, 1),
            "trend": list(trend),
            "room_count": total_rooms
        })

# ==============================
# 4. PUBLIC GUEST FOLIO (NEW)
# ==============================

class PublicFolioView(APIView):
    """
    🔓 Allows guests to view their own live bill via QR code/link.
    """
    permission_classes = [permissions.AllowAny] # No login required for guests

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response({"error": "Folio record not found"}, status=status.HTTP_404_NOT_FOUND)