from django.contrib import admin
from .models import Room, Guest, Booking

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'price_per_night', 'status')
    list_filter = ('status', 'room_type')
    search_fields = ('room_number',)
    ordering = ('room_number',)

@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'id_proof_number')
    search_fields = ('full_name', 'phone', 'email')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'guest', 'room', 'check_in_date', 'status', 'total_amount')
    list_filter = ('status', 'check_in_date')
    search_fields = ('guest__full_name', 'room__room_number')
    
    # This automatically records WHO created the booking
    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)