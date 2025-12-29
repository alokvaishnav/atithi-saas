from django.db import models
from django.conf import settings # 👈 Use this to refer to User model safely

class Room(models.Model):
    ROOM_TYPES = (('SINGLE', 'Single'), ('DOUBLE', 'Double'), ('SUITE', 'Suite'))
    STATUS_CHOICES = (('AVAILABLE', 'Available'), ('OCCUPIED', 'Occupied'), ('DIRTY', 'Dirty'))

    # Link every room to a specific Hotel Owner (SaaS Isolation)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rooms')
    
    room_number = models.CharField(max_length=10)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='SINGLE')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')

    def __str__(self):
        return f"{self.room_number} ({self.get_status_display()})"

class Guest(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='guests')
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    id_proof = models.FileField(upload_to='ids/', blank=True, null=True)

    def __str__(self):
        return self.full_name

class Booking(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    
    check_in_date = models.DateTimeField()
    check_out_date = models.DateTimeField(blank=True, null=True)
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_checked_out = models.BooleanField(default=False)

    def __str__(self):
        return f"Booking: {self.guest.full_name} - Room {self.room.room_number}"