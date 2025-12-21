from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Professional Roles for Enterprise HMS
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'General Manager'),
        ('RECEPTIONIST', 'Receptionist'),
        ('HOUSEKEEPING', 'Housekeeping Staff'),
        ('ACCOUNTANT', 'Accountant'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='RECEPTIONIST')
    phone = models.CharField(max_length=15, blank=True, null=True)
    
    # 🔗 SAAS ISOLATION: Link Staff to their Hotel Owner
    # - If this user is an OWNER, this field is NULL.
    # - If this user is STAFF (Manager, Receptionist), this points to their BOSS (Owner).
    hotel_owner = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='employees',
        help_text="The Owner who manages this staff member."
    )

    # Ensures email and role are handled during user creation
    REQUIRED_FIELDS = ['email', 'role']

    def __str__(self):
        # Shows "Alice (Receptionist) - [Boss: Bob]" for easier debugging
        boss_name = f" [Boss: {self.hotel_owner.username}]" if self.hotel_owner else ""
        return f"{self.username} ({self.get_role_display()}){boss_name}"

class SaaSConfig(models.Model):
    """
    Global Configuration for the Software Company (YOU).
    Managed via Admin Panel. Displayed on the 'Support' page.
    """
    company_name = models.CharField(max_length=100, default="Atithi SaaS Corp")
    support_email = models.EmailField(default="support@atithi.com")
    support_phone = models.CharField(max_length=20, default="+91 99999 88888")
    website = models.URLField(blank=True, null=True)
    address = models.TextField(default="Tech Park, Bangalore, India")
    
    # Version Control
    software_version = models.CharField(max_length=10, default="v2.5")
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "SaaS Master Configuration"

    class Meta:
        verbose_name = "Software Company Settings"
        verbose_name_plural = "Software Company Settings"