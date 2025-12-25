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
    
    # 🔗 SAAS ISOLATION: Link Room to Specific Hotel Owner
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rooms', null=True, blank=True)
    
    room_number = models.CharField(max_length=10) 
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    
    class Meta:
        # Ensures room number is unique ONLY within the same hotel (Owner)
        unique_together = ('owner', 'room_number')

    def __str__(self):
        return f"Room {self.room_number} [{self.get_status_display()}]"

# ==========================================
# 2. GUEST DATA (Enterprise Identity Profile)
# ==========================================
class Guest(models.Model):
    # 🔗 SAAS ISOLATION: Guests belong to a specific Hotel Database
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='guests', null=True, blank=True)

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
# 3. INVENTORY MANAGEMENT (New Feature 📦)
# ==========================================
class InventoryItem(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inventory', null=True, blank=True)
    name = models.CharField(max_length=100)
    current_stock = models.IntegerField(default=0)
    min_stock_alert = models.IntegerField(default=10)
    unit = models.CharField(max_length=20, default="pcs") # pcs, kg, ltr
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"

# ==========================================
# 4. BOOKINGS & BILLING (Core Logic Engine)
# ==========================================
class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CHECKED_IN', 'Checked In'),
        ('CHECKED_OUT', 'Checked Out'),
        ('CANCELLED', 'Cancelled')
    )

    # 🔗 SAAS ISOLATION
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)

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
    
    # Audit Trail
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='bookings_created')
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.check_in_date and self.check_out_date:
            if self.check_out_date <= self.check_in_date:
                raise ValidationError("Check-out must be after check-in.")

            # Filter overlap ONLY for rooms belonging to this booking's owner
            overlap = Booking.objects.filter(
                owner=self.owner,  # 👈 Crucial SaaS Filter
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
            
            # ✅ FIX: Fetch Dynamic Tax Settings from Owner
            settings = PropertySetting.objects.filter(owner=self.owner).first()
            room_tax_rate = settings.room_tax_rate if settings else Decimal('12.00')

            self.subtotal_amount = self.room.price_per_night * nights
            self.tax_amount = (self.subtotal_amount * (room_tax_rate / Decimal('100.00'))).quantize(Decimal('0.01'))
            self.total_amount = self.subtotal_amount + self.tax_amount
            
            if self.advance_paid > 0 and self.amount_paid < self.advance_paid:
                self.amount_paid = self.advance_paid

        self.full_clean()
        super().save(*args, **kwargs)

        # 🛑 DISABLED FOR STABILITY: The email server is timing out and crashing the app.
        # Uncomment this ONLY after configuring EMAIL_USER and EMAIL_PASS in Render Environment Variables.
        # if is_new and self.guest.email:
        #     self.send_confirmation_email()

    def send_confirmation_email(self):
        """
        Sends an email receipt. currently disabled to prevent server crashes on Render
        until SMTP credentials are set up.
        """
        try:
            hotel_name = self.owner.hotel_profile.hotel_name if hasattr(self.owner, 'hotel_profile') else 'Atithi Hotel'
            subject = f"Booking Confirmed at {hotel_name} - ID: {self.id}"
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
            # send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [self.guest.email])
            pass 
        except Exception as e:
            print(f"Email failed: {e}")

    @property
    def balance_due(self):
        pos_total = sum(charge.total_cost for charge in self.charges.all())
        return (self.total_amount + pos_total) - self.amount_paid

    def __str__(self):
        return f"B-{self.id} | {self.guest.full_name}"

# ==========================================
# 5. POS & SERVICES (With Inventory Link)
# ==========================================
class Service(models.Model):
    CATEGORY_CHOICES = (
        ('FOOD', 'Food & Beverage'),
        ('LAUNDRY', 'Laundry'),
        ('SPA', 'Spa & Wellness'),
        ('TRAVEL', 'Travel Desk'),
        ('OTHER', 'Other')
    )
    
    # 🔗 SAAS ISOLATION
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services', null=True, blank=True)

    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2) 
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='FOOD')
    is_active = models.BooleanField(default=True)
    
    # 📦 LINK TO INVENTORY: Buying this service reduces stock of this item
    linked_inventory_item = models.ForeignKey(InventoryItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="linked_services")

    def __str__(self):
        return f"{self.name} (₹{self.price})"

class BookingCharge(models.Model):
    # Linked to Booking, which is already Linked to Owner. So we are safe here.
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
            
            # ✅ FIX: Fetch Dynamic Tax Settings from Owner
            settings = PropertySetting.objects.filter(owner=self.booking.owner).first()
            
            if self.service.category == 'FOOD':
                rate = settings.food_tax_rate if settings else Decimal('5.00')
            else:
                rate = settings.service_tax_rate if settings else Decimal('18.00')

            self.tax_amount = (self.subtotal * (rate / Decimal('100.00'))).quantize(Decimal('0.01'))
            self.total_cost = self.subtotal + self.tax_amount
            
            # 📦 INVENTORY DEDUCTION LOGIC
            if is_new and self.service.linked_inventory_item:
                item = self.service.linked_inventory_item
                
                # 🛑 FIX: Prevent Negative Inventory
                if item.current_stock < self.quantity:
                    raise ValidationError(f"Not enough stock! Only {item.current_stock} left of {item.name}.")
                
                item.current_stock -= self.quantity
                item.save()

        super().save(*args, **kwargs)

# ==========================================
# 6. HOUSEKEEPING (New Feature 🧹)
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
# 7. EXPENSE TRACKING (Financial Outflow)
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

    # 🔗 SAAS ISOLATION
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
# 8. PROPERTY SETTINGS (White-Label Config)
# ==========================================
class PropertySetting(models.Model):
    # 🔗 SAAS ISOLATION: The Master Link
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hotel_profile', null=True, blank=True)

    hotel_name = models.CharField(max_length=200, default="Atithi Hotel")
    gstin = models.CharField(max_length=15, blank=True, verbose_name="GST Identification Number")
    contact_number = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    
    # Financial Configuration
    currency_symbol = models.CharField(max_length=5, default="₹")
    
    # ✅ DYNAMIC TAX RATES (Editable by Owner)
    room_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=12.00, help_text="GST % for Rooms")
    food_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00, help_text="GST % for Food")
    service_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, help_text="GST % for Other Services")

    class Meta:
        verbose_name = "Property Setting"
        verbose_name_plural = "Property Settings"

    def __str__(self):
        return f"{self.hotel_name} ({self.owner.username if self.owner else 'No Owner'})"