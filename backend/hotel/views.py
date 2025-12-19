from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
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
    permission_classes = [IsAuthenticated] # 🔒 Protect this

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated] # 🔒 Protect this

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated] # 🔒 Protect this

    # 🛑 EXISTING LOGIC: Auto-occupy room on booking
    def perform_create(self, serializer):
        # 1. Save the Booking first
        booking = serializer.save(created_by=self.request.user)
        
        # 2. Get the Room associated with this booking
        if booking.room:
            room = booking.room
            # 3. Change status to OCCUPIED and save
            room.status = 'OCCUPIED'
            room.save()

# ==============================
# 2. NEW: POS & SERVICES (Phase 2)
# ==============================

class ServiceViewSet(viewsets.ModelViewSet):
    """
    Manage the Menu (Food, Laundry, Spa, etc.)
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

class BookingChargeViewSet(viewsets.ModelViewSet):
    """
    Add items to a bill (e.g., "2x Cokes for Room 101")
    """
    queryset = BookingCharge.objects.all()
    serializer_class = BookingChargeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Auto-calculate the total cost when saving
        charge = serializer.save()
        
        # Optional: You could update the main Booking's total_amount here if you wanted,
        # but usually we calculate the final total dynamically at checkout.