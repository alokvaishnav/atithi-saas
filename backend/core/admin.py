from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

# Ensure this import points to where your CustomUser model is actually defined
# If it's in the same app's models.py, this is correct.
# If it's in a 'core' app, change to: from core.models import CustomUser
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    
    # --- LIST DISPLAY (Columns in the table) ---
    list_display = (
        'username', 'email', 'full_name', 'role_display', 
        'get_hotel_owner', 'is_active', 'date_joined'
    )
    
    # --- FILTERS (Right Sidebar) ---
    list_filter = ('role', 'is_active', 'is_staff', 'date_joined')
    
    # --- SEARCH ---
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    # --- ORDERING ---
    ordering = ('-date_joined',) # Newest users first

    # --- PAGINATION ---
    list_per_page = 25

    # --- EDIT USER PAGE LAYOUT ---
    # This extends the default UserAdmin fieldsets to include our custom SaaS fields
    fieldsets = UserAdmin.fieldsets + (
        (_('SaaS Profile'), {
            'fields': ('role', 'hotel_owner'),
            'description': _('Fields specific to the Hotel Management System'),
        }),
    )
    
    # --- ADD USER PAGE LAYOUT ---
    # This extends the default UserAdmin add_fieldsets
    add_fieldsets = UserAdmin.add_fieldsets + (
        (_('SaaS Profile'), {
            'fields': ('email', 'role', 'hotel_owner'),
        }),
    )

    # --- READ ONLY FIELDS ---
    # Prevent admins from faking login times or join dates
    readonly_fields = ('last_login', 'date_joined')

    # --- CUSTOM DISPLAY METHODS ---

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    full_name.short_description = "Name"

    def get_hotel_owner(self, obj):
        """
        Shows who this user reports to.
        If they are an Owner, it shows 'Self (Owner)'.
        """
        if obj.role == 'OWNER':
            return "Self (Owner)"
        # Check if hotel_owner exists before accessing username to prevent errors
        return obj.hotel_owner.username if obj.hotel_owner else "-"
    get_hotel_owner.short_description = "Reports To"

    def role_display(self, obj):
        """
        Color-coded badges for roles.
        """
        # Defines the background color for each role badge
        colors = {
            'ADMIN': '#B71C1C',        # Dark Red (Superuser)
            'OWNER': '#2E7D32',        # Green (Tenant)
            'MANAGER': '#EF6C00',      # Orange
            'RECEPTIONIST': '#1565C0', # Blue
            'HOUSEKEEPING': '#6A1B9A', # Purple
            'ACCOUNTANT': '#00695C',   # Teal
            'STAFF': '#424242',        # Dark Grey
        }
        
        # Default to light grey if role is missing or unknown
        role_value = obj.role if obj.role else "UNKNOWN"
        color = colors.get(role_value, '#9E9E9E') 
        
        return format_html(
            '<span style="color: white; background-color: {}; padding: 4px 10px; border-radius: 15px; font-weight: bold; font-size: 11px;">{}</span>',
            color,
            role_value
        )
    role_display.short_description = "Role"

# Register the model with the updated Admin class
admin.site.register(CustomUser, CustomUserAdmin)