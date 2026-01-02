from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'Manager'),
        ('RECEPTIONIST', 'Receptionist'),
        ('HOUSEKEEPING', 'Housekeeping'),
        ('ACCOUNTANT', 'Accountant'),
    )
    
    # Enforce unique email for robust account management
    email = models.EmailField(unique=True)
    
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='OWNER')
    
    # Link staff accounts to the main Hotel Owner account
    # - If user is 'OWNER': this is typically NULL (they are the top level).
    # - If user is 'STAFF': this points to the 'OWNER' who employs them.
    hotel_owner = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='staff_members'
    )

    def __str__(self):
        return f'{self.username} ({self.role})'