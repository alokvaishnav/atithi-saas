from django.db import models
from django.conf import settings

class HotelSettings(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hotel_settings')
    hotel_name = models.CharField(max_length=255)
    def __str__(self): return self.hotel_name

class Room(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room_number = models.CharField(max_length=10)
    room_type = models.CharField(max_length=50)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='AVAILABLE')
    def __str__(self): return f'{self.room_number}'

class Guest(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(null=True, blank=True)
    def __str__(self): return self.full_name

class Booking(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True)
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    adults = models.IntegerField(default=1)
    children = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default='CONFIRMED')
    payment_status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)


# --- INVENTORY ---
class InventoryItem(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    min_stock_level = models.IntegerField(default=10)
    last_updated = models.DateTimeField(auto_now=True)
    def __str__(self): return self.name

# --- EXPENSES ---
class Expense(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    category = models.CharField(max_length=100) # e.g., Maintenance, Salary
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    def __str__(self): return f"{self.category} - {self.amount}"

# --- FOOD & POS ---
class MenuItem(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100) # e.g., Drinks, Breakfast
    is_available = models.BooleanField(default=True)
    def __str__(self): return self.name

class Order(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    booking = models.ForeignKey('Booking', on_delete=models.SET_NULL, null=True, related_name='orders')
    items = models.TextField() # Store as JSON string for simplicity: {"Burger": 2, "Coke": 1}
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default='PENDING') # PENDING, DELIVERED
    created_at = models.DateTimeField(auto_now_add=True)

# --- HOUSEKEEPING ---
class HousekeepingTask(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room = models.ForeignKey('Room', on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='tasks')
    task_type = models.CharField(max_length=100) # Cleaning, Repair
    status = models.CharField(max_length=50, default='PENDING') # PENDING, COMPLETED
    due_date = models.DateField()

class ActivityLog(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action = models.CharField(max_length=255) # e.g., "Checked in Guest"
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self): return self.action