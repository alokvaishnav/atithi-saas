from django.contrib import admin
from .models import (
    HotelSettings, Room, Guest, Service, 
    InventoryItem, Expense, Booking, 
    BookingCharge, BookingPayment, HousekeepingTask
)

# --- INLINES (Show Charges & Payments inside Booking Page) ---

class BookingChargeInline(admin.TabularInline):
    model = BookingCharge
    extra = 0
    readonly_fields = ['date']
    can_delete = True

class BookingPaymentInline(admin.TabularInline):
    model = BookingPayment
    extra = 0
    readonly_fields = ['date']
    can_delete = True

# --- MAIN ADMIN CLASSES ---

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    # Shows critical info in the list view
    list_display = ('id', 'guest', 'room', 'check_in_date', 'check_out_date', 'status', 'payment_status', 'total_amount', 'amount_paid')
    
    # Adds filters to the right sidebar
    list_filter = ('status', 'payment_status', 'check_in_date')
    
    # Adds a search bar at the top
    search_fields = ('guest__full_name', 'room__room_number', 'id')
    
    # Adds the "Charges" and "Payments" tables inside the Booking page
    inlines = [BookingChargeInline, BookingPaymentInline]
    
    # Prevents manual editing of calculated totals (Safety Feature)
    readonly_fields = ('total_amount', 'amount_paid', 'created_at')

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'price_per_night', 'status', 'owner')
    list_filter = ('status', 'room_type')
    search_fields = ('room_number',)

@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'created_at')
    search_fields = ('full_name', 'phone', 'email')

@admin.register(InventoryItem)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'current_stock', 'min_stock_alert')
    list_filter = ('category',)
    search_fields = ('name',)

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'date')
    list_filter = ('category', 'date')
    search_fields = ('title',)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name',)

@admin.register(HousekeepingTask)
class HousekeepingAdmin(admin.ModelAdmin):
    list_display = ('room', 'assigned_to', 'priority', 'status', 'created_at')
    list_filter = ('status', 'priority')

@admin.register(HotelSettings)
class HotelSettingsAdmin(admin.ModelAdmin):
    list_display = ('hotel_name', 'owner', 'phone')

# Register simple models if they don't have custom admin classes above
# (Though they are now covered by Inlines, keeping them registered separately is fine for debugging)
admin.site.register(BookingCharge)
admin.site.register(BookingPayment)