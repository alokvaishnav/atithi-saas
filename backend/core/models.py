from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # We define strict roles for the system
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'General Manager'),
        ('RECEPTIONIST', 'Receptionist'),
        ('HOUSEKEEPING', 'Housekeeping Staff'),
        ('ACCOUNTANT', 'Accountant'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='RECEPTIONIST')
    phone = models.CharField(max_length=15, blank=True, null=True)
    
    # This forces Django to treat 'role' as a crucial part of the user
    REQUIRED_FIELDS = ['email', 'role']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"