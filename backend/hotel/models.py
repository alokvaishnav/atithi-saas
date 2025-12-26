import logging
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from django.db.models import F # 👈 For Race Condition Fix
from django.core.mail import EmailMessage, get_connection

# ✅ Initialize Logger
logger = logging.getLogger(__name__)

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
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rooms', null=True, blank=True)
    room_number = models.CharField(max_length=10) 
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    
    class Meta:
        unique_together = ('owner', 'room_number')
        # ⚡ Indexing for faster room lookups
        indexes = [
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['owner', 'room_number']),
        ]

    def __str__(self):
        return f"Room {self.room_number} [{self.get_status_display()}]"

# ==========================================
# 2. GUEST DATA
# ==========================================
class Guest(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='guests', null=True, blank=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15)
    id_type = models.CharField(max_length=50, blank=True, null=True) 
    id_proof_number = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    nationality = models.CharField(max_length=50, default="Indian")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # ⚡ Indexing for faster guest search
        indexes = [
            models.Index(fields=['owner', 'phone']),
            models.Index(fields=['owner', 'full_name']),
        ]

    def __str__(self):
        return self.full_name

# ==========================================
# 3. INVENTORY MANAGEMENT
# ==========================================
class InventoryItem(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inventory', null=True, blank=True)
    name = models.CharField(max_length=100)
    current_stock = models.IntegerField(default=0)
    min_stock_alert = models.IntegerField(default=10)
    unit = models.CharField(max_length=20, default="pcs") 
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"

# ==========================================
# 4. BOOKINGS & BILLING
# ==========================================
class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CHECKED_IN', 'Checked In'),
        ('CHECKED_OUT', 'Checked Out'),
        ('CANCELLED', 'Cancelled')
    )

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True)
    check_in_date = models.DateTimeField() 
    check_out_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    
    purpose_of_visit = models.CharField(max_length=100, blank=True, null=True)
    coming_from = models.CharField(max_length=100, blank=True, null=True)
    going_to = models.CharField(max_length=100, blank=True, null=True)

    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0) 
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)      
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)    
    
    advance_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0) 
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)  
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='bookings_created')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # ⚡ Indexing for faster booking queries (Dashboard/Calendar)
        indexes = [
            models.Index(fields=['owner', 'check_in_date']),
            models.Index(fields=['owner', 'check_out_date']),
            models.Index(fields=['owner', 'status']),
        ]

    def clean(self):
        if self.check_in_date and self.check_out_date:
            if self.check_out_date <= self.check_in_date:
                raise ValidationError("Check-out must be after check-in.")

            overlap = Booking.objects.filter(
                owner=self.owner,
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
        
        # 1. Calculate Financials
        if self.room and self.check_in_date and self.check_out_date:
            delta = self.check_out_date - self.check_in_date
            nights = max(delta.days, 1)
            
            settings = PropertySetting.objects.filter(owner=self.owner).first()
            room_tax_rate = settings.room_tax_rate if settings else Decimal('12.00')

            self.subtotal_amount = self.room.price_per_night * nights
            self.tax_amount = (self.subtotal_amount * (room_tax_rate / Decimal('100.00'))).quantize(Decimal('0.01'))
            self.total_amount = self.subtotal_amount + self.tax_amount
            
            if self.advance_paid > 0 and self.amount_paid < self.advance_paid:
                self.amount_paid = self.advance_paid

        self.full_clean()
        super().save(*args, **kwargs)

        # 2. TRIGGER ASYNC NOTIFICATIONS
        if is_new:
            try:
                # Import tasks here to avoid circular imports
                from .tasks import send_booking_confirmation_email, send_booking_whatsapp
                
                # Fire and forget (Background Task)
                send_booking_confirmation_email.delay(self.id)
                send_booking_whatsapp.delay(self.id)
            except ImportError:
                # Fallback if Celery isn't running: Try synchronous send (safe failover)
                if self.guest.email:
                    self.send_confirmation_email_sync()

    def send_confirmation_email_sync(self):
        """
        Synchronous fallback for sending email using HOTEL OWNER'S SMTP.
        Used if Celery is not configured or fails.
        """
        try:
            from core.models import HotelSMTPSettings
            
            # 1. Get SMTP Settings
            smtp_config = HotelSMTPSettings.objects.filter(owner=self.owner).first()
            
            if not smtp_config:
                logger.warning(f"Skipping email: No SMTP Settings found for {self.owner.username}")
                return

            # 2. Create Custom Connection
            connection = get_connection(
                host=smtp_config.email_host,
                port=smtp_config.email_port,
                username=smtp_config.email_host_user,
                password=smtp_config.email_host_password,
                use_tls=True
            )

            # 3. Create Email Content
            hotel_settings = PropertySetting.objects.filter(owner=self.owner).first()
            hotel_name = hotel_settings.hotel_name if hotel_settings else 'Atithi Hotel'
            
            subject = f"Booking Confirmed at {hotel_name} - ID: {self.id}"
            message = (
                f"Dear {self.guest.full_name},\n\n"
                f"Your reservation is confirmed! Stay Details:\n\n"
                f"Room: {self.room.room_number}\n"
                f"Check-In: {self.check_in_date.strftime('%d %b %Y')}\n\n"
                f"Total: ₹{self.total_amount}\n"
                f"Advance: ₹{self.advance_paid}\n"
                f"Balance: ₹{self.balance_due}\n\n"
                f"Thank you for choosing us!\n\n"
                f"Regards,\n{hotel_name}"
            )
            
            # 4. Send
            email = EmailMessage(
                subject,
                message,
                smtp_config.email_host_user, # FROM: Hotel Email
                [self.guest.email],          # TO: Guest Email
                connection=connection        # VIA: Hotel Credentials
            )
            email.send()
            logger.info(f"Email sent via {smtp_config.email_host_user} for Booking {self.id}")

        except Exception as e:
            # Silently fail so the Booking still saves, but log the error!
            logger.error(f"Email delivery failed for Booking {self.id}: {e}")

    @property
    def balance_due(self):
        pos_total = sum(charge.total_cost for charge in self.charges.all())
        return (self.total_amount + pos_total) - self.amount_paid

    def __str__(self):
        return f"B-{self.id} | {self.guest.full_name}"

# ==========================================
# 5. POS & SERVICES
# ==========================================
class Service(models.Model):
    CATEGORY_CHOICES = (
        ('FOOD', 'Food & Beverage'),
        ('LAUNDRY', 'Laundry'),
        ('SPA', 'Spa & Wellness'),
        ('TRAVEL', 'Travel Desk'),
        ('OTHER', 'Other')
    )
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services', null=True, blank=True)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2) 
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='FOOD')
    is_active = models.BooleanField(default=True)
    linked_inventory_item = models.ForeignKey(InventoryItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="linked_services")

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
        is_new = self.pk is None
        
        if self.service:
            self.subtotal = self.service.price * self.quantity
            settings = PropertySetting.objects.filter(owner=self.booking.owner).first()
            
            if self.service.category == 'FOOD':
                rate = settings.food_tax_rate if settings else Decimal('5.00')
            else:
                rate = settings.service_tax_rate if settings else Decimal('18.00')

            self.tax_amount = (self.subtotal * (rate / Decimal('100.00'))).quantize(Decimal('0.01'))
            self.total_cost = self.subtotal + self.tax_amount
            
            if is_new and self.service.linked_inventory_item:
                # 🛡️ RACE CONDITION FIX: Use F() expression
                item = self.service.linked_inventory_item
                
                # We still need to check logic in Python for validation
                # But actual decrement happens at DB level
                if item.current_stock < self.quantity:
                    raise ValidationError(f"Not enough stock! Only {item.current_stock} left of {item.name}.")
                
                # Atomic Decrement
                item.current_stock = F('current_stock') - self.quantity
                item.save()
                
                # Refresh from DB to get the actual integer value for UI
                item.refresh_from_db()

        super().save(*args, **kwargs)

# ==========================================
# 6. HOUSEKEEPING
# ==========================================
class HousekeepingTask(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed')
    )
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='housekeeping_tasks')
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.room.room_number} - {self.status}"

# ==========================================
# 7. EXPENSE TRACKING
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

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
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
# 8. PROPERTY SETTINGS
# ==========================================
class PropertySetting(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hotel_profile', null=True, blank=True)
    hotel_name = models.CharField(max_length=200, default="Atithi Hotel")
    gstin = models.CharField(max_length=15, blank=True, verbose_name="GST Identification Number")
    contact_number = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    currency_symbol = models.CharField(max_length=5, default="₹")
    room_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=12.00, help_text="GST % for Rooms")
    food_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00, help_text="GST % for Food")
    service_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, help_text="GST % for Other Services")

    class Meta:
        verbose_name = "Property Setting"
        verbose_name_plural = "Property Settings"

    def __str__(self):
        return f"{self.hotel_name} ({self.owner.username if self.owner else 'No Owner'})"