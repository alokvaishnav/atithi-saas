from django.contrib import admin
from .models import (
    HotelSettings, Room, Guest, Service, 
    InventoryItem, Expense, Booking, 
    BookingCharge, BookingPayment, HousekeepingTask
)

@admin.register(HotelSettings)
class HotelSettingsAdmin(admin.ModelAdmin):
    list_display = ('hotel_name', 'owner', 'phone')

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'status', 'owner')
    list_filter = ('status', 'room_type')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('guest', 'room', 'check_in_date', 'status', 'payment_status', 'total_amount')
    list_filter = ('status', 'payment_status')

@admin.register(InventoryItem)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'current_stock', 'min_stock_alert')
    list_filter = ('category',)

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'category', 'date')
    list_filter = ('category', 'date')

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price')

@admin.register(HousekeepingTask)
class HousekeepingAdmin(admin.ModelAdmin):
    list_display = ('room', 'assigned_to', 'status', 'priority')

# Register simple models
admin.site.register(Guest)
admin.site.register(BookingCharge)
admin.site.register(BookingPayment)