from django.shortcuts import render
from rest_framework import viewsets
from .models import Guest, Room, Booking
from .serializers import GuestSerializer, RoomSerializer, BookingSerializer

class GuestViewSet(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    # 🛑 THIS IS THE NEW LOGIC
    def perform_create(self, serializer):
        # 1. Save the Booking first
        booking = serializer.save()
        
        # 2. Get the Room associated with this booking
        room = booking.room
        
        # 3. Change status to OCCUPIED and save
        room.status = 'OCCUPIED'
        room.save()