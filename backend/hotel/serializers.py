from rest_framework import serializers
from .models import (
    Room, Guest, Booking, Service, BookingCharge, Expense, PropertySetting,
    InventoryItem, HousekeepingTask # 👈 Added New Models
)

# ============================
# 1. CORE OPERATIONAL SERIALIZERS
# ============================

class RoomSerializer(serializers.ModelSerializer):
    """
    Handles Room inventory data including status and pricing.
    """
    class Meta:
        model = Room
        fields = '__all__'

class GuestSerializer(serializers.ModelSerializer):
    """
    Complete Guest Profile including GRC identity fields 
    required for legal compliance.
    """
    class Meta:
        model = Guest
        fields = [
            'id', 'full_name', 'email', 'phone', 
            'id_type', 'id_proof_number', 'address', 
            'nationality', 'created_at'
        ]

# ============================
# 2. INVENTORY & SERVICES (NEW)
# ============================

class InventoryItemSerializer(serializers.ModelSerializer):
    """
    Handles stock tracking for items like 'Water Bottles', 'Toiletries', etc.
    """
    class Meta:
        model = InventoryItem
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    """
    Standard Hotel Menu Items. Now includes 'linked_inventory_item' 
    to automatically deduct stock when sold.
    """
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
# 3. HOUSEKEEPING (NEW)
# ============================

class HousekeepingTaskSerializer(serializers.ModelSerializer):
    """
    Manages cleaning tasks. Includes read-only fields to make
    displaying data on the dashboard easier.
    """
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = HousekeepingTask
        fields = [
            'id', 'room', 'room_number', 'assigned_to', 'assigned_to_name',
            'status', 'notes', 'created_at', 'updated_at'
        ]

# ============================
# 4. BOOKING SERIALIZER (Final Enterprise Version)
# ============================

class BookingSerializer(serializers.ModelSerializer):
    """
    The main engine for the HMS. Includes nested Room/Guest data, 
    all POS charges, and logic for GRC printing and Advance payments.
    """
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
            'id', 
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
        """
        if data.get('check_in_date') and data.get('check_out_date'):
            if data['check_out_date'] <= data['check_in_date']:
                raise serializers.ValidationError("Check-out must be after check-in.")
        return data

# ============================
# 5. ACCOUNTING & EXPENSE SERIALIZERS
# ============================

class ExpenseSerializer(serializers.ModelSerializer):
    """
    Handles tracking of money flowing out of the business.
    Includes the username of the staff who logged the expense.
    """
    paid_by_username = serializers.ReadOnlyField(source='paid_by.username')

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'category', 'amount', 
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
    class Meta:
        model = PropertySetting
        fields = '__all__'