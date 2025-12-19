from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone # 👈 Added for time-aware checks

# ==========================================
# 1. ROOM MANAGEMENT
# ==========================================
class Room(models.Model):
    ROOM_TYPES = (('SINGLE', 'Single'), ('DOUBLE', 'Double'), ('SUITE', 'Suite'))
    
    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'), 
        ('OCCUPIED', 'Occupied'), 
        ('DIRTY', 'Dirty'), 
        ('MAINTENANCE', 'Maintenance')
    )
    
    room_number = models.CharField(max_length=10, unique=True)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    
    def __str__(self):
        return f"{self.room_number} ({self.get_status_display()})"

# ==========================================
# 2. GUEST DATA
# ==========================================
class Guest(models.Model):
    full_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15)
    id_proof_number = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name

# ==========================================
# 3. BOOKINGS & BILLING (Updated for DateTime)
# ==========================================
class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CHECKED_IN', 'Checked In'),
        ('CHECKED_OUT', 'Checked Out'),
        ('CANCELLED', 'Cancelled')
    )

    guest = models.ForeignKey(Guest, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True)
    
    # 👇 UPGRADED: Changed from DateField to DateTimeField to support timing
    check_in_date = models.DateTimeField() 
    check_out_date = models.DateTimeField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # 👇 SMART VALIDATION: Prevents overlaps based on exact hours/minutes
    def clean(self):
        if self.check_in_date and self.check_out_date:
            # 1. Time sanity check
            if self.check_out_date <= self.check_in_date:
                raise ValidationError("Check-out time must be after check-in time.")

            # 2. Precise Overlap Check
            # Only blocks if the room is busy during the specific time window
            overlapping_bookings = Booking.objects.filter(
                room=self.room,
                status__in=['CONFIRMED', 'CHECKED_IN']
            ).exclude(pk=self.pk).filter(
                check_in_date__lt=self.check_out_date,
                check_out_date__gt=self.check_in_date
            )

            if overlapping_bookings.exists():
                raise ValidationError(
                    f"Room {self.room.room_number} is already reserved during this specific time window."
                )

    def save(self, *args, **kwargs):
        self.full_clean() # Triggers the clean() method
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.id} - {self.guest.full_name}"

# ==========================================
# 4. POS & SERVICES 
# ==========================================
class Service(models.Model):
    CATEGORY_CHOICES = (
        ('FOOD', 'Food & Beverage'),
        ('LAUNDRY', 'Laundry'),
        ('SPA', 'Spa & Wellness'),
        ('TRAVEL', 'Travel Desk'),
        ('OTHER', 'Other')
    )
    
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='FOOD')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - ₹{self.price}"

class BookingCharge(models.Model):
    booking = models.ForeignKey(Booking, related_name='charges', on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    description = models.CharField(max_length=200, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    added_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.service:
            self.total_cost = self.service.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.service.name} for Booking #{self.booking.id}"