from django.db import models
from django.conf import settings # To link to our Custom User

# ==========================================
# 1. ROOM MANAGEMENT (Updated for Housekeeping)
# ==========================================
class Room(models.Model):
    ROOM_TYPES = (('SINGLE', 'Single'), ('DOUBLE', 'Double'), ('SUITE', 'Suite'))
    
    # 👇 These statuses drive the Housekeeping Module
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
    id_proof_number = models.CharField(max_length=50, blank=True) # Aadhar/Passport
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name

# ==========================================
# 3. BOOKINGS & BILLING
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
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    
    # Financials
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Audit Trail
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking {self.id} - {self.guest.full_name}"

# ==========================================
# 4. NEW: POS & SERVICES (For Phase 2)
# ==========================================
class Service(models.Model):
    """
    Menu items or Services (e.g., 'Coca Cola', 'Laundry', 'Taxi')
    """
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
    is_active = models.BooleanField(default=True) # If false, don't show in menu

    def __str__(self):
        return f"{self.name} - ₹{self.price}"

class BookingCharge(models.Model):
    """
    Individual items added to a booking (e.g., Guest ordered 2 Coffees)
    """
    booking = models.ForeignKey(Booking, related_name='charges', on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    description = models.CharField(max_length=200, blank=True) # Optional note
    quantity = models.PositiveIntegerField(default=1)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    added_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-calculate cost if service exists
        if self.service:
            self.total_cost = self.service.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.service.name} for Booking #{self.booking.id}"