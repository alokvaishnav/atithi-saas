from rest_framework import serializers
from .models import Room, Guest, Booking

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ['owner'] # Owner is set automatically

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'
        read_only_fields = ['owner']

class BookingSerializer(serializers.ModelSerializer):
    # Nested serializers to show full details in JSON (e.g., Room Number instead of just ID)
    room_details = RoomSerializer(source='room', read_only=True)
    guest_details = GuestSerializer(source='guest', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['owner']