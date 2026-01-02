from rest_framework import serializers
from .models import (
    HotelSettings, Room, Guest, Booking, InventoryItem, 
    Expense, MenuItem, Order, HousekeepingTask, ActivityLog,
    BookingCharge, BookingPayment
)
from core.models import CustomUser

# --- SETTINGS & CONFIG ---
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

# --- ROOMS ---
class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ['owner']

# --- GUESTS ---
class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = '__all__'
        read_only_fields = ['owner']

# --- BOOKING & FINANCIALS ---
class BookingChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingCharge
        fields = ['id', 'description', 'amount', 'date']

class BookingPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPayment
        fields = ['id', 'amount', 'payment_mode', 'date']

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

    class Meta:
        model = Booking
        fields = '__all__'
        # These fields are calculated or linked automatically
        read_only_fields = ['owner', 'guest', 'room', 'total_amount', 'status']

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
        
        # If guest exists but name changed, update it (optional)
        if not created and guest.full_name != guest_name:
            guest.full_name = guest_name
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
                # If invalid room ID sent, proceed as a "Room Unassigned" booking
                pass 

        # 4. Create the Booking
        booking = Booking.objects.create(
            guest=guest, 
            room=room, 
            total_amount=total,
            status='CHECKED_IN' if room else 'CONFIRMED', # Check-in if room assigned
            **validated_data
        )
        
        return booking

# --- INVENTORY & EXPENSES ---
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

# --- POS & SERVICES ---
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

# --- HOUSEKEEPING ---
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

# --- LOGS & STAFF ---
class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ['owner', 'timestamp']

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Only expose safe fields for staff listing
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']