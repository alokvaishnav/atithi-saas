from django.contrib import admin
from .models import Room, Guest, Booking

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'status', 'room_type', 'price', 'owner')
    list_filter = ('status', 'room_type', 'owner')
    search_fields = ('room_number',)

@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'owner')
    search_fields = ('full_name', 'phone')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('guest', 'room', 'check_in_date', 'total_amount', 'is_checked_out')
    list_filter = ('is_checked_out', 'check_in_date')
    autocomplete_fields = ['guest', 'room']