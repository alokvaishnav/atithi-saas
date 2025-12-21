from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

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