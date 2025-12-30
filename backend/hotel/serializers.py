from rest_framework import serializers
from .models import *
from core.models import User

class HotelSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelSettings
        fields = '__all__'
        read_only_fields = ['owner']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ['owner']

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'
        read_only_fields = ['owner']

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ['owner']

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['owner']

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['owner']

class ChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingCharge
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPayment
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    guest_details = GuestSerializer(source='guest', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    charges = ChargeSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    
    room_type_name = serializers.CharField(source='room.room_type', read_only=True)
    hotel_name = serializers.CharField(source='owner.hotel_settings.hotel_name', read_only=True, default="Atithi Hotel")
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    
    # Calculated Fields for Frontend Display
    days_stayed = serializers.SerializerMethodField()
    room_rent = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'
        # Added 'total_amount' to read_only since it is now calculated automatically via Signals
        read_only_fields = ['owner', 'amount_paid', 'payment_status', 'total_amount']

    def get_days_stayed(self, obj):
        if not obj.check_in_date or not obj.check_out_date:
            return 0
        delta = obj.check_out_date - obj.check_in_date
        return delta.days if delta.days > 0 else 1

    def get_room_rent(self, obj):
        # Explicitly calculate Room Cost (Days * Price) separate from Extras
        days = self.get_days_stayed(obj)
        return float(obj.room.price_per_night) * days

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        request = self.context.get('request')
        if request and request.user:
            user.hotel_owner = request.user.hotel_owner or request.user
            user.save()
        return user

class HousekeepingSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.first_name', read_only=True)

    class Meta:
        model = HousekeepingTask
        fields = '__all__'
        read_only_fields = ['owner']