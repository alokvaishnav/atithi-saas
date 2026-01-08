from django.contrib import admin
from .models import (
    HotelSettings, Room, Guest, Booking, 
    BookingPayment, BookingCharge,
    InventoryItem, MenuItem, Order, Expense, 
    HousekeepingTask, ActivityLog, PlatformSettings, GlobalAnnouncement,
    SubscriptionPlan
)

# --- INLINES (Display Related Data Inside Parents) ---

class BookingPaymentInline(admin.TabularInline):
    model = BookingPayment
    extra = 0 # Don't show empty extra rows by default
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

# --- 1. CORE ADMIN CONFIGURATIONS ---

class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'guest_name', 'room', 'check_in_date', 'check_out_date', 'status', 'payment_status', 'total_amount', 'source')
    list_filter = ('status', 'payment_status', 'source', 'check_in_date')
    search_fields = ('guest__full_name', 'guest__email', 'id', 'room__room_number', 'guest__phone')
    readonly_fields = ('created_at', 'total_amount') # Protect audit fields
    ordering = ('-created_at',)
    
    # NEW: Date Drill-down navigation
    date_hierarchy = 'check_in_date'
    
    # NEW: Show payments and charges directly inside the Booking page
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
    readonly_fields = ('license_expiry',) # Admins shouldn't manually edit this easily
    
    def city_display(self, obj):
        # Safe extraction of city from address if possible
        if obj.address and ',' in obj.address:
            return obj.address.split(',')[-1].strip()
        return '-'
    city_display.short_description = "City"

# --- 2. OPERATIONS ADMIN CONFIGURATIONS ---

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
    search_fields = ('owner__username', 'description')
    readonly_fields = ('timestamp', 'owner', 'action', 'description') # Logs should be read-only
    date_hierarchy = 'timestamp'

    def short_description(self, obj):
        if obj.description:
            return obj.description[:50] + "..." if len(obj.description) > 50 else obj.description
        return "-"
    short_description.short_description = "description"

# --- 3. PLATFORM ADMIN (SUPER ADMIN) ---

class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'interval', 'max_rooms', 'is_active')
    list_filter = ('interval', 'is_active')
    search_fields = ('name',)
    list_editable = ('price', 'is_active', 'max_rooms')
    ordering = ('price',)

class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ('app_name', 'company_name', 'support_email', 'maintenance_mode')
    
    # Organized layout for better UX in Admin Panel
    fieldsets = (
        ('Branding & Identity', {
            'fields': ('app_name', 'company_name', 'logo', 'maintenance_mode')
        }),
        ('Contact Info (Visible to Tenants)', {
            'fields': ('support_email', 'support_phone', 'address')
        }),
        ('System SMTP (Global Fallback)', {
            'fields': ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password'),
            'description': 'Used for password resets and system notifications.'
        }),
        ('Welcome Email Automation (Editable)', {
            'fields': ('welcome_email_subject', 'welcome_email_body'),
            'description': "Use placeholders: {name}, {username}, {password}, {app_name}, {company_name}"
        }),
        ('System WhatsApp', {
            'fields': ('whatsapp_phone_id', 'whatsapp_token', 'whatsapp_enabled', 'welcome_whatsapp_msg')
        }),
    )

    # Helper to enforce Singleton pattern in Admin (prevent adding more than 1 row)
    def has_add_permission(self, request):
        return not PlatformSettings.objects.exists()

class GlobalAnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'message')
    ordering = ('-created_at',)

# --- 4. REGISTER MODELS ---

admin.site.register(HotelSettings, HotelSettingsAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(Guest, GuestAdmin)
admin.site.register(Booking, BookingAdmin)
# Payments and Charges are now inlines of Booking, but we can still register them 
# if we want to view them independently.
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