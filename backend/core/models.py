from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'Manager'),
        ('RECEPTIONIST', 'Receptionist'),
        ('HOUSEKEEPING', 'Housekeeping'),
        ('ACCOUNTANT', 'Accountant'),
    )
    role = models.CharField(max_length=20, choices=ROLES, default='RECEPTIONIST')
    
    # Critical for SaaS: Every staff member belongs to a Hotel Owner
    hotel_owner = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='staff_members')
    
    def __str__(self):
        return f"{self.username} ({self.role})"