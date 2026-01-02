from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'Manager'),
        ('STAFF', 'Staff'),
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='OWNER')
    hotel_owner = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='staff_members')

    def __str__(self):
        return f'{self.username}'
