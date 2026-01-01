from rest_framework import serializers
from .models import (
    HotelSettings, Room, Guest, Service, InventoryItem, 
    Expense, Booking, BookingCharge, BookingPayment, 
    HousekeepingTask, SystemLog, License
)
from core.models import CustomUser as User  # Use CustomUser as User

# 0. User & Identity Serializer - SYNCED WITH DATABASE 'role' FIELD
class UserSerializer(serializers.ModelSerializer):
    # Fixed source to use 'get_role_display'
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'role_display', 'is_staff', 'is_superuser']
        read_only_fields = ['id', 'is_staff']

# 1. Global Branding & Configuration
class HotelSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelSettings
        fields = '__all__'
        read_only_fields = ['owner']

# 2. Room Inventory with Amenities
class RoomSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)

    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ['owner']

# 3. Guest Profiles (CRM)
class GuestSerializer(serializers.ModelSerializer):
    id_proof_type_display = serializers.CharField(source='get_id_proof_type_display', read_only=True)

    class Meta:
        model = Guest
        fields = '__all__'
        read_only_fields = ['owner']

# 4. POS & Operations
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

# 5. Folio Components
class ChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingCharge
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    mode_display = serializers.CharField(source='get_mode_display', read_only=True)

    class Meta:
        model = BookingPayment
        fields = '__all__'

# 6. Master Booking Serializer
class BookingSerializer(serializers.ModelSerializer):
    guest_details = GuestSerializer(source='guest', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    charges = ChargeSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    hotel_name = serializers.SerializerMethodField()
    
    nights = serializers.ReadOnlyField()
    gst_amount = serializers.ReadOnlyField() 
    balance_due = serializers.ReadOnlyField(source='balance')
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = [
            'owner', 'total_amount', 'amount_paid', 
            'payment_status', 'is_checked_out'
        ]

    def get_hotel_name(self, obj):
        try:
            return obj.owner.hotel_settings.hotel_name
        except:
            return "Atithi HMS"

# 7. Staff & HR - SYNCED WITH DATABASE 'role' FIELD
class StaffSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'role_display', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        # We need to ensure we're creating the user correctly linked to an owner context if needed,
        # but User.objects.create_user handles the basics.
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        
        request = self.context.get('request')
        if request and request.user:
            # Sync with owner profile logic if your User model has hotel_owner linkage
            # For this MVP, we assume the logged-in user creating staff IS the owner or manager.
            # If your User model has a specific 'hotel_owner' field (ForeignKey to User), set it here.
            if hasattr(user, 'hotel_owner') and hasattr(request.user, 'hotel_owner'):
                 user.hotel_owner = request.user.hotel_owner or request.user
            user.save()
        return user

# 8. Housekeeping & Logs
class HousekeepingSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.first_name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = HousekeepingTask
        fields = '__all__'
        read_only_fields = ['owner']

class SystemLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = SystemLog
        fields = '__all__'

# 9. Licensing
class LicenseSerializer(serializers.ModelSerializer):
    days_left = serializers.IntegerField(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = License
        fields = ['key', 'is_active', 'expiry_date', 'days_left', 'is_expired']

    def get_is_expired(self, obj):
        try:
            # Assuming the License model has a method or property for days_left
            # If strictly using the field calculated in queryset, accessing obj.days_left is fine if annotated
            # Otherwise, calculate manually here:
            from django.utils import timezone
            if not obj.expiry_date: return False
            return obj.expiry_date < timezone.now().date()
        except:
            return True