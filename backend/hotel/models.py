from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from django.core.mail import send_mail

# ==========================================
# 1. ROOM MANAGEMENT
# ==========================================
class Room(models.Model):
    ROOM_TYPES = (
        ('SINGLE', 'Single'), 
        ('DOUBLE', 'Double'), 
        ('SUITE', 'Suite')
    )
    
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
        return f"Room {self.room_number} [{self.get_status_display()}]"

# ==========================================
# 2. GUEST DATA (Enterprise Identity Profile)
# ==========================================
class Guest(models.Model):
    full_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15)
    
    # Identity Tracking (Required for Legal GRC)
    id_type = models.CharField(max_length=50, blank=True, null=True) 
    id_proof_number = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    nationality = models.CharField(max_length=50, default="Indian")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name

# ==========================================
# 3. BOOKINGS & BILLING (Core Logic Engine)
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
    
    # Travel Logistics for Police/Legal Reporting
    purpose_of_visit = models.CharField(max_length=100, blank=True, null=True)
    coming_from = models.CharField(max_length=100, blank=True, null=True)
    going_to = models.CharField(max_length=100, blank=True, null=True)

    # Financial breakdown
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0) 
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)      
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)    
    
    # Payment Tracking
    advance_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0) 
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)  
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.check_in_date and self.check_out_date:
            if self.check_out_date <= self.check_in_date:
                raise ValidationError("Check-out must be after check-in.")

            overlap = Booking.objects.filter(
                room=self.room,
                status__in=['CONFIRMED', 'CHECKED_IN']
            ).exclude(pk=self.pk).filter(
                check_in_date__lt=self.check_out_date,
                check_out_date__gt=self.check_in_date
            )

            if overlap.exists():
                raise ValidationError(f"Room {self.room.room_number} is occupied during these dates.")

    def save(self, *args, **kwargs):
        is_new = self.pk is None 
        
        if self.room and self.check_in_date and self.check_out_date:
            delta = self.check_out_date - self.check_in_date
            nights = max(delta.days, 1)
            
            self.subtotal_amount = self.room.price_per_night * nights
            self.tax_amount = (self.subtotal_amount * Decimal('0.12')).quantize(Decimal('0.01'))
            self.total_amount = self.subtotal_amount + self.tax_amount
            
            if self.advance_paid > 0 and self.amount_paid < self.advance_paid:
                self.amount_paid = self.advance_paid

        self.full_clean()
        super().save(*args, **kwargs)

        if is_new and self.guest.email:
            self.send_confirmation_email()

    def send_confirmation_email(self):
        subject = f"Booking Confirmed at Atithi Hotel - ID: {self.id}"
        message = (
            f"Dear {self.guest.full_name},\n\n"
            f"Your reservation is confirmed! Stay Details:\n\n"
            f"Room: {self.room.room_number}\n"
            f"Check-In: {self.check_in_date.strftime('%d %b %Y')}\n\n"
            f"Total: ₹{self.total_amount}\n"
            f"Advance: ₹{self.advance_paid}\n"
            f"Balance: ₹{self.balance_due}\n\n"
            f"Thank you for choosing us!"
        )
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [self.guest.email])
        except Exception as e:
            print(f"Email failed: {e}")

    @property
    def balance_due(self):
        pos_total = sum(charge.total_cost for charge in self.charges.all())
        return (self.total_amount + pos_total) - self.amount_paid

    def __str__(self):
        return f"B-{self.id} | {self.guest.full_name}"

# ==========================================
# 4. POS & SERVICES (Tax Category Aware)
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
        return f"{self.name} (₹{self.price})"

class BookingCharge(models.Model):
    booking = models.ForeignKey(Booking, related_name='charges', on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    description = models.CharField(max_length=200, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.service:
            self.subtotal = self.service.price * self.quantity
            tax_rate = Decimal('0.05') if self.service.category == 'FOOD' else Decimal('0.18')
            self.tax_amount = (self.subtotal * tax_rate).quantize(Decimal('0.01'))
            self.total_cost = self.subtotal + self.tax_amount
        super().save(*args, **kwargs)

# ==========================================
# 5. EXPENSE TRACKING (Financial Outflow)
# ==========================================
class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('UTILITY', 'Electricity/Water'),
        ('SALARY', 'Staff Salaries'),
        ('MAINTENANCE', 'Repairs & Maintenance'),
        ('INVENTORY', 'Supplies & Grocery'),
        ('TAX', 'Govt Taxes/Fees'),
        ('OTHER', 'Miscellaneous'),
    ]

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - ₹{self.amount}"

# ==========================================
# 6. PROPERTY SETTINGS (White-Label Config)
# ==========================================
class PropertySetting(models.Model):
    hotel_name = models.CharField(max_length=200, default="Atithi Hotel")
    gstin = models.CharField(max_length=15, blank=True, verbose_name="GST Identification Number")
    contact_number = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    
    # Financial Configuration
    currency_symbol = models.CharField(max_length=5, default="₹")
    room_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=12.00, help_text="Default Room GST %")

    class Meta:
        verbose_name = "Property Setting"
        verbose_name_plural = "Property Settings"

    def __str__(self):
        return self.hotel_name