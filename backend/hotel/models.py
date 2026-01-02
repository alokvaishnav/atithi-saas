from django.db import models
from django.conf import settings
import json

# --- HOTEL SETTINGS & CONFIGURATION ---
class HotelSettings(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hotel_settings')
    hotel_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    tax_gst_number = models.CharField(max_length=50, blank=True, null=True)
    logo = models.ImageField(upload_to='hotel_logos/', null=True, blank=True)
    
    # Operations
    check_in_time = models.TimeField(default='12:00')
    check_out_time = models.TimeField(default='11:00')
    currency_symbol = models.CharField(max_length=5, default='₹')

    # SMTP (Email)
    smtp_server = models.CharField(max_length=255, blank=True, null=True)
    smtp_port = models.CharField(max_length=10, default='587')
    smtp_username = models.CharField(max_length=255, blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)

    # WhatsApp API
    whatsapp_provider = models.CharField(max_length=50, default='META') # META or TWILIO
    whatsapp_phone_id = models.CharField(max_length=255, blank=True, null=True)
    whatsapp_auth_token = models.CharField(max_length=255, blank=True, null=True)

    # License System
    license_key = models.CharField(max_length=255, blank=True, null=True)
    license_expiry = models.DateField(null=True, blank=True)

    def __str__(self): return self.hotel_name


# --- ROOMS & INVENTORY ---
class Room(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('DIRTY', 'Dirty'),
        ('MAINTENANCE', 'Maintenance'),
    ]
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room_number = models.CharField(max_length=10)
    room_type = models.CharField(max_length=50) # e.g., Single, Double, Suite
    floor = models.CharField(max_length=10, default='1')
    capacity = models.IntegerField(default=2)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    amenities = models.TextField(default="[]", blank=True) # Store JSON string of amenities IDs

    def __str__(self): return f'{self.room_number} ({self.room_type})'


# --- GUESTS ---
class Guest(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    id_proof_type = models.CharField(max_length=50, blank=True, null=True) # Aadhar, Passport
    id_proof_number = models.CharField(max_length=100, blank=True, null=True)
    
    # Loyalty & Profile
    is_vip = models.BooleanField(default=False)
    is_blacklisted = models.BooleanField(default=False)
    total_stays = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    preferences = models.TextField(blank=True, null=True) # Notes like "Allergic to nuts"
    type = models.CharField(max_length=20, default='REGULAR') # REGULAR, CORPORATE, VIP

    def __str__(self): return self.full_name


# --- BOOKINGS & FOLIO ---
class Booking(models.Model):
    STATUS_CHOICES = [
        ('CONFIRMED', 'Confirmed'),
        ('CHECKED_IN', 'Checked In'),
        ('CHECKED_OUT', 'Checked Out'),
        ('CANCELLED', 'Cancelled'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, related_name='bookings')
    
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    
    adults = models.IntegerField(default=1)
    children = models.IntegerField(default=0)
    
    # Financials
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking #{self.id} - {self.guest.full_name}"

# Extra Charges (Room Service, Laundry, etc linked to Booking)
class BookingCharge(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='charges')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)

# Payments (Part of Folio)
class BookingPayment(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=50) # CASH, UPI, CARD, TRANSFER
    date = models.DateField(auto_now_add=True)


# --- FOOD, POS & SERVICES ---
class MenuItem(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, default='FOOD') # FOOD, BEVERAGE, LAUNDRY, TRANSPORT
    description = models.TextField(blank=True, null=True)
    is_available = models.BooleanField(default=True)
    
    def __str__(self): return self.name

class Order(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, related_name='orders', blank=True)
    items = models.TextField() # JSON string: [{"name": "Burger", "qty": 2, "price": 100}]
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default='PENDING') # PENDING, COMPLETED, BILLED
    created_at = models.DateTimeField(auto_now_add=True)


# --- HOUSEKEEPING ---
class HousekeepingTask(models.Model):
    PRIORITY_CHOICES = [('NORMAL', 'Normal'), ('HIGH', 'High')]
    TYPE_CHOICES = [('CLEANING', 'Cleaning'), ('REPAIR', 'Repair'), ('INSPECTION', 'Inspection')]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='tasks')
    
    task_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='CLEANING')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMAL')
    description = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=50, default='PENDING') # PENDING, COMPLETED
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)


# --- INVENTORY & EXPENSES ---
class InventoryItem(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='SUPPLIES')
    
    # Stock Logic
    current_stock = models.IntegerField(default=0)
    min_stock_alert = models.IntegerField(default=5)
    unit = models.CharField(max_length=50, default='PCS') # PCS, KG, BOX
    
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self): return self.name

class Expense(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="Expense")
    category = models.CharField(max_length=100, default='UTILITIES') # Maintenance, Salary, Utilities
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True) # Often 'notes' in frontend
    date = models.DateField()
    
    def __str__(self): return f"{self.title} - {self.amount}"


# --- SYSTEM LOGS ---
class ActivityLog(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action = models.CharField(max_length=50) # CREATE, UPDATE, DELETE, LOGIN
    details = models.TextField() # e.g. "Checked in Guest John Doe to Room 101"
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self): return f"{self.action} - {self.timestamp}"