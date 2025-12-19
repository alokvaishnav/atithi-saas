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
    
    # Ensures email and role are handled during user creation
    REQUIRED_FIELDS = ['email', 'role']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"