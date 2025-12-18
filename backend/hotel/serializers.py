from rest_framework import serializers
from .models import Room, Guest, Booking

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    # These lines fetch the detailed info (e.g., Room Number instead of just ID 1)
    room_details = RoomSerializer(source='room', read_only=True)
    guest_details = GuestSerializer(source='guest', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'