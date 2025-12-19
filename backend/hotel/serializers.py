from rest_framework import serializers
from .models import Room, Guest, Booking, Service, BookingCharge

# ============================
# 1. CORE SERIALIZERS
# ============================

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'

# ============================
# 2. POS / SERVICE SERIALIZERS (New)
# ============================

class ServiceSerializer(serializers.ModelSerializer):
    """
    For the Menu (e.g., list of Food items)
    """
    class Meta:
        model = Service
        fields = '__all__'

class BookingChargeSerializer(serializers.ModelSerializer):
    """
    For items added to a bill (e.g., "2x Coffee")
    """
    # Show the name of the service instead of just ID 5
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = BookingCharge
        fields = '__all__'

# ============================
# 3. BOOKING SERIALIZER (Updated)
# ============================

class BookingSerializer(serializers.ModelSerializer):
    # Fetch detailed info for display
    room_details = RoomSerializer(source='room', read_only=True)
    guest_details = GuestSerializer(source='guest', read_only=True)
    
    # 👇 NEW: Include the list of extra charges (Food, Laundry) in the booking data
    charges = BookingChargeSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'