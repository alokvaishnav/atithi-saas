from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    
    # Columns displayed in the user list
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'hotel_owner', 'is_staff', 'is_active']
    
    # Filters available in the right sidebar
    list_filter = ['role', 'is_staff', 'is_active', 'date_joined']
    
    # Search bar capability
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    # Ordering of the list
    ordering = ['email']

    # Layout for the "Edit User" page
    # This extends the default UserAdmin fieldsets to include our custom fields
    fieldsets = UserAdmin.fieldsets + (
        ('SaaS Profile', {'fields': ('role', 'hotel_owner')}),
    )
    
    # Layout for the "Add User" page
    # This extends the default UserAdmin add_fieldsets to include our custom fields
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('SaaS Profile', {'fields': ('email', 'role', 'hotel_owner')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)