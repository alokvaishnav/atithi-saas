from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SaaSConfig, Subscription  # 👈 Added Subscription here

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
    list_display = ('username', 'email', 'role', 'phone', 'is_active', 'date_joined')
    
    # Sidebar Filters
    list_filter = ('role', 'is_active', 'is_staff')
    
    # Search Bar
    search_fields = ('username', 'email', 'phone')
    
    # Organized Form Layout
    fieldsets = (
        ('Login Credentials', {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('email', 'phone')}),
        ('SaaS Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
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
# 4. SUBSCRIPTION MANAGEMENT (New!)
# ==========================================
@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """
    Manage Client Licenses and Expiry Dates.
    """
    list_display = ('owner_username', 'plan_name', 'expiry_date', 'days_left', 'is_active')
    list_filter = ('plan_name', 'is_active')
    search_fields = ('owner__username', 'owner__email', 'license_key')
    
    # Helper to show the Owner's username clearly in the list
    def owner_username(self, obj):
        return obj.owner.username
    owner_username.short_description = 'Hotel Owner'