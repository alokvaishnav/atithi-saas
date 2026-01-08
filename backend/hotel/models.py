from django.db import models
from django.conf import settings
from django.utils import timezone
import json
from datetime import timedelta

# ==============================================================================
# 1. HOTEL SETTINGS (Global Configuration for Tenants)
# ==============================================================================

class HotelSettings(models.Model):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='hotel_settings'
    )
    
    # --- Branding ---
    hotel_name = models.CharField(max_length=255, default="My Hotel")
    description = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to='hotel_logos/', blank=True, null=True)
    
    # --- Financials ---
    currency_symbol = models.CharField(max_length=10, default="₹")
    tax_gst_number = models.CharField(max_length=50, blank=True, null=True)
    
    # --- Operations ---
    check_in_time = models.TimeField(default="12:00")
    check_out_time = models.TimeField(default="11:00")
    
    # --- Automation: Email (SMTP for this specific hotel) ---
    smtp_server = models.CharField(max_length=255, blank=True, null=True)
    smtp_port = models.CharField(max_length=10, default="587")
    smtp_username = models.CharField(max_length=255, blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)
    auto_send_confirmation = models.BooleanField(default=False)
    auto_send_invoice = models.BooleanField(default=False)

    # --- Automation: WhatsApp (Meta/Twilio for this specific hotel) ---
    whatsapp_provider = models.CharField(max_length=20, default='META', choices=[('META', 'Meta Cloud'), ('TWILIO', 'Twilio')])
    whatsapp_phone_id = models.CharField(max_length=100, blank=True, null=True)
    whatsapp_auth_token = models.CharField(max_length=255, blank=True, null=True)

    # --- License System ---
    license_key = models.CharField(max_length=255, blank=True, null=True)
    license_expiry = models.DateField(null=True, blank=True)
    
    # Link to a Subscription Plan (Optional)
    # plan = models.ForeignKey('SubscriptionPlan', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Settings for {self.hotel_name}"

# ==============================================================================
# 2. SUBSCRIPTION PLANS (NEW - For SaaS Management)
# ==============================================================================

class SubscriptionPlan(models.Model):
    PLAN_INTERVALS = (
        ('month', 'Monthly'),
        ('year', 'Yearly'),
    )

    name = models.CharField(max_length=100, unique=True) # e.g. "Gold Tier"
    price = models.DecimalField(max_digits=10, decimal_places=2) # e.g. 1999.00
    currency = models.CharField(max_length=10, default='INR')
    interval = models.CharField(max_length=10, choices=PLAN_INTERVALS, default='month')
    max_rooms = models.IntegerField(default=10)
    features = models.JSONField(default=list) # Stores ["POS", "Inventory"]
    color = models.CharField(max_length=20, default='blue') # UI Theme color
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - ₹{self.price}"

# ==============================================================================
# 3. CORE MODELS (Rooms, Guests, Bookings)
# ==============================================================================

class Room(models.Model):
    ROOM_TYPES = [
        ('SINGLE', 'Single'),
        ('DOUBLE', 'Double'),
        ('SUITE', 'Suite'),
        ('DELUXE', 'Deluxe'),
        ('DORM', 'Dormitory'),
    ]
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('BOOKED', 'Booked'),
        ('MAINTENANCE', 'Maintenance'),
        ('DIRTY', 'Dirty'),
        ('OCCUPIED', 'Occupied'),
    ]
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room_number = models.CharField(max_length=20)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='SINGLE')
    floor = models.CharField(max_length=10, default='1') 
    capacity = models.IntegerField(default=2)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    
    # Stores amenities as a JSON string (e.g. "['WiFi', 'AC']")
    amenities = models.TextField(default="[]", blank=True)
    
    # Channel Manager (iCal)
    ical_link = models.URLField(max_length=500, blank=True, null=True, help_text="Paste OTA Calendar Link")

    class Meta:
        # Ensures a hotel cannot have two rooms with the same number
        unique_together = ('owner', 'room_number')
        ordering = ['room_number']

    def __str__(self):
        return f"{self.room_number} ({self.get_status_display()})"

class Guest(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    id_proof_type = models.CharField(max_length=50, blank=True, null=True)
    id_proof_number = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Loyalty & Profile
    is_vip = models.BooleanField(default=False)
    is_blacklisted = models.BooleanField(default=False)
    total_stays = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    preferences = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=20, default='REGULAR')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Prevents duplicate guests (same phone) for the same hotel
        unique_together = ('owner', 'phone')
        ordering = ['-created_at']

    def __str__(self):
        return self.full_name

class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CHECKED_IN', 'Checked In'),
        ('CHECKED_OUT', 'Checked Out'),
        ('CANCELLED', 'Cancelled'),
    ]
    PAYMENT_STATUS = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partial'),
        ('PAID', 'Paid'),
    ]
    SOURCE_CHOICES = [
        ('WALK_IN', 'Walk In'),
        ('WEB', 'Website'),
        ('PHONE', 'Phone'),
        ('OTA', 'Online Travel Agent'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Related names are critical for Serializers
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name='bookings')
    
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    checked_in_at = models.DateTimeField(blank=True, null=True)
    checked_out_at = models.DateTimeField(blank=True, null=True)
    
    # Guest Counts
    adults = models.IntegerField(default=1)
    children = models.IntegerField(default=0)
    
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='WALK_IN') 
    
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Auto-Calculate Total Amount if not set (Safety Fallback)
        if self.room and self.total_amount == 0 and self.check_in_date and self.check_out_date:
            delta = self.check_out_date - self.check_in_date
            # Ensure at least 1 night is charged even if same-day dates are entered
            nights = delta.days if delta.days > 0 else 1
            self.total_amount = self.room.price_per_night * nights
            
        super(Booking, self).save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.id} - {self.guest.full_name}"

class BookingPayment(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=50, default='CASH') 
    date = models.DateField(auto_now_add=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)

class BookingCharge(models.Model):
    """Extra charges like Food, Laundry, etc."""
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='charges')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)

# ==============================================================================
# 4. INVENTORY & POS
# ==============================================================================

class InventoryItem(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='SUPPLIES')
    
    # Stock Logic
    current_stock = models.IntegerField(default=0) 
    min_stock_alert = models.IntegerField(default=5) 
    unit = models.CharField(max_length=50, default='PCS') 
    
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class MenuItem(models.Model):
    """For Restaurant/Room Service"""
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, default='FOOD')
    description = models.TextField(blank=True, null=True)
    is_available = models.BooleanField(default=True)
    
    def __str__(self): return self.name

class Order(models.Model):
    """POS Orders linked to Booking or Direct"""
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    items = models.TextField() # JSON string of items ordered
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default='COMPLETED') 
    created_at = models.DateTimeField(auto_now_add=True)

# ==============================================================================
# 5. OPERATIONS & LOGS
# ==============================================================================

class Expense(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="Expense")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, default='UTILITIES')
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    
    def __str__(self): return f"{self.title} - {self.amount}"

class HousekeepingTask(models.Model):
    PRIORITY_CHOICES = [('NORMAL', 'Normal'), ('HIGH', 'High')]
    TYPE_CHOICES = [('CLEANING', 'Cleaning'), ('REPAIR', 'Repair'), ('INSPECTION', 'Inspection')]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='tasks')
    
    task_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='CLEANING')
    status = models.CharField(max_length=50, default='PENDING') 
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMAL')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

class ActivityLog(models.Model):
    """
    Tracks all major system actions for Audit Trails.
    🟢 CRITICAL: We use 'details' as the field name to match views.py usage:
    ActivityLog.objects.create(details=...)
    """
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action = models.CharField(max_length=100) 
    category = models.CharField(max_length=50, default='GENERAL') # Critical for Admin Filters
    
    # This field MUST be named 'details' to prevent 500 Errors in existing views
    details = models.TextField() 
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Compatibility Property: Allows access via 'description' if needed
    @property
    def description(self):
        return self.details

    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self): return f"{self.action} - {self.timestamp}"

# ==============================================================================
# 6. SAAS PLATFORM SETTINGS (SUPER ADMIN ONLY)
# ==============================================================================

class PlatformSettings(models.Model):
    """
    Settings for the SaaS Owner (You).
    Configures White-labeling, Global SMTP, Support Contacts, etc.
    """
    # Branding
    app_name = models.CharField(max_length=50, default="Atithi SaaS")
    company_name = models.CharField(max_length=100, default="My Tech Company")
    logo = models.ImageField(upload_to='platform/', null=True, blank=True)
    
    # Contact Info (Visible to Tenants)
    support_email = models.EmailField(default="support@example.com")
    support_phone = models.CharField(max_length=20, default="+91-9999999999")
    address = models.TextField(blank=True, null=True)

    # System SMTP (Global Fallback for Password Resets/Welcome Emails)
    smtp_host = models.CharField(max_length=100, blank=True, null=True)
    smtp_port = models.CharField(max_length=10, default="587")
    smtp_user = models.CharField(max_length=100, blank=True, null=True)
    smtp_password = models.CharField(max_length=100, blank=True, null=True)

    # System WhatsApp (Global Notifications)
    whatsapp_phone_id = models.CharField(max_length=100, blank=True, null=True)
    whatsapp_token = models.CharField(max_length=255, blank=True, null=True)

    # 🟢 NEW: Global Maintenance Mode Switch
    maintenance_mode = models.BooleanField(default=False)

    # --- EDITABLE WELCOME MESSAGES ---
    welcome_email_subject = models.CharField(
        max_length=255, 
        default="Welcome to {app_name} - Your Hotel Manager",
        help_text="Available placeholders: {app_name}, {name}"
    )
    welcome_email_body = models.TextField(
        default="Hi {name},\n\nWelcome to {app_name}! Your account has been created.\n\nUsername: {username}\nPassword: {password}\n\nLogin here: http://16.171.144.127/login\n\nBest,\n{company_name}",
        help_text="Available placeholders: {name}, {app_name}, {username}, {password}, {company_name}"
    )
    
    # 🟢 NEW: WhatsApp Welcome Message Template
    welcome_whatsapp_msg = models.TextField(
        default="Welcome to {app_name}! Your hotel {hotel} is now live. Login at: http://16.171.144.127/login",
        help_text="Available placeholders: {name}, {app_name}, {hotel}"
    )

    def save(self, *args, **kwargs):
        # Force Singleton (Always ID 1) - Ensures only one settings row exists
        self.pk = 1
        super(PlatformSettings, self).save(*args, **kwargs)

    def __str__(self):
        return "Global Platform Configuration"

# ==============================================================================
# 7. GLOBAL ANNOUNCEMENTS (SUPER ADMIN BROADCAST)
# ==============================================================================

class GlobalAnnouncement(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title