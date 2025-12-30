from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from datetime import timedelta
import uuid

# 1. Global Settings (Branding, Tax & GST)
class HotelSettings(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hotel_settings')
    hotel_name = models.CharField(max_length=200, default="Atithi Hotel")
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    tax_gst_number = models.CharField(max_length=50, blank=True, null=True)
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=12.00) # Default 12% for hospitality
    
    def __str__(self):
        return self.hotel_name

# 2. Rooms (Inventory & Features)
class Room(models.Model):
    ROOM_TYPES = (('SINGLE', 'Single'), ('DOUBLE', 'Double'), ('SUITE', 'Suite'), ('DELUXE', 'Deluxe'), ('DORM', 'Dormitory'))
    STATUS_CHOICES = (('AVAILABLE', 'Available'), ('OCCUPIED', 'Occupied'), ('DIRTY', 'Dirty'), ('MAINTENANCE', 'Maintenance'))

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=10)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='SINGLE')
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    
    # Advanced Fields
    floor = models.CharField(max_length=10, default="1")
    capacity = models.IntegerField(default=2)
    amenities = models.JSONField(default=list, blank=True) # Stores ['WIFI', 'AC', 'TV']

    class Meta:
        unique_together = ('owner', 'room_number') # Room 101 can exist for different hotel owners

    def __str__(self):
        return f"Room {self.room_number} - {self.owner.hotel_name if hasattr(self.owner, 'hotel_settings') else self.owner.username}"

# 3. Guests (CRM & Identity)
class Guest(models.Model):
    ID_TYPES = [
        ('AADHAR', 'Aadhar Card'),
        ('PASSPORT', 'Passport'),
        ('DRIVING_LICENSE', 'Driving License'),
        ('VOTER_ID', 'Voter ID'),
        ('OTHER', 'Other'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='guests')
    full_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15)
    address = models.TextField(blank=True, null=True)
    
    nationality = models.CharField(max_length=100, default="Indian")
    id_proof_type = models.CharField(max_length=50, choices=ID_TYPES, default='AADHAR')
    id_proof_number = models.CharField(max_length=100, blank=True, null=True)
    preferences = models.TextField(blank=True, null=True)
    is_vip = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} {'(VIP)' if self.is_vip else ''}"

# 4. POS & Services
class Service(models.Model):
    CATEGORIES = (('FOOD', 'Food'), ('BEVERAGE', 'Beverage'), ('SERVICE', 'Service'), ('OTHER', 'Other'))
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='FOOD')

    def __str__(self):
        return self.name

# 5. Inventory Control
class InventoryItem(models.Model):
    CATS = (('SUPPLIES', 'Supplies'), ('FOOD', 'Food Ingredient'), ('MAINTENANCE', 'Maintenance'))
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inventory')
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATS, default='SUPPLIES')
    current_stock = models.IntegerField(default=0)
    min_stock_alert = models.IntegerField(default=5)

    def __str__(self):
        return self.name

# 6. Finance & Expenses
class Expense(models.Model):
    CATS = (('UTILITIES', 'Utilities'), ('SALARY', 'Salary'), ('MAINTENANCE', 'Maintenance'), ('SUPPLIES', 'Supplies'), ('MARKETING', 'Marketing'))
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATS, default='UTILITIES')
    date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.title} - {self.amount}"

# 7. Bookings (Core Transaction)
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
        return f"BK-{self.id} | {self.guest.full_name}"
    
    @property
    def nights(self):
        delta = self.check_out_date - self.check_in_date
        return delta.days if delta.days > 0 else 1

    @property
    def balance(self):
        return self.total_amount - self.amount_paid

    @property
    def gst_amount(self):
        try:
            rate = self.owner.hotel_settings.gst_percentage / 100
            return self.total_amount * rate
        except:
            return self.total_amount * 0.12 # Fallback to 12%

# 8. Folio Management (Charges & Payments)
class BookingCharge(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='charges')
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.description}: {self.amount}"

class BookingPayment(models.Model):
    MODES = (('CASH', 'Cash'), ('UPI', 'UPI'), ('CARD', 'Card'), ('TRANSFER', 'Bank Transfer'))
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mode = models.CharField(max_length=20, choices=MODES, default='CASH')
    date = models.DateTimeField(auto_now_add=True)

# 9. Operations & Logs
class HousekeepingTask(models.Model):
    PRIORITY = (('NORMAL', 'Normal'), ('HIGH', 'High'))
    STATUS = (('PENDING', 'Pending'), ('COMPLETED', 'Completed'))
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='tasks')
    priority = models.CharField(max_length=10, choices=PRIORITY, default='NORMAL')
    status = models.CharField(max_length=10, choices=STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

class SystemLog(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=255) # e.g. "ROOM_CHECKOUT", "STOCK_UPDATE"
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

# 10. Licensing
class License(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='licenses', null=True)
    key = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=False)
    expiry_date = models.DateField()
    activated_at = models.DateTimeField(auto_now_add=True)

    def days_left(self):
        if not self.is_active: return 0
        delta = self.expiry_date - timezone.now().date()
        return max(delta.days, 0)

# ==========================================
# SIGNALS: Auto-Calculation & Synchronization
# ==========================================

def sync_booking_totals(booking_id):
    """
    Recalculates the master total for a booking.
    Formula: (Room Rate * Nights) + Sum(Extra Charges)
    """
    # Import locally to avoid circular dependencies
    from .models import Booking
    booking = Booking.objects.get(id=booking_id)
    
    # 1. Base Room Cost
    base_cost = booking.room.price_per_night * booking.nights
    
    # 2. Add Extras
    extras = booking.charges.aggregate(total=Sum('amount'))['total'] or 0
    
    # 3. Calculate Total Paid
    paid = booking.payments.aggregate(total=Sum('amount'))['total'] or 0
    
    # 4. Save Final Stats to Booking
    booking.total_amount = base_cost + extras
    booking.amount_paid = paid
    
    # Update Payment Status
    if paid >= booking.total_amount:
        booking.payment_status = 'PAID'
    elif paid > 0:
        booking.payment_status = 'PARTIAL'
    else:
        booking.payment_status = 'PENDING'
    
    booking.save(update_fields=['total_amount', 'amount_paid', 'payment_status'])

@receiver(post_save, sender=BookingCharge)
@receiver(post_delete, sender=BookingCharge)
@receiver(post_save, sender=BookingPayment)
@receiver(post_delete, sender=BookingPayment)
def trigger_sync(sender, instance, **kwargs):
    sync_booking_totals(instance.booking.id)

@receiver(post_save, sender=Booking)
def initial_sync(sender, instance, created, **kwargs):
    # Only run on create or if total_amount wasn't the field just updated
    if created or kwargs.get('update_fields') is None:
        sync_booking_totals(instance.id)