from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from datetime import timedelta

# 1. Global Settings (Logo, Tax ID)
class HotelSettings(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hotel_settings')
    hotel_name = models.CharField(max_length=200, default="Atithi Hotel")
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    tax_gst_number = models.CharField(max_length=50, blank=True, null=True)
    
    def __str__(self):
        return self.hotel_name

# 2. Rooms
class Room(models.Model):
    ROOM_TYPES = (('SINGLE', 'Single'), ('DOUBLE', 'Double'), ('SUITE', 'Suite'), ('DELUXE', 'Deluxe'), ('DORM', 'Dormitory'))
    STATUS_CHOICES = (('AVAILABLE', 'Available'), ('OCCUPIED', 'Occupied'), ('DIRTY', 'Dirty'), ('MAINTENANCE', 'Maintenance'))

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=10)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='SINGLE')
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')

    def __str__(self):
        return f"{self.room_number} - {self.status}"

# 3. Guests
class Guest(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='guests')
    full_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15)
    address = models.TextField(blank=True, null=True)
    id_proof_number = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name

# 4. Services (POS Menu)
class Service(models.Model):
    CATEGORIES = (('FOOD', 'Food'), ('BEVERAGE', 'Beverage'), ('SERVICE', 'Service'), ('OTHER', 'Other'))
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='FOOD')

    def __str__(self):
        return self.name

# 5. Inventory (Stock)
class InventoryItem(models.Model):
    CATS = (('SUPPLIES', 'Supplies'), ('FOOD', 'Food Ingredient'), ('MAINTENANCE', 'Maintenance'))
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inventory')
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATS, default='SUPPLIES')
    current_stock = models.IntegerField(default=0)
    min_stock_alert = models.IntegerField(default=5)

    def __str__(self):
        return self.name

# 6. Expenses
class Expense(models.Model):
    CATS = (('UTILITIES', 'Utilities'), ('SALARY', 'Salary'), ('MAINTENANCE', 'Maintenance'), ('SUPPLIES', 'Supplies'), ('MARKETING', 'Marketing'))
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATS, default='UTILITIES')
    date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.title} - {self.amount}"

# 7. Bookings
class Booking(models.Model):
    STATUS = (('CONFIRMED', 'Confirmed'), ('CHECKED_IN', 'Checked In'), ('CHECKED_OUT', 'Checked Out'), ('CANCELLED', 'Cancelled'))
    PAY_STATUS = (('PENDING', 'Pending'), ('PARTIAL', 'Partial'), ('PAID', 'Paid'))

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    
    status = models.CharField(max_length=20, choices=STATUS, default='CONFIRMED')
    payment_status = models.CharField(max_length=20, choices=PAY_STATUS, default='PENDING')
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_checked_out = models.BooleanField(default=False)

    def __str__(self):
        return f"Booking {self.id} - {self.guest.full_name}"
    
    def save(self, *args, **kwargs):
        # 1. Calculate Room Rent Logic on Save (Basic calc before DB)
        # Note: The comprehensive Signal below handles the final total (Rent + Extras)
        super(Booking, self).save(*args, **kwargs)

# 8. Booking Charges (Extras)
class BookingCharge(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='charges')
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.description}: {self.amount}"

# 9. Payments
class BookingPayment(models.Model):
    MODES = (('CASH', 'Cash'), ('UPI', 'UPI'), ('CARD', 'Card'), ('TRANSFER', 'Bank Transfer'))
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mode = models.CharField(max_length=20, choices=MODES, default='CASH')
    date = models.DateTimeField(auto_now_add=True)

# 10. Housekeeping Tasks
class HousekeepingTask(models.Model):
    PRIORITY = (('NORMAL', 'Normal'), ('HIGH', 'High'))
    STATUS = (('PENDING', 'Pending'), ('COMPLETED', 'Completed'))
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='tasks')
    priority = models.CharField(max_length=10, choices=PRIORITY, default='NORMAL')
    status = models.CharField(max_length=10, choices=STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

# ==========================================
# SIGNALS FOR AUTOMATIC CALCULATION
# ==========================================

@receiver(post_save, sender=BookingCharge)
@receiver(post_delete, sender=BookingCharge)
def update_booking_total_on_charge_change(sender, instance, **kwargs):
    """
    Updates the Booking.total_amount whenever a charge is added or removed.
    Formula: (Room Price * Nights) + Sum(BookingCharges)
    """
    booking = instance.booking
    
    # 1. Calculate Nights
    if booking.check_in_date and booking.check_out_date:
        delta = booking.check_out_date - booking.check_in_date
        days = delta.days
        if days <= 0:
            days = 1 # Fallback for same-day checkout
    else:
        days = 1

    # 2. Calculate Base Room Rent
    # Ensure we treat decimals correctly
    room_price = booking.room.price_per_night
    room_rent = room_price * days

    # 3. Calculate Sum of Extras
    extras = booking.charges.aggregate(total=Sum('amount'))['total'] or 0

    # 4. Update Booking Total
    booking.total_amount = room_rent + extras
    
    # Save only the total_amount field to avoid recursion loops
    booking.save(update_fields=['total_amount'])