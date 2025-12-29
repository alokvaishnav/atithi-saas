from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SaaSConfig

# Branding
admin.site.site_header = "Atithi SaaS Admin"
admin.site.site_title = "Atithi Portal"
admin.site.index_title = "Welcome to Master Control"

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Add our custom fields to the list view
    list_display = ('username', 'email', 'role', 'is_staff', 'hotel_owner')
    list_filter = ('role', 'is_staff', 'is_active')
    
    # Add our custom fields to the edit form
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Atithi Role Info', {'fields': ('role', 'phone', 'hotel_owner')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Atithi Role Info', {'fields': ('role', 'phone', 'email')}),
    )

@admin.register(SaaSConfig)
class SaaSConfigAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'support_email')