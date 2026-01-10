from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.db import models 
from django.forms import CheckboxSelectMultiple

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
    SubscriptionPlan, RoomImage, PlanFeature
)

# 2. GLOBAL BRANDING (Jazzmin will override visually, but these remain as fallbacks)
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

class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1

# --- CUSTOM USER ADMIN ---

class CustomUserAdmin(UserAdmin):
    # 🟢 UPDATED: Added 'hotel_code' to list display
    list_display = ('username', 'email', 'role', 'hotel_owner_name', 'hotel_code', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'hotel_code')
    ordering = ('-date_joined',)
    list_per_page = 25
    
    # 🟢 UPDATED: Added 'hotel_code' to fieldsets
    fieldsets = UserAdmin.fieldsets + (
        ('SaaS Role', {'fields': ('role', 'hotel_owner', 'hotel_code')}),
    )
    readonly_fields = ('hotel_code',) # Keep ID read-only

    def hotel_owner_name(self, obj):
        return obj.hotel_owner.username if obj.hotel_owner else '-'
    hotel_owner_name.short_description = "Owner"

# --- CORE ADMIN CONFIGURATIONS ---

class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'guest_name', 'room_number', 'check_in_date', 'status', 'payment_status', 'total_amount', 'source')
    list_filter = ('status', 'payment_status', 'source', 'check_in_date')
    search_fields = ('guest__full_name', 'guest__email', 'id', 'room__room_number', 'guest__phone')
    readonly_fields = ('created_at', 'total_amount')
    ordering = ('-created_at',)
    date_hierarchy = 'check_in_date'
    inlines = [BookingChargeInline, BookingPaymentInline, OrderInline]
    list_per_page = 25
    save_on_top = True

    def guest_name(self, obj):
        return obj.guest.full_name if obj.guest else "Unknown"
    guest_name.short_description = "Guest"

    def room_number(self, obj):
        return obj.room.room_number if obj.room else "Unassigned"

class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'status', 'price_per_night', 'floor', 'owner')
    list_filter = ('status', 'room_type', 'owner', 'floor')
    search_fields = ('room_number', 'owner__username')
    list_editable = ('status', 'price_per_night') 
    ordering = ('room_number',)
    inlines = [RoomImageInline]
    list_per_page = 25

class GuestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'is_vip', 'type', 'owner')
    list_filter = ('is_vip', 'type', 'owner')
    search_fields = ('full_name', 'phone', 'email', 'public_guest_id')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 25

class HotelSettingsAdmin(admin.ModelAdmin):
    # 🟢 UPDATED: Added 'hotel_code' to list display and search
    list_display = ('hotel_name', 'hotel_code', 'owner', 'phone', 'email', 'license_expiry')
    search_fields = ('hotel_name', 'owner__username', 'email', 'hotel_code')
    list_filter = ('enable_whatsapp_alerts', 'auto_send_invoice')
    readonly_fields = ('license_expiry', 'hotel_code') # Keep ID read-only
    save_on_top = True
    
    # 🟢 UPDATED: Reorganized fieldsets to include Hotel ID
    fieldsets = (
        ('Identity', {
            'fields': ('hotel_code', 'owner', 'hotel_name', 'description', 'logo')
        }),
        ('Contact Info', {
            'fields': ('address', 'phone', 'email', 'website')
        }),
        ('Operations', {
            'fields': ('check_in_time', 'check_out_time', 'currency_symbol', 'tax_gst_number')
        }),
        ('Automation & Notifications', {
            'fields': ('auto_send_confirmation', 'auto_send_invoice', 'enable_whatsapp_alerts', 'enable_email_alerts')
        }),
        ('SMTP Configuration', {
            'fields': ('smtp_server', 'smtp_port', 'smtp_username', 'smtp_password'),
            'classes': ('collapse',), 
        }),
        ('WhatsApp API', {
            'fields': ('whatsapp_provider', 'whatsapp_phone_id', 'whatsapp_auth_token'),
            'classes': ('collapse',),
        }),
        ('Support Info', {
            'fields': ('support_phone', 'support_email')
        }),
    )

# --- OPERATIONS ADMIN ---

class InventoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'current_stock', 'min_stock_alert', 'unit', 'owner')
    list_filter = ('category', 'owner')
    search_fields = ('name',)
    list_editable = ('current_stock',)
    readonly_fields = ('last_updated',)
    list_per_page = 25

class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_available', 'owner')
    list_filter = ('category', 'is_available', 'owner')
    search_fields = ('name',)
    list_editable = ('price', 'is_available')
    list_per_page = 25

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    readonly_fields = ('created_at',)
    list_per_page = 25

class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'date', 'owner')
    list_filter = ('category', 'date', 'owner')
    search_fields = ('title', 'description')
    date_hierarchy = 'date'
    list_per_page = 25

class HousekeepingAdmin(admin.ModelAdmin):
    list_display = ('room', 'task_type', 'status', 'priority', 'assigned_to', 'created_at')
    list_filter = ('status', 'priority', 'task_type')
    list_editable = ('status', 'assigned_to')
    readonly_fields = ('created_at', 'completed_at')
    list_per_page = 25

class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'action', 'owner_link', 'short_description')
    list_filter = ('action', 'timestamp')
    search_fields = ('owner__username', 'details')
    readonly_fields = ('timestamp', 'owner', 'action', 'details', 'category')
    date_hierarchy = 'timestamp'
    list_per_page = 50

    def owner_link(self, obj):
        return obj.owner.username
    owner_link.short_description = "User"

    def short_description(self, obj):
        return obj.details[:60] + "..." if len(obj.details) > 60 else obj.details
    short_description.short_description = "Details"

    # Make Logs Read-Only for Security (Audit Trail Integrity)
    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

# --- PLATFORM ADMIN ---

class PlanFeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'key')
    search_fields = ('name', 'key')

class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'interval', 'is_trial', 'trial_days', 'is_active')
    list_filter = ('interval', 'is_active', 'is_trial')
    search_fields = ('name',)
    list_editable = ('price', 'is_active', 'is_trial') # Quick toggle for Trial
    ordering = ('price',)
    
    # Render ManyToMany fields (Features) as Checkboxes
    formfield_overrides = {
        models.ManyToManyField: {'widget': CheckboxSelectMultiple},
    }

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
            'fields': ('whatsapp_phone_id', 'whatsapp_token', 'welcome_whatsapp_msg')
        }),
    )
    
    def has_add_permission(self, request):
        # Prevent creating multiple config rows (Singleton pattern)
        if self.model.objects.exists():
            return False
        return super().has_add_permission(request)

class GlobalAnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'message')
    ordering = ('-created_at',)

# --- 6. REGISTER MODELS (SAFE VERSION) ---

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
admin.site.register(MenuItem, MenuItemAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(Expense, ExpenseAdmin)
admin.site.register(HousekeepingTask, HousekeepingAdmin)
admin.site.register(ActivityLog, ActivityLogAdmin)
admin.site.register(PlatformSettings, PlatformSettingsAdmin)
admin.site.register(GlobalAnnouncement, GlobalAnnouncementAdmin)
admin.site.register(SubscriptionPlan, SubscriptionPlanAdmin)
admin.site.register(PlanFeature, PlanFeatureAdmin)