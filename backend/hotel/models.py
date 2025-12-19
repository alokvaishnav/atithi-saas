from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal # 👈 Added for precise tax calculations

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
# 3. BOOKINGS & BILLING (Updated with Tax Fields)
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
    check_in_date = models.DateTimeField() 
    check_out_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    
    # Financials Updated for GST
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Base Price
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)      # GST Amount
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)    # Subtotal + Tax
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.check_in_date and self.check_out_date:
            if self.check_out_date <= self.check_in_date:
                raise ValidationError("Check-out time must be after check-in time.")

            overlapping_bookings = Booking.objects.filter(
                room=self.room,
                status__in=['CONFIRMED', 'CHECKED_IN']
            ).exclude(pk=self.pk).filter(
                check_in_date__lt=self.check_out_date,
                check_out_date__gt=self.check_in_date
            )

            if overlapping_bookings.exists():
                raise ValidationError(
                    f"Room {self.room.room_number} is already reserved for this time window."
                )

    def save(self, *args, **kwargs):
        # Auto-Calculate Room Billing with 12% GST
        if self.room and self.check_in_date and self.check_out_date:
            delta = self.check_out_date - self.check_in_date
            # Calculate nights (minimum 1)
            days = max(delta.days, 1)
            
            self.subtotal_amount = self.room.price_per_night * days
            self.tax_amount = self.subtotal_amount * Decimal('0.12') # 12% Room GST
            self.total_amount = self.subtotal_amount + self.tax_amount

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.id} - {self.guest.full_name}"

# ==========================================
# 4. POS & SERVICES (Updated with Tax Logic)
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
    price = models.DecimalField(max_digits=10, decimal_places=2) # Price excluding tax
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='FOOD')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - ₹{self.price}"

class BookingCharge(models.Model):
    booking = models.ForeignKey(Booking, related_name='charges', on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    description = models.CharField(max_length=200, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    
    # Financial Breakdown
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    added_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.service:
            self.subtotal = self.service.price * self.quantity
            # Logic: 5% Tax for F&B, 18% for others
            tax_rate = Decimal('0.05') if self.service.category == 'FOOD' else Decimal('0.18')
            self.tax_amount = self.subtotal * tax_rate
            self.total_cost = self.subtotal + self.tax_amount
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.service.name} for Booking #{self.booking.id}"