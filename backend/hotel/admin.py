from django.contrib import admin
from .models import (
    Room, Guest, Booking, Service, BookingCharge, 
    Expense, PropertySetting
)

# ==========================================
# 1. HOTEL ONBOARDING (Critical)
# ==========================================
@admin.register(PropertySetting)
class PropertySettingAdmin(admin.ModelAdmin):
    """
    Use this to set up the Hotel Profile for a new client.
    """
    list_display = ('hotel_name', 'gstin', 'contact_number', 'email', 'room_tax_rate')
    search_fields = ('hotel_name', 'gstin')

# ==========================================
# 2. CORE OPERATIONS
# ==========================================
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'price_per_night', 'status')
    list_filter = ('status', 'room_type')
    search_fields = ('room_number',)
    ordering = ('room_number',)

@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'nationality', 'created_at')
    search_fields = ('full_name', 'phone', 'email', 'id_proof_number')
    list_filter = ('nationality',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_guest_name', 'get_room_number', 'status', 'total_amount', 'get_payment_status')
    list_filter = ('status', 'check_in_date', 'check_out_date')
    search_fields = ('guest__full_name', 'room__room_number', 'id')
    date_hierarchy = 'check_in_date'
    
    # Custom Columns
    def get_guest_name(self, obj):
        return obj.guest.full_name
    get_guest_name.short_description = 'Guest'

    def get_room_number(self, obj):
        return obj.room.room_number if obj.room else "No Room"
    get_room_number.short_description = 'Room'

    def get_payment_status(self, obj):
        if obj.amount_paid >= obj.total_amount and obj.total_amount > 0:
            return "✅ PAID"
        return f"⚠️ DUE: {obj.balance_due}"
    get_payment_status.short_description = 'Payment'

    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

# ==========================================
# 3. FINANCIALS & POS
# ==========================================
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'date', 'paid_by')
    list_filter = ('category', 'date')
    search_fields = ('title', 'description')

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name',)

@admin.register(BookingCharge)
class BookingChargeAdmin(admin.ModelAdmin):
    list_display = ('booking', 'service', 'quantity', 'total_cost', 'added_at')
    list_filter = ('added_at',)