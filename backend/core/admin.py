from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SaaSConfig, Subscription, Payment, HotelSMTPSettings

# ==========================================
# 1. SOFTWARE COMPANY BRANDING
# ==========================================
admin.site.site_header = "Atithi SaaS Master Console"  # Top blue bar text
admin.site.site_title = "Atithi Admin"                 # Browser tab title
admin.site.index_title = "Software Company Dashboard"  # Main page title

# ==========================================
# 2. USER MANAGEMENT (The "Client" List)
# ==========================================
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Manage all system users. 
    Use this to create 'OWNER' accounts for new clients.
    """
    # Columns to show in the list
    # Added 'hotel_owner' to see hierarchy immediately
    list_display = ('username', 'email', 'role', 'hotel_owner', 'phone', 'is_active', 'date_joined')
    
    # Sidebar Filters
    list_filter = ('role', 'is_active', 'is_staff')
    
    # Search Bar
    search_fields = ('username', 'email', 'phone')
    
    # Organized Form Layout
    fieldsets = (
        ('Login Credentials', {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('email', 'phone')}),
        # Added hotel_owner here to link staff to owners manually if needed
        ('SaaS Permissions', {'fields': ('role', 'hotel_owner', 'is_active', 'is_staff', 'is_superuser')}),
        ('Audit Log', {'fields': ('last_login', 'date_joined')}),
    )

# ==========================================
# 3. GLOBAL CONFIGURATION
# ==========================================
@admin.register(SaaSConfig)
class SaaSConfigAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'support_email', 'software_version', 'last_updated')
    
    # Prevent creating multiple configs (Singleton pattern enforcement)
    def has_add_permission(self, request):
        if SaaSConfig.objects.exists():
            return False
        return True

# ==========================================
# 4. SUBSCRIPTION MANAGEMENT
# ==========================================
@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """
    Manage Client Licenses and Expiry Dates.
    """
    list_display = ('owner_username', 'plan_name', 'expiry_date', 'days_left', 'is_active')
    list_filter = ('plan_name', 'is_active')
    search_fields = ('owner__username', 'owner__email', 'license_key')
    readonly_fields = ('start_date',)
    
    # Helper to show the Owner's username clearly in the list
    def owner_username(self, obj):
        return obj.owner.username
    owner_username.short_description = 'Hotel Owner'

# ==========================================
# 5. PAYMENT HISTORY (New!)
# ==========================================
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    View Transaction Logs from Razorpay.
    """
    list_display = ('subscription', 'amount', 'status', 'razorpay_order_id', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('razorpay_order_id', 'subscription__owner__username')
    readonly_fields = ('created_at',)

# ==========================================
# 6. SMTP SETTINGS (New!)
# ==========================================
@admin.register(HotelSMTPSettings)
class HotelSMTPSettingsAdmin(admin.ModelAdmin):
    """
    Manage Hotel Email Configurations.
    """
    list_display = ('owner', 'email_host_user', 'email_host')
    search_fields = ('owner__username', 'email_host_user')