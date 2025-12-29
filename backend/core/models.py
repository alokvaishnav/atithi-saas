from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User Model for Atithi SaaS.
    Supports Multi-Tenancy by linking staff to an Owner.
    """
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'General Manager'),
        ('RECEPTIONIST', 'Receptionist'),
        ('HOUSEKEEPING', 'Housekeeping Staff'),
        ('ACCOUNTANT', 'Accountant'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='OWNER')
    phone = models.CharField(max_length=15, blank=True, null=True)
    
    # 🔗 HIERARCHY: If this user is staff, who is their boss?
    # Using 'self' prevents circular imports.
    hotel_owner = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='staff_members'
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

class SaaSConfig(models.Model):
    """Global configurations for the software admin."""
    company_name = models.CharField(max_length=100, default="Atithi SaaS")
    support_email = models.EmailField(default="support@atithi.com")
    
    def __str__(self):
        return "Global Settings"