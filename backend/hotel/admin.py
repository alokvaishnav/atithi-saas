from django.contrib import admin
from .models import (
    Room, Guest, Booking, Service, BookingCharge, 
    Expense, PropertySetting, InventoryItem, HousekeepingTask 
)

# ==========================================
# 1. HOTEL ONBOARDING (Critical for SaaS)
# ==========================================
@admin.register(PropertySetting)
class PropertySettingAdmin(admin.ModelAdmin):
    """
    Use this to link a Hotel Profile to a specific Owner (Client).
    """
    list_display = ('hotel_name', 'owner', 'gstin', 'contact_number', 'email')
    list_editable = ('owner',) # 👈 Allows you to assign owners directly from the list
    search_fields = ('hotel_name', 'owner__username', 'gstin')
    list_filter = ('room_tax_rate',)

# ==========================================
# 2. CORE OPERATIONS (With Owner Visibility)
# ==========================================
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'owner', 'room_type', 'price_per_night', 'status')
    list_filter = ('status', 'room_type', 'owner') # Filter by Hotel
    search_fields = ('room_number', 'owner__username')
    ordering = ('owner', 'room_number')

@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'owner', 'phone', 'email', 'nationality')
    search_fields = ('full_name', 'phone', 'email', 'owner__username')
    list_filter = ('nationality', 'owner')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'owner', 'get_guest_name', 'get_room_number', 'status', 'total_amount', 'get_payment_status')
    list_filter = ('status', 'check_in_date', 'owner') # Filter by Hotel
    search_fields = ('guest__full_name', 'room__room_number', 'id', 'owner__username')
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
        # If created by Admin via panel, try to auto-assign owner if missing
        if not obj.owner and hasattr(request.user, 'role') and request.user.role == 'OWNER':
             obj.owner = request.user
        super().save_model(request, obj, form, change)

# ==========================================
# 3. FINANCIALS & POS
# ==========================================
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'category', 'amount', 'date', 'paid_by')
    list_filter = ('category', 'date', 'owner')
    search_fields = ('title', 'description', 'owner__username')

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'category', 'price', 'is_active', 'linked_inventory_item')
    list_filter = ('category', 'is_active', 'owner')
    search_fields = ('name', 'owner__username')

@admin.register(BookingCharge)
class BookingChargeAdmin(admin.ModelAdmin):
    list_display = ('booking', 'service', 'quantity', 'total_cost', 'added_at')
    list_filter = ('added_at',)

# ==========================================
# 4. INVENTORY & HOUSEKEEPING (NEW 🚀)
# ==========================================
@admin.register(InventoryItem)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'current_stock', 'unit', 'min_stock_alert')
    search_fields = ('name', 'owner__username')
    list_filter = ('owner',)

@admin.register(HousekeepingTask)
class HousekeepingAdmin(admin.ModelAdmin):
    list_display = ('room', 'owner', 'status', 'assigned_to', 'updated_at')
    list_filter = ('status', 'owner')
    search_fields = ('room__room_number', 'owner__username', 'assigned_to__username')