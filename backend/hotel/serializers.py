from rest_framework import serializers
from .models import HotelSettings, Room, Guest, Booking
from core.models import CustomUser

class HotelSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelSettings
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    guest_details = GuestSerializer(source='guest', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    guest_name = serializers.CharField(write_only=True)
    guest_phone = serializers.CharField(write_only=True)
    room_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['owner', 'guest', 'room', 'total_amount']

    def create(self, validated_data):
        guest_name = validated_data.pop('guest_name')
        guest_phone = validated_data.pop('guest_phone')
        room_id = validated_data.pop('room_id')
        owner = validated_data['owner']
        guest, _ = Guest.objects.get_or_create(owner=owner, phone=guest_phone, defaults={'full_name': guest_name})
        room = Room.objects.get(id=room_id)
        nights = max(1, (validated_data['check_out_date'] - validated_data['check_in_date']).days)
        total = room.price_per_night * nights
        return Booking.objects.create(guest=guest, room=room, total_amount=total, **validated_data)
