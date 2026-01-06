from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, datetime

# ==============================================================================
# MODEL IMPORTS
# ==============================================================================
# Adjust imports based on your actual project structure.
# Using get_user_model() ensures we always get the active User class.
User = get_user_model()

from .models import (
    HotelSettings, Room, Guest, Booking, InventoryItem, 
    Expense, MenuItem, Order, HousekeepingTask, ActivityLog,
    BookingCharge, BookingPayment, PlatformSettings, GlobalAnnouncement
)

# If you specifically need the custom user class for type hinting or specific fields:
try:
    from core.models import CustomUser
except ImportError:
    CustomUser = User

# ==============================================================================
# 1. USER, STAFF & SETTINGS SERIALIZERS
# ==============================================================================

class HotelSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelSettings
        fields = '__all__'
        
        # Prevent users from modifying their own license status or ownership
        read_only_fields = ['id', 'owner', 'license_key', 'license_expiry']
        
        # Security: Allow saving these passwords, but NEVER send them back to the frontend
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'whatsapp_auth_token': {'write_only': True}
        }

class UserSerializer(serializers.ModelSerializer):
    # CRITICAL: Include settings so frontend knows the Hotel Name/Logo immediately upon login
    hotel_settings = HotelSettingsSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'is_active', 'date_joined', 'hotel_settings']
        
        # Safety: These fields should not be editable by the user themselves via this serializer
        read_only_fields = ['id', 'date_joined', 'role', 'is_active']

class StaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'date_joined']
        # Safety: Prevent staff from modifying their own join date or ID
        read_only_fields = ['id', 'date_joined']
        
    def create(self, validated_data):
        # Default role to STAFF if not specified for safety
        if 'role' not in validated_data:
            validated_data['role'] = 'STAFF'

        # Use create_user to ensure password is hashed properly
        user = CustomUser.objects.create_user(**validated_data)
        return user

# ==============================================================================
# 2. PLATFORM & ANNOUNCEMENTS
# ==============================================================================

class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = '__all__'
        
        # Protect the ID so it cannot be changed
        read_only_fields = ['id']
        
        # Security: Allow saving these secrets, but NEVER return them in API responses
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'whatsapp_token': {'write_only': True}
        }

class GlobalAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalAnnouncement
        fields = '__all__'
        
        # Protect system-managed fields
        read_only_fields = ['id', 'created_at']

# ==============================================================================
# 3. PUBLIC FACING SERIALIZERS (WEBSITE BUILDER)
# ==============================================================================

class PublicHotelSerializer(serializers.ModelSerializer):
    """Exposes only public hotel info for the booking website"""
    class Meta:
        model = HotelSettings
        fields = [
            'hotel_name', 'description', 'address', 'phone', 
            'email', 'website', 'logo', 'currency_symbol', 
            'check_in_time', 'check_out_time'
        ]
        # Safety: Ensure this serializer is strictly Read-Only
        read_only_fields = fields

class PublicRoomSerializer(serializers.ModelSerializer):
    """Groups rooms by type for the booking engine"""
    class Meta:
        model = Room
        fields = ['id', 'room_number', 'room_type', 'price_per_night', 'capacity', 'floor', 'amenities']
        
        # Safety: Ensure this serializer is strictly Read-Only
        read_only_fields = fields

class PublicBookingSerializer(serializers.Serializer):
    """Handles bookings from the public website with validation"""
    hotel_username = serializers.CharField() # The 'slug' (e.g., grand_hotel)
    guest_name = serializers.CharField()
    guest_email = serializers.EmailField()
    guest_phone = serializers.CharField()
    room_type = serializers.CharField()
    
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    
    # Ensure reasonable numbers for guests
    adults = serializers.IntegerField(min_value=1)
    children = serializers.IntegerField(min_value=0, required=False, default=0)

    def validate(self, data):
        """
        Check that start is before finish and dates are valid.
        """
        check_in = data.get('check_in')
        check_out = data.get('check_out')

        if check_in and check_out:
            if check_in < date.today():
                raise serializers.ValidationError({"check_in": "Check-in date cannot be in the past."})
            
            if check_out <= check_in:
                raise serializers.ValidationError({"check_out": "Check-out must be after check-in."})

        return data

# ==============================================================================
# 4. CORE OPERATION DEPENDENCIES (Must be defined before BookingSerializer)
# ==============================================================================

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        # This automatically includes 'ical_link', 'room_type', 'price', etc.
        fields = '__all__'
        
        # Security: 
        # 1. owner: Prevent transferring rooms between hotels.
        # 2. timestamps: Prevent faking creation/update times.
        # 3. id: System identifier must not be changed.
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'
        
        # Security:
        # 1. owner: Prevents cross-tenant data leaking.
        # 2. timestamps: Preserves the audit trail.
        # 3. id: System identifier must not be changed.
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

class BookingChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingCharge
        fields = ['id', 'description', 'amount', 'date']
        
        # Safety: The ID is database-managed and should never be editable by the user.
        read_only_fields = ['id']

class BookingPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPayment
        fields = ['id', 'amount', 'payment_mode', 'date', 'transaction_id']
        
        # Safety: The ID is auto-generated by the database and must not be editable.
        read_only_fields = ['id']

# Alias for views that might try to import PaymentSerializer (backward compatibility)
class PaymentSerializer(BookingPaymentSerializer):
    pass

# ==============================================================================
# 5. BOOKING SERIALIZER (The Main Logic)
# ==============================================================================

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
    guest_name_display = serializers.CharField(source='guest.full_name', read_only=True)
    room_number_display = serializers.CharField(source='room.room_number', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        # These fields are calculated or linked automatically
        read_only_fields = ['id', 'owner', 'guest', 'room', 'total_amount', 'status', 'source']

    def get_balance(self, obj):
        total_charges = obj.total_amount + sum(c.amount for c in obj.charges.all())
        total_paid = sum(p.amount for p in obj.payments.all())
        return total_charges - total_paid

    # --- 1. VALIDATION: PREVENT DOUBLE BOOKING ---
    def validate(self, data):
        """
        Check room availability before creating or updating a booking.
        """
        check_in = data.get('check_in_date')
        check_out = data.get('check_out_date')

        # Basic Date Logic
        if check_in and check_out:
            if check_in >= check_out:
                raise serializers.ValidationError("Check-out date must be after check-in date.")

        # Check Room Availability
        # We need to handle both 'create' (look at raw room_id) and 'update' (look at instance.room)
        room_id = data.get('room_id') 
        if not room_id and self.instance:
            room_id = self.instance.room.id if self.instance.room else None

        if room_id and check_in and check_out:
            # Query for overlapping bookings
            conflicting_bookings = Booking.objects.filter(
                room_id=room_id,
                check_in_date__lt=check_out, # Overlap Logic: Starts before you leave
                check_out_date__gt=check_in, # Overlap Logic: Ends after you arrive
                status__in=['CONFIRMED', 'CHECKED_IN'] # Only active bookings count
            )
            
            # If updating, exclude self from conflict check
            if self.instance:
                conflicting_bookings = conflicting_bookings.exclude(id=self.instance.id)

            if conflicting_bookings.exists():
                raise serializers.ValidationError(
                    f"Room is already booked for these dates."
                )

        return data

    # --- 2. CREATE LOGIC ---
    def create(self, validated_data):
        # 1. Extract non-model fields
        guest_name = validated_data.pop('guest_name')
        guest_phone = validated_data.pop('guest_phone')
        guest_email = validated_data.pop('guest_email', '')
        room_id = validated_data.pop('room_id', None)
        owner = validated_data['owner'] # Passed by perform_create in ViewSet

        # 2. Get or Create Guest Logic (Tenant-Scoped)
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
                
                # Calculate Rent
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
                # If room ID is invalid or belongs to another owner, ignore it safely
                pass 

        # 4. Create the Booking
        # Note: We rely on signals.py to trigger WhatsApp/Emails. 
        # Do NOT add send_booking_email here, or you will get duplicate emails.
        booking = Booking.objects.create(
            guest=guest, 
            room=room, 
            total_amount=total,
            status='CHECKED_IN' if room else 'CONFIRMED', 
            **validated_data
        )
        
        return booking

    # --- 3. UPDATE LOGIC (Handling Extensions) ---
    def update(self, instance, validated_data):
        """
        Recalculate price if dates change during an edit.
        """
        check_in = validated_data.get('check_in_date', instance.check_in_date)
        check_out = validated_data.get('check_out_date', instance.check_out_date)
        
        # If dates changed, recalculate total amount
        if check_in != instance.check_in_date or check_out != instance.check_out_date:
            if instance.room:
                days = (check_out - check_in).days
                nights = days if days > 0 else 1
                # Update the total amount
                instance.total_amount = instance.room.price_per_night * nights
        
        # Standard update for other fields
        return super().update(instance, validated_data)

# ==============================================================================
# 6. INVENTORY & EXPENSES
# ==============================================================================

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        
        # Security: 
        # 1. owner: Locks the item to the specific hotel.
        # 2. last_updated: Managed automatically by the model's auto_now=True.
        # 3. id: System identifier must not be changed.
        read_only_fields = ['id', 'owner', 'last_updated']

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        
        # Safety: 
        # 1. owner: Ensures expenses stay within the correct hotel account.
        # 2. id: The database primary key should never be editable.
        read_only_fields = ['id', 'owner']

# ==============================================================================
# 7. POS & SERVICES
# ==============================================================================

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'
        
        # Safety: 
        # 1. owner: Ensures the menu item belongs to the correct hotel.
        # 2. id: The primary key is system-managed and read-only.
        read_only_fields = ['id', 'owner']

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        
        # Safety: 
        # 1. owner: Ensures the order is linked to the correct hotel.
        # 2. created_at: Timestamp is auto-generated and immutable.
        # 3. id: System identifier must not be changed.
        read_only_fields = ['id', 'owner', 'created_at']

# ==============================================================================
# 8. HOUSEKEEPING
# ==============================================================================

class HousekeepingTaskSerializer(serializers.ModelSerializer):
    # Flatten related data for easier frontend display (shows "101" instead of ID 5)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = HousekeepingTask
        fields = '__all__'
        
        # Safety: 
        # 1. owner: Ensures task belongs to the correct hotel.
        # 2. timestamps: created_at and completed_at are system managed.
        # 3. id: System identifier must not be changed.
        read_only_fields = ['id', 'owner', 'created_at', 'completed_at']

    def get_assigned_to_name(self, obj):
        # Returns the Staff Name if assigned, otherwise "Unassigned"
        return obj.assigned_to.username if obj.assigned_to else "Unassigned"

# Alias to prevent import errors if views use the generic name
HousekeepingSerializer = HousekeepingTaskSerializer

# ==============================================================================
# 9. LOGS
# ==============================================================================

class ActivityLogSerializer(serializers.ModelSerializer):
    # Maps the 'owner' relationship to the actual username string for display
    user = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = ActivityLog
        fields = '__all__'
        
        # Security: Logs are immutable history.
        # 1. owner: Who performed the action.
        # 2. timestamp: When it happened (auto_now_add).
        # 3. id: The system record ID.
        read_only_fields = ['id', 'owner', 'timestamp']

# ==============================================================================
# 10. AUTHENTICATION HELPERS
# ==============================================================================

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        """
        Normalize email to lowercase to ensure it matches the 
        database record (which should be stored in lowercase).
        """
        return value.lower()

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, write_only=True)
    
    # Security: These are input-only credentials used to verify the request
    token = serializers.CharField(write_only=True)
    uid = serializers.CharField(write_only=True)

    def validate(self, data):
        # Optional: Add custom password complexity checks here if needed
        # e.g., require numbers or special characters
        return data