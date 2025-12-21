from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
from datetime import timedelta
from django.utils import timezone

class User(AbstractUser):
    # Professional Roles for Enterprise HMS
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'General Manager'),
        ('RECEPTIONIST', 'Receptionist'),
        ('HOUSEKEEPING', 'Housekeeping Staff'),
        ('ACCOUNTANT', 'Accountant'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='RECEPTIONIST')
    phone = models.CharField(max_length=15, blank=True, null=True)
    
    # 🔗 SAAS ISOLATION: Link Staff to their Hotel Owner
    # - If this user is an OWNER, this field is NULL.
    # - If this user is STAFF (Manager, Receptionist), this points to their BOSS (Owner).
    hotel_owner = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='employees',
        help_text="The Owner who manages this staff member."
    )

    # Ensures email and role are handled during user creation
    REQUIRED_FIELDS = ['email', 'role']

    def __str__(self):
        # Shows "Alice (Receptionist) - [Boss: Bob]" for easier debugging
        boss_name = f" [Boss: {self.hotel_owner.username}]" if self.hotel_owner else ""
        return f"{self.username} ({self.get_role_display()}){boss_name}"

    # 👇 CRITICAL ADDITION: This fixes the 500 Error on Login
    # The frontend expects 'hotel_name' in the login response.
    def get_hotel_name(self):
        """
        Helper to safely fetch the Hotel Name without crashing.
        """
        try:
            # Import inside method to avoid circular import errors
            from hotel.models import Setting 
            
            # If I am the owner, find my settings. If I am staff, use my boss's settings.
            target_user = self.hotel_owner if self.hotel_owner else self
            
            # Find settings belonging to this owner
            setting = Setting.objects.filter(owner=target_user).first()
            
            if setting and setting.hotel_name:
                return setting.hotel_name
            return "Atithi HMS" # Default fallback
            
        except Exception:
            return "Atithi HMS"

class SaaSConfig(models.Model):
    """
    Global Configuration for the Software Company (YOU).
    Managed via Admin Panel. Displayed on the 'Support' page.
    """
    company_name = models.CharField(max_length=100, default="Atithi SaaS Corp")
    support_email = models.EmailField(default="support@atithi.com")
    support_phone = models.CharField(max_length=20, default="+91 99999 88888")
    website = models.URLField(blank=True, null=True)
    address = models.TextField(default="Tech Park, Bangalore, India")
    
    # Version Control
    software_version = models.CharField(max_length=10, default="v2.5")
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "SaaS Master Configuration"

    class Meta:
        verbose_name = "Software Company Settings"
        verbose_name_plural = "Software Company Settings"


class Subscription(models.Model):
    """
    Control SaaS Access. If expired, the Owner cannot login.
    """
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    plan_name = models.CharField(max_length=50, default="TRIAL") # TRIAL, PRO, ENTERPRISE
    license_key = models.CharField(max_length=100, unique=True, blank=True)
    start_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        # Default to 14 days trial if no date set
        if not self.expiry_date:
            self.expiry_date = timezone.now() + timedelta(days=14)
        super().save(*args, **kwargs)

    @property
    def days_left(self):
        now = timezone.now()
        if self.expiry_date < now:
            return 0
        return (self.expiry_date - now).days

    def __str__(self):
        return f"{self.owner.username} - {self.plan_name} ({self.days_left} Days Left)"


class Payment(models.Model):
    """
    Records every successful transaction via Razorpay.
    """
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    razorpay_order_id = models.CharField(max_length=100)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2) # In Rupees
    status = models.CharField(max_length=20, default='PENDING') # PENDING, SUCCESS, FAILED
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subscription.owner.username} - ₹{self.amount} - {self.status}"


class HotelSMTPSettings(models.Model):
    """
    Stores email credentials for each specific hotel owner.
    This allows 'Hotel A' to send emails from their own Gmail account.
    """
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='smtp_settings')
    email_host_user = models.EmailField(help_text="The Hotel's Gmail Address")
    email_host_password = models.CharField(max_length=100, help_text="The Gmail App Password")
    
    # We default to Gmail for simplicity, but you can add Host/Port fields later if needed
    email_host = models.CharField(max_length=100, default='smtp.gmail.com')
    email_port = models.IntegerField(default=587)

    def __str__(self):
        return f"SMTP Config for {self.owner.username}"