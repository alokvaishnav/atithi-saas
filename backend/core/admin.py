from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'hotel_owner', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('SaaS Fields', {'fields': ('role', 'hotel_owner')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('SaaS Fields', {'fields': ('role', 'hotel_owner')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
