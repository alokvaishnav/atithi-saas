from django.contrib import admin
from .models import (
    HotelSettings, Room, Guest, Booking, 
    BookingPayment, BookingCharge,
    InventoryItem, MenuItem, Order, Expense, 
    HousekeepingTask, ActivityLog, PlatformSettings
)

# --- 1. CORE ADMIN CONFIGURATIONS ---

class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'guest_name', 'room', 'check_in_date', 'check_out_date', 'status', 'payment_status', 'total_amount', 'source')
    list_filter = ('status', 'payment_status', 'check_in_date', 'source', 'created_at')
    search_fields = ('guest__full_name', 'guest__email', 'id', 'room__room_number')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

    def guest_name(self, obj):
        return obj.guest.full_name
    guest_name.short_description = "Guest"

class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'status', 'price_per_night', 'floor', 'owner')
    list_filter = ('status', 'room_type', 'owner')
    search_fields = ('room_number',)
    ordering = ('room_number',)

class GuestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'is_vip', 'owner')
    list_filter = ('is_vip', 'type', 'owner')
    search_fields = ('full_name', 'phone', 'email')

class HotelSettingsAdmin(admin.ModelAdmin):
    list_display = ('hotel_name', 'owner', 'phone', 'email', 'city_display')
    search_fields = ('hotel_name', 'owner__username', 'email')
    
    def city_display(self, obj):
        # Safe extraction of city from address if possible
        return obj.address.split(',')[-1].strip() if obj.address else '-'
    city_display.short_description = "City"

# --- 2. OPERATIONS ADMIN CONFIGURATIONS ---

class InventoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'current_stock', 'min_stock_alert', 'owner')
    list_filter = ('category', 'owner')
    search_fields = ('name',)

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')

class HousekeepingAdmin(admin.ModelAdmin):
    list_display = ('room', 'task_type', 'status', 'priority', 'assigned_to', 'created_at')
    list_filter = ('status', 'priority', 'task_type')

class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'owner', 'timestamp', 'short_details')
    list_filter = ('action', 'timestamp')
    readonly_fields = ('timestamp',)

    def short_details(self, obj):
        return obj.details[:50] + "..." if len(obj.details) > 50 else obj.details
    short_details.short_description = "Details"

# --- 3. PLATFORM ADMIN (SUPER ADMIN) ---

class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ('app_name', 'company_name', 'support_email', 'smtp_host')
    
    # Organized layout for better UX in Admin Panel
    fieldsets = (
        ('Branding & Identity', {
            'fields': ('app_name', 'company_name', 'logo')
        }),
        ('Support Contact Info', {
            'fields': ('support_email', 'support_phone', 'address')
        }),
        ('System SMTP (Global Fallback)', {
            'fields': ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password')
        }),
        ('Welcome Email Automation (Editable)', {
            'fields': ('welcome_email_subject', 'welcome_email_body'),
            'description': "Use placeholders: {name}, {username}, {password}, {app_name}, {company_name}"
        }),
        ('System WhatsApp', {
            'fields': ('whatsapp_phone_id', 'whatsapp_token')
        }),
    )

    # Helper to enforce Singleton pattern in Admin (prevent adding more than 1 row)
    def has_add_permission(self, request):
        return not PlatformSettings.objects.exists()

# --- 4. REGISTER MODELS ---

admin.site.register(HotelSettings, HotelSettingsAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(Guest, GuestAdmin)
admin.site.register(Booking, BookingAdmin)
admin.site.register(BookingPayment)
admin.site.register(BookingCharge)
admin.site.register(InventoryItem, InventoryAdmin)
admin.site.register(MenuItem)
admin.site.register(Order, OrderAdmin)
admin.site.register(Expense)
admin.site.register(HousekeepingTask, HousekeepingAdmin)
admin.site.register(ActivityLog, ActivityLogAdmin)
admin.site.register(PlatformSettings, PlatformSettingsAdmin)