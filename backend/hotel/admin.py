from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

# 1. Import CustomUser correctly
try:
    from core.models import CustomUser
except ImportError:
    from django.contrib.auth import get_user_model
    CustomUser = get_user_model()

# Import the rest of the models
from .models import (
    HotelSettings, Room, Guest, Booking, 
    BookingPayment, BookingCharge,
    InventoryItem, MenuItem, Order, Expense, 
    HousekeepingTask, ActivityLog, PlatformSettings, GlobalAnnouncement,
    SubscriptionPlan
)

# 2. GLOBAL BRANDING
admin.site.site_header = "Atithi SaaS Command Center"
admin.site.site_title = "Atithi Admin Portal"
admin.site.index_title = "Global Infrastructure Management"

# --- INLINES ---

class BookingPaymentInline(admin.TabularInline):
    model = BookingPayment
    extra = 0
    readonly_fields = ('date',)
    can_delete = True

class BookingChargeInline(admin.TabularInline):
    model = BookingCharge
    extra = 0
    readonly_fields = ('date',)

class OrderInline(admin.TabularInline):
    model = Order
    extra = 0
    readonly_fields = ('created_at',)

# --- CUSTOM USER ADMIN ---

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_superuser')
    search_fields = ('username', 'email', 'first_name')
    ordering = ('-date_joined',)
    fieldsets = UserAdmin.fieldsets + (
        ('SaaS Role', {'fields': ('role', 'hotel_owner')}),
    )

# --- CORE ADMIN CONFIGURATIONS ---

class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'guest_name', 'room', 'check_in_date', 'check_out_date', 'status', 'payment_status', 'total_amount', 'source')
    list_filter = ('status', 'payment_status', 'source', 'check_in_date')
    search_fields = ('guest__full_name', 'guest__email', 'id', 'room__room_number', 'guest__phone')
    readonly_fields = ('created_at', 'total_amount')
    ordering = ('-created_at',)
    date_hierarchy = 'check_in_date'
    inlines = [BookingChargeInline, BookingPaymentInline, OrderInline]

    def guest_name(self, obj):
        return obj.guest.full_name if obj.guest else "Unknown"
    guest_name.short_description = "Guest"

class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'status', 'price_per_night', 'floor', 'owner')
    list_filter = ('status', 'room_type', 'owner', 'floor')
    search_fields = ('room_number',)
    ordering = ('room_number',)

class GuestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'is_vip', 'type', 'owner')
    list_filter = ('is_vip', 'type', 'owner')
    search_fields = ('full_name', 'phone', 'email')
    readonly_fields = ('created_at', 'updated_at')

class HotelSettingsAdmin(admin.ModelAdmin):
    list_display = ('hotel_name', 'owner', 'phone', 'email', 'city_display')
    search_fields = ('hotel_name', 'owner__username', 'email')
    list_filter = ('enable_whatsapp_alerts',)
    readonly_fields = ('license_expiry',)
    
    def city_display(self, obj):
        if obj.address and ',' in obj.address:
            return obj.address.split(',')[-1].strip()
        return '-'
    city_display.short_description = "City"

# --- OPERATIONS ADMIN ---

class InventoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'current_stock', 'min_stock_alert', 'unit', 'owner')
    list_filter = ('category', 'owner')
    search_fields = ('name',)
    readonly_fields = ('last_updated',)

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    readonly_fields = ('created_at',)

class HousekeepingAdmin(admin.ModelAdmin):
    list_display = ('room', 'task_type', 'status', 'priority', 'assigned_to', 'created_at')
    list_filter = ('status', 'priority', 'task_type')
    readonly_fields = ('created_at', 'completed_at')

class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'owner', 'timestamp', 'short_description')
    list_filter = ('action', 'timestamp')
    search_fields = ('owner__username', 'details')
    readonly_fields = ('timestamp', 'owner', 'action', 'details')
    date_hierarchy = 'timestamp'

    def short_description(self, obj):
        if obj.details:
            return obj.details[:50] + "..." if len(obj.details) > 50 else obj.details
        return "-"
    short_description.short_description = "Details"

# --- PLATFORM ADMIN ---

class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'interval', 'max_rooms', 'is_active')
    list_filter = ('interval', 'is_active')
    search_fields = ('name',)
    list_editable = ('price', 'is_active', 'max_rooms')
    ordering = ('price',)

class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ('app_name', 'company_name', 'support_email', 'maintenance_mode')
    fieldsets = (
        ('Branding & Identity', {
            'fields': ('app_name', 'company_name', 'logo', 'maintenance_mode')
        }),
        ('Contact Info', {
            'fields': ('support_email', 'support_phone', 'address')
        }),
        ('System SMTP', {
            'fields': ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password'),
        }),
        ('Welcome Email Automation', {
            'fields': ('welcome_email_subject', 'welcome_email_body'),
        }),
        ('System WhatsApp', {
            'fields': ('whatsapp_phone_id', 'whatsapp_token', 'whatsapp_enabled', 'welcome_whatsapp_msg')
        }),
    )
    def has_add_permission(self, request):
        return not PlatformSettings.objects.exists()

class GlobalAnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'message')
    ordering = ('-created_at',)

# --- 6. REGISTER MODELS (SAFE VERSION) ---

# 🟢 FIX: Force Unregister first to prevent "AlreadyRegistered" crash
try:
    admin.site.unregister(CustomUser)
except admin.sites.NotRegistered:
    pass
admin.site.register(CustomUser, CustomUserAdmin)

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
admin.site.register(GlobalAnnouncement, GlobalAnnouncementAdmin)
admin.site.register(SubscriptionPlan, SubscriptionPlanAdmin)