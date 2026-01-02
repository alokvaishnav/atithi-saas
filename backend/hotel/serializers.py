from rest_framework import serializers
from .models import HotelSettings, Room, Guest, Booking, InventoryItem, Expense, MenuItem, Order, HousekeepingTask, ActivityLog
from core.models import CustomUser

class HotelSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelSettings
        fields = '__all__'
        read_only_fields = ['owner']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ['owner']  # <--- FIX 400 ERROR

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'
        read_only_fields = ['owner']  # <--- FIX 400 ERROR

class BookingSerializer(serializers.ModelSerializer):
    guest_details = GuestSerializer(source='guest', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    guest_name = serializers.CharField(write_only=True)
    guest_phone = serializers.CharField(write_only=True)
    room_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['owner', 'guest', 'room', 'total_amount']

    def create(self, validated_data):
        guest_name = validated_data.pop('guest_name')
        guest_phone = validated_data.pop('guest_phone')
        room_id = validated_data.pop('room_id', None)
        owner = validated_data['owner']

        guest, _ = Guest.objects.get_or_create(
            owner=owner, phone=guest_phone,
            defaults={'full_name': guest_name}
        )

        room = None
        if room_id:
            room = Room.objects.get(id=room_id)

        # Calculate Total if room is selected
        total = 0
        if room:
            nights = max(1, (validated_data['check_out_date'] - validated_data['check_in_date']).days)
            total = room.price_per_night * nights

        return Booking.objects.create(guest=guest, room=room, total_amount=total, **validated_data)

class InventorySerializer(serializers.ModelSerializer):
    class Meta: model = InventoryItem; fields = '__all__'; read_only_fields = ['owner']

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta: model = Expense; fields = '__all__'; read_only_fields = ['owner']

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta: model = MenuItem; fields = '__all__'; read_only_fields = ['owner']

class OrderSerializer(serializers.ModelSerializer):
    class Meta: model = Order; fields = '__all__'; read_only_fields = ['owner']

class HousekeepingTaskSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    staff_name = serializers.CharField(source='assigned_to.username', read_only=True)
    class Meta: model = HousekeepingTask; fields = '__all__'; read_only_fields = ['owner']

# --- NEW SERIALIZERS FOR STAFF & LOGS ---
class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta: model = ActivityLog; fields = '__all__'; read_only_fields = ['owner']

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'is_active']