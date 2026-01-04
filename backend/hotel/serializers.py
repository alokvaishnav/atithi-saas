from rest_framework import serializers
from .models import (
    HotelSettings, Room, Guest, Booking, InventoryItem, 
    Expense, MenuItem, Order, HousekeepingTask, ActivityLog,
    BookingCharge, BookingPayment, PlatformSettings
)
from core.models import CustomUser

# --- NEW: Import the Email Utility ---
try:
    from .utils import send_booking_email
except ImportError:
    pass # Handle circular imports gracefully during migration

# --- 1. USER & STAFF SERIALIZERS ---

class HotelSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelSettings
        fields = '__all__'
        read_only_fields = ['owner', 'license_key', 'license_expiry']
        # Hide sensitive passwords in GET requests, allow in POST/PATCH
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'whatsapp_auth_token': {'write_only': True}
        }

class UserSerializer(serializers.ModelSerializer):
    # CRITICAL: Include settings so frontend knows the Hotel Name/Logo
    hotel_settings = HotelSettingsSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'is_active', 'date_joined', 'hotel_settings']

class StaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'date_joined']
        read_only_fields = ['date_joined']
        
    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

# --- 2. SETTINGS & CONFIG ---

class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = '__all__'
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'whatsapp_token': {'write_only': True}
        }

# --- 3. PUBLIC FACING SERIALIZERS (WEBSITE BUILDER) ---

class PublicHotelSerializer(serializers.ModelSerializer):
    """Exposes only public hotel info for the booking website"""
    class Meta:
        model = HotelSettings
        fields = ['hotel_name', 'description', 'address', 'phone', 'email', 'website', 'logo', 'currency_symbol', 'check_in_time', 'check_out_time']

class PublicRoomSerializer(serializers.ModelSerializer):
    """Groups rooms by type for the booking engine"""
    class Meta:
        model = Room
        fields = ['id', 'room_number', 'room_type', 'price_per_night', 'capacity', 'floor', 'amenities']

class PublicBookingSerializer(serializers.Serializer):
    """Handles bookings from the public website"""
    hotel_username = serializers.CharField() # The 'slug' (e.g., grand_hotel)
    guest_name = serializers.CharField()
    guest_email = serializers.EmailField()
    guest_phone = serializers.CharField()
    room_type = serializers.CharField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    adults = serializers.IntegerField()
    children = serializers.IntegerField()

# --- 4. CORE SERIALIZERS (OPERATIONS) ---

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        # This now includes 'ical_link' automatically from the updated model
        fields = '__all__'
        read_only_fields = ['owner']

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'
        read_only_fields = ['owner']

class BookingChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingCharge
        fields = ['id', 'description', 'amount', 'date']

class BookingPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPayment
        fields = ['id', 'amount', 'payment_mode', 'date', 'transaction_id']

# Alias for views that might try to import PaymentSerializer
class PaymentSerializer(BookingPaymentSerializer):
    pass

class BookingSerializer(serializers.ModelSerializer):
    # Nested serializers for read operations (provides full details in JSON)
    guest_details = GuestSerializer(source='guest', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    charges = BookingChargeSerializer(many=True, read_only=True)
    payments = BookingPaymentSerializer(many=True, read_only=True)
    
    # Write-only fields for inputs (Frontend sends IDs/Strings)
    guest_name = serializers.CharField(write_only=True)
    guest_phone = serializers.CharField(write_only=True)
    guest_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    room_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    # Calculated field for balance
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'
        # These fields are calculated or linked automatically
        read_only_fields = ['owner', 'guest', 'room', 'total_amount', 'status', 'source']

    def get_balance(self, obj):
        total_charges = obj.total_amount + sum(c.amount for c in obj.charges.all())
        total_paid = sum(p.amount for p in obj.payments.all())
        return total_charges - total_paid

    def create(self, validated_data):
        # 1. Extract non-model fields
        guest_name = validated_data.pop('guest_name')
        guest_phone = validated_data.pop('guest_phone')
        guest_email = validated_data.pop('guest_email', '')
        room_id = validated_data.pop('room_id', None)
        owner = validated_data['owner'] # Passed by perform_create in ViewSet

        # 2. Get or Create Guest Logic
        # Checks if guest exists by phone number. If not, creates new one.
        guest, created = Guest.objects.get_or_create(
            owner=owner, 
            phone=guest_phone,
            defaults={
                'full_name': guest_name,
                'email': guest_email
            }
        )
        
        # If guest exists but name/email changed, update it
        if not created:
            if guest_name: guest.full_name = guest_name
            if guest_email: guest.email = guest_email
            guest.save()

        # 3. Handle Room & Pricing Logic
        room = None
        total = 0
        
        if room_id:
            try:
                room = Room.objects.get(id=room_id, owner=owner)
                
                # Calculate Rent: (Price Per Night) * (Number of Nights)
                check_in = validated_data['check_in_date']
                check_out = validated_data['check_out_date']
                
                # Calculate duration (at least 1 night)
                delta = check_out - check_in
                nights = delta.days if delta.days > 0 else 1
                
                total = room.price_per_night * nights
                
                # Auto-update room status to Occupied
                room.status = 'OCCUPIED'
                room.save()
                
            except Room.DoesNotExist:
                pass 

        # 4. Create the Booking
        booking = Booking.objects.create(
            guest=guest, 
            room=room, 
            total_amount=total,
            status='CHECKED_IN' if room else 'CONFIRMED', # Check-in if room assigned
            **validated_data
        )
        
        # --- 5. AUTOMATION TRIGGER ---
        # Automatically send confirmation email if enabled in settings
        try:
            if hasattr(owner, 'hotel_settings') and owner.hotel_settings.auto_send_confirmation:
                from .utils import send_booking_email
                send_booking_email(booking, 'CONFIRMATION')
        except Exception as e:
            print(f"Automation Error: {e}") # Log error but don't fail the booking
        
        return booking

# --- 5. INVENTORY & EXPENSES ---

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['owner', 'last_updated']

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['owner']

# --- 6. POS & SERVICES ---

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'
        read_only_fields = ['owner']

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['owner', 'created_at']

# --- 7. HOUSEKEEPING ---

class HousekeepingTaskSerializer(serializers.ModelSerializer):
    # Flatten related data for easier frontend display
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = HousekeepingTask
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'completed_at']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.username if obj.assigned_to else "Unassigned"

# --- 8. LOGS ---

class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='owner.username') # Actually shows who did it if owner is user

    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ['owner', 'timestamp']