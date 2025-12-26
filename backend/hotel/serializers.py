from rest_framework import serializers
from .models import (
    Room, Guest, Booking, Service, BookingCharge, Expense, PropertySetting,
    InventoryItem, HousekeepingTask 
)

# ============================
# 1. CORE OPERATIONAL SERIALIZERS
# ============================

class RoomSerializer(serializers.ModelSerializer):
    """
    Handles Room inventory data including status and pricing.
    """
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    # 👇 NEW: Helps Super Admin see which hotel this room belongs to
    hotel_name = serializers.CharField(source='owner.hotel_profile.hotel_name', read_only=True)

    class Meta:
        model = Room
        fields = '__all__'

class GuestSerializer(serializers.ModelSerializer):
    """
    Complete Guest Profile including GRC identity fields.
    """
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    # 👇 NEW: Helps Super Admin identify guest origin
    hotel_name = serializers.CharField(source='owner.hotel_profile.hotel_name', read_only=True)

    class Meta:
        model = Guest
        fields = '__all__'

# ============================
# 2. INVENTORY & SERVICES
# ============================

class InventoryItemSerializer(serializers.ModelSerializer):
    """
    Handles stock tracking for items like 'Water Bottles', 'Toiletries', etc.
    """
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    """
    Standard Hotel Menu Items. Now includes 'linked_inventory_item' 
    to automatically deduct stock when sold.
    """
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    
    # Optional: Display the name of the linked inventory item instead of just ID
    linked_inventory_name = serializers.ReadOnlyField(source='linked_inventory_item.name')

    class Meta:
        model = Service
        fields = '__all__'

class BookingChargeSerializer(serializers.ModelSerializer):
    """
    Individual billable items posted to a guest's room folio.
    Includes logic to show category and name for tax invoices.
    """
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_category = serializers.CharField(source='service.category', read_only=True)
    
    class Meta:
        model = BookingCharge
        fields = [
            'id', 'booking', 'service', 'service_name', 'service_category', 
            'description', 'quantity', 'subtotal', 'tax_amount', 
            'total_cost', 'added_at'
        ]

# ============================
# 3. HOUSEKEEPING
# ============================

class HousekeepingTaskSerializer(serializers.ModelSerializer):
    """
    Manages cleaning tasks. Includes read-only fields to make
    displaying data on the dashboard easier.
    """
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = HousekeepingTask
        fields = [
            'id', 'owner', 'room', 'room_number', 'assigned_to', 'assigned_to_name',
            'status', 'notes', 'created_at', 'updated_at'
        ]

# ============================
# 4. BOOKING SERIALIZER
# ============================

class BookingSerializer(serializers.ModelSerializer):
    """
    The main engine for the HMS. Includes nested Room/Guest data, 
    all POS charges, and logic for GRC printing and Advance payments.
    """
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    
    # 👇 NEW: Shows which hotel this booking belongs to (Crucial for Super Admin)
    hotel_name = serializers.CharField(source='owner.hotel_profile.hotel_name', read_only=True)
    
    # Nested Read-Only details for the UI
    room_details = RoomSerializer(source='room', read_only=True)
    guest_details = GuestSerializer(source='guest', read_only=True)
    
    # List of all Service/Food charges attached to this booking
    charges = BookingChargeSerializer(many=True, read_only=True)

    # Calculates the remaining amount to be collected at the hotel
    balance_due = serializers.ReadOnlyField()

    class Meta:
        model = Booking
        fields = [
            'id', 'owner', 'hotel_name', # 👈 Added hotel_name here
            'guest', 
            'guest_details', 
            'room', 
            'room_details', 
            'check_in_date', 
            'check_out_date', 
            'status', 
            # GRC Logistics Fields
            'purpose_of_visit', 
            'coming_from', 
            'going_to',
            # Financial Breakdown
            'subtotal_amount', 
            'tax_amount', 
            'total_amount', 
            'advance_paid', 
            'amount_paid', 
            'balance_due',
            # Metadata
            'charges', 
            'created_by', 
            'created_at'
        ]

    def validate(self, data):
        """
        Custom validation to ensure logical booking consistency.
        Checks for:
        1. Check-out date > Check-in date
        2. Room availability (Prevents Double Bookings)
        """
        # Retrieve values, fallback to instance values for updates (PATCH)
        check_in = data.get('check_in_date')
        check_out = data.get('check_out_date')
        room = data.get('room')

        if self.instance:
            check_in = check_in or self.instance.check_in_date
            check_out = check_out or self.instance.check_out_date
            room = room or self.instance.room

        # 1. Date Order Check
        if check_in and check_out:
            if check_out <= check_in:
                raise serializers.ValidationError("Check-out must be after check-in.")

            # 2. Overlap Check (Only if Room is assigned)
            if room:
                overlap = Booking.objects.filter(
                    room=room,
                    status__in=['CONFIRMED', 'CHECKED_IN']
                ).exclude(pk=self.instance.pk if self.instance else None).filter(
                    check_in_date__lt=check_out,
                    check_out_date__gt=check_in
                )

                if overlap.exists():
                    raise serializers.ValidationError(
                        f"Room {room.room_number} is already occupied for these dates."
                    )
        
        return data

# ============================
# 5. ACCOUNTING & EXPENSE SERIALIZERS
# ============================

class ExpenseSerializer(serializers.ModelSerializer):
    """
    Handles tracking of money flowing out of the business.
    Includes the username of the staff who logged the expense.
    """
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    paid_by_username = serializers.ReadOnlyField(source='paid_by.username')
    # 👇 NEW: Helps Super Admin see which hotel spent this money
    hotel_name = serializers.CharField(source='owner.hotel_profile.hotel_name', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'owner', 'hotel_name', 'title', 'category', 'amount', 
            'date', 'description', 'paid_by', 
            'paid_by_username', 'created_at'
        ]
        read_only_fields = ['paid_by', 'created_at']

# ============================
# 6. WHITE-LABEL SETTINGS SERIALIZER
# ============================

class PropertySettingSerializer(serializers.ModelSerializer):
    """
    Handles global property configuration like Hotel Name, GSTIN, and Tax Rates.
    """
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = PropertySetting
        fields = '__all__'