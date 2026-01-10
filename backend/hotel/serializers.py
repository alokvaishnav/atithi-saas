from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, datetime

# ==============================================================================
# MODEL IMPORTS
# ==============================================================================
User = get_user_model()

from .models import (
    HotelSettings, Room, Guest, Booking, InventoryItem, 
    Expense, MenuItem, Order, HousekeepingTask, ActivityLog,
    BookingCharge, BookingPayment, PlatformSettings, GlobalAnnouncement,
    SubscriptionPlan, RoomImage, PlanFeature 
)

try:
    from core.models import CustomUser
except ImportError:
    CustomUser = User

# ==============================================================================
# 1. USER, STAFF & SETTINGS SERIALIZERS
# ==============================================================================

class HotelSettingsSerializer(serializers.ModelSerializer):
    # Include hotel_code in response so frontend knows the ID
    hotel_code = serializers.CharField(read_only=True)

    class Meta:
        model = HotelSettings
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'license_key', 'license_expiry', 'hotel_code']
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'whatsapp_auth_token': {'write_only': True}
        }

class UserSerializer(serializers.ModelSerializer):
    hotel_settings = HotelSettingsSerializer(read_only=True)
    plan = serializers.SerializerMethodField()
    # Expose hotel_code on the user object
    hotel_code = serializers.CharField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'is_active', 'date_joined', 'hotel_settings', 'plan', 'hotel_code', 'is_superuser']
        read_only_fields = ['id', 'date_joined', 'role', 'is_active', 'hotel_code', 'is_superuser']

    def get_plan(self, obj):
        if hasattr(obj, 'hotel_settings') and obj.hotel_settings.license_key:
            return "PRO"
        return "FREE"

# 🟢 NEW: Missing Class Added Here (Fixes ImportError)
class StaffSerializer(serializers.ModelSerializer):
    """
    Serializer for listing and updating Staff members.
    Used by StaffViewSet in views.py.
    """
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'is_active', 'date_joined', 'hotel_code']
        read_only_fields = ['id', 'date_joined', 'hotel_code']

# Handles Owner Registration + Hotel Creation
class TenantRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    hotel_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'username', 'email', 'password', 'hotel_name')

    def create(self, validated_data):
        hotel_name = validated_data.pop('hotel_name')
        password = validated_data.pop('password')
        
        # 1. Create User (Owner)
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.role = 'OWNER'
        user.save()
        
        # 2. Create Hotel Settings (This generates the Hotel ID automatically via model signal/save)
        settings = HotelSettings.objects.create(owner=user, hotel_name=hotel_name)
        
        # 3. Critical: Sync the generated code back to the user immediately
        user.hotel_code = settings.hotel_code
        user.save()
        
        return user

# Handles Staff Registration (Creating new staff)
class StaffRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'date_joined', 'phone_number']
        read_only_fields = ['id', 'date_joined']
        
    def create(self, validated_data):
        # The View (StaffRegisterView) will inject 'hotel_owner' and 'hotel_code'
        if 'role' not in validated_data:
            validated_data['role'] = 'STAFF'
            
        password = validated_data.pop('password')
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

# ==============================================================================
# 2. PLATFORM, PLANS & ANNOUNCEMENTS
# ==============================================================================

class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = '__all__'
        read_only_fields = ['id']
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'whatsapp_token': {'write_only': True}
        }

class GlobalAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalAnnouncement
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

# ==============================================================================
# 3. PUBLIC FACING SERIALIZERS (WEBSITE BUILDER)
# ==============================================================================

class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ['id', 'image','created_at']

class PublicHotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelSettings
        fields = [
            'hotel_name', 'description', 'address', 'phone', 
            'email', 'website', 'logo', 'currency_symbol', 
            'check_in_time', 'check_out_time'
        ]
        read_only_fields = fields

class PublicRoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Room
        fields = ['id', 'room_number', 'room_type', 'price_per_night', 'capacity', 'floor', 'amenities', 'description', 'images']
        read_only_fields = fields

class PublicBookingSerializer(serializers.Serializer):
    hotel_username = serializers.CharField()
    guest_name = serializers.CharField()
    guest_email = serializers.EmailField()
    guest_phone = serializers.CharField()
    room_type = serializers.CharField()
    
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    
    adults = serializers.IntegerField(min_value=1)
    children = serializers.IntegerField(min_value=0, required=False, default=0)

    def validate(self, data):
        check_in = data.get('check_in')
        check_out = data.get('check_out')

        if check_in and check_out:
            if check_in < date.today():
                raise serializers.ValidationError({"check_in": "Check-in date cannot be in the past."})
            if check_out <= check_in:
                raise serializers.ValidationError({"check_out": "Check-out must be after check-in."})
        return data

# ==============================================================================
# 4. CORE OPERATION DEPENDENCIES
# ==============================================================================

class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at', 'public_guest_id']

class BookingChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingCharge
        fields = ['id', 'description', 'amount', 'date']
        read_only_fields = ['id']

class BookingPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPayment
        fields = ['id', 'amount', 'payment_mode', 'date', 'transaction_id']
        read_only_fields = ['id']

# Alias for compatibility
class PaymentSerializer(BookingPaymentSerializer):
    pass

# ==============================================================================
# 5. BOOKING SERIALIZER
# ==============================================================================

class BookingSerializer(serializers.ModelSerializer):
    guest_details = GuestSerializer(source='guest', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    charges = BookingChargeSerializer(many=True, read_only=True)
    payments = BookingPaymentSerializer(many=True, read_only=True)
    
    guest_name = serializers.CharField(write_only=True)
    guest_phone = serializers.CharField(write_only=True)
    guest_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    room_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    balance = serializers.SerializerMethodField()
    guest_name_display = serializers.CharField(source='guest.full_name', read_only=True)
    room_number_display = serializers.CharField(source='room.room_number', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'guest', 'room', 'total_amount', 'status', 'source']

    def get_balance(self, obj):
        total_charges = obj.total_amount + sum(c.amount for c in obj.charges.all())
        total_paid = sum(p.amount for p in obj.payments.all())
        return total_charges - total_paid

    def validate(self, data):
        check_in = data.get('check_in_date')
        check_out = data.get('check_out_date')

        if check_in and check_out:
            if check_in >= check_out:
                raise serializers.ValidationError("Check-out date must be after check-in date.")

        room_id = data.get('room_id') 
        if not room_id and self.instance:
            room_id = self.instance.room.id if self.instance.room else None

        if room_id and check_in and check_out:
            conflicting_bookings = Booking.objects.filter(
                room_id=room_id,
                check_in_date__lt=check_out, 
                check_out_date__gt=check_in, 
                status__in=['CONFIRMED', 'CHECKED_IN'] 
            )
            
            if self.instance:
                conflicting_bookings = conflicting_bookings.exclude(id=self.instance.id)

            if conflicting_bookings.exists():
                raise serializers.ValidationError(f"Room is already booked for these dates.")

        return data

    def create(self, validated_data):
        guest_name = validated_data.pop('guest_name')
        guest_phone = validated_data.pop('guest_phone')
        guest_email = validated_data.pop('guest_email', '')
        room_id = validated_data.pop('room_id', None)
        owner = validated_data['owner']

        guest, created = Guest.objects.get_or_create(
            owner=owner, 
            phone=guest_phone,
            defaults={'full_name': guest_name, 'email': guest_email}
        )
        
        if not created:
            if guest_name: guest.full_name = guest_name
            if guest_email: guest.email = guest_email
            guest.save()

        room = None
        total = 0
        
        if room_id:
            try:
                room = Room.objects.get(id=room_id, owner=owner)
                check_in = validated_data['check_in_date']
                check_out = validated_data['check_out_date']
                
                delta = check_out - check_in
                nights = delta.days if delta.days > 0 else 1
                
                total = room.price_per_night * nights
                
                # Only mark occupied if check-in is today
                if check_in <= date.today():
                    room.status = 'OCCUPIED'
                    room.save()
                
            except Room.DoesNotExist:
                pass 

        booking = Booking.objects.create(
            guest=guest, 
            room=room, 
            total_amount=total,
            status='CHECKED_IN' if (room and validated_data['check_in_date'] <= date.today()) else 'CONFIRMED', 
            **validated_data
        )
        
        return booking

    def update(self, instance, validated_data):
        check_in = validated_data.get('check_in_date', instance.check_in_date)
        check_out = validated_data.get('check_out_date', instance.check_out_date)
        
        if check_in != instance.check_in_date or check_out != instance.check_out_date:
            if instance.room:
                days = (check_out - check_in).days
                nights = days if days > 0 else 1
                instance.total_amount = instance.room.price_per_night * nights
        
        return super().update(instance, validated_data)

# ==============================================================================
# 6. INVENTORY, POS & SERVICES
# ==============================================================================

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'last_updated']

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['id', 'owner']

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'
        read_only_fields = ['id', 'owner']

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'created_at']

# ==============================================================================
# 7. HOUSEKEEPING & LOGS
# ==============================================================================

class HousekeepingTaskSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = HousekeepingTask
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'created_at', 'completed_at']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.username if obj.assigned_to else "Unassigned"

HousekeepingSerializer = HousekeepingTaskSerializer

class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'timestamp']

# ==============================================================================
# 8. AUTHENTICATION HELPERS
# ==============================================================================

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower()

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, write_only=True)
    token = serializers.CharField(write_only=True)
    uid = serializers.CharField(write_only=True)

    def validate(self, data):
        return data