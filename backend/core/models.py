from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class CustomUser(AbstractUser):
    """
    Custom User model supporting SaaS Tenant hierarchy.
    - ADMIN: The SaaS Superuser (You/Platform Owner).
    - OWNER: The Hotel Owner (Tenant).
    - MANAGER/STAFF/etc: Employees linked to an Owner.
    """
    ROLE_CHOICES = (
        ('ADMIN', 'SaaS Admin'),       # Superuser / Platform Owner
        ('OWNER', 'Hotel Owner'),      # Tenant (Pays for subscription)
        ('MANAGER', 'Manager'),        # Staff with high privileges
        ('RECEPTIONIST', 'Receptionist'),
        ('HOUSEKEEPING', 'Housekeeping'),
        ('ACCOUNTANT', 'Accountant'),
        ('STAFF', 'Generic Staff'),    # Fallback
    )
    
    # Enforce unique email for robust account management (Critical for SaaS)
    # This overrides the default Django behavior where email is optional.
    email = models.EmailField(_('email address'), unique=True, blank=False, null=False)
    
    # Critical for OTPs and rapid communication in hotels
    phone_number = models.CharField(max_length=15, blank=True, null=True, unique=True)
    
    # User Avatar / Profile Picture
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='OWNER')
    
    # 🟢 NEW: The Unique Key that binds this user to a specific Hotel
    # This enables the "Triple Auth" (Hotel ID + Username + Password)
    hotel_code = models.CharField(
        max_length=10, 
        blank=True, 
        null=True, 
        help_text="Unique 6-digit ID of the Hotel this user belongs to"
    )
    
    # Link staff accounts to the main Hotel Owner account (Multi-tenancy Link)
    # - If user is 'OWNER': this is typically NULL (they are the top level).
    # - If user is 'STAFF': this points to the 'OWNER' who employs them.
    hotel_owner = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='staff_members'
    )

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def save(self, *args, **kwargs):
        """
        1. Normalize email to lowercase.
        2. Ensure Superusers always have the ADMIN role.
        """
        if self.email:
            self.email = self.email.lower()
            
        # Ensure SaaS Admin always has the correct role
        if self.is_superuser:
            self.role = 'ADMIN'
            
        super().save(*args, **kwargs)

    @property
    def is_hotel_owner(self):
        """Helper to quickly check if user is a tenant owner."""
        return self.role == 'OWNER'

    @property
    def is_hotel_staff(self):
        """Helper to check if user is any type of staff member."""
        return self.role in ['MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT', 'STAFF']

    def __str__(self):
        # Returns: "john_doe (MANAGER) - HTL-8842"
        hotel_id_str = f" - {self.hotel_code}" if self.hotel_code else ""
        return f'{self.username} ({self.role}){hotel_id_str}'