from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Booking, HotelSettings

# Get the User model dynamically
User = get_user_model()

# NOTE: We do NOT import utils at the top level here to prevent "Circular Import" crashes.

# ==============================================================================
# 1. MULTI-TENANT IDENTITY SIGNALS (CRITICAL FOR LOGIN)
# ==============================================================================

@receiver(post_save, sender=User)
def create_hotel_settings(sender, instance, created, **kwargs):
    """
    1. If a new OWNER is created (e.g., via Admin Panel), ensure they have HotelSettings.
    2. If the User has a HotelSettings but no hotel_code on the User model, sync it.
    """
    if instance.role == 'OWNER':
        # Get or Create prevents crashing if the RegisterView already created settings
        settings, created_settings = HotelSettings.objects.get_or_create(
            owner=instance,
            defaults={'hotel_name': f"{instance.username}'s Hotel"}
        )
        
        # Sync the Hotel Code to the User if it's missing on the User model
        if settings.hotel_code and instance.hotel_code != settings.hotel_code:
            instance.hotel_code = settings.hotel_code
            instance.save(update_fields=['hotel_code'])

@receiver(post_save, sender=HotelSettings)
def sync_hotel_code_to_user(sender, instance, created, **kwargs):
    """
    Whenever HotelSettings is saved (and an ID is generated), 
    ensure the Owner User has the correct Hotel ID saved on their profile.
    This enables the "Triple Auth" (Hotel ID + User + Pass).
    """
    if instance.owner and instance.hotel_code:
        # Only update if they don't match, to prevent infinite save loops
        if instance.owner.hotel_code != instance.hotel_code:
            instance.owner.hotel_code = instance.hotel_code
            instance.owner.save(update_fields=['hotel_code'])

# 🟢 NEW: Critical for Admin Panel usage
@receiver(pre_save, sender=User)
def sync_staff_hotel_code(sender, instance, **kwargs):
    """
    Ensures that whenever a STAFF member is saved (even via Admin Panel),
    they automatically inherit the correct Hotel ID from their Boss (hotel_owner).
    """
    # If the user has a boss (hotel_owner) assigned
    if instance.hotel_owner:
        # And the boss has a valid hotel_code
        if instance.hotel_owner.hotel_code:
            # Force the staff member to inherit the same code
            instance.hotel_code = instance.hotel_owner.hotel_code

# ==============================================================================
# 2. BOOKING AUTOMATION SIGNALS
# ==============================================================================

@receiver(pre_save, sender=Booking)
def track_status_and_timestamps(sender, instance, **kwargs):
    """
    1. Tracks if status is changing (to trigger automation later).
    2. Automatically sets 'checked_in_at' and 'checked_out_at' timestamps.
    """
    if instance.id:
        try:
            old_instance = Booking.objects.get(pk=instance.id)
            instance._old_status = old_instance.status
        except Booking.DoesNotExist:
            instance._old_status = None
    else:
        # This is a new object
        instance._old_status = None

    # --- AUTO-TIMESTAMP LOGIC ---
    # If transitioning TO Checked In (and timestamp isn't set yet)
    if instance.status == 'CHECKED_IN' and instance._old_status != 'CHECKED_IN':
        if not instance.checked_in_at:
            instance.checked_in_at = timezone.now()

    # If transitioning TO Checked Out
    if instance.status == 'CHECKED_OUT' and instance._old_status != 'CHECKED_OUT':
        if not instance.checked_out_at:
            instance.checked_out_at = timezone.now()

@receiver(post_save, sender=Booking)
def trigger_booking_automation(sender, instance, created, **kwargs):
    """
    Trigger WhatsApp/Email and update Room Status based on Booking Status changes.
    """
    
    # --- LAZY IMPORT (Safe) ---
    try:
        from .utils import send_whatsapp_message, send_booking_email
    except ImportError:
        print("⚠️ Warning: utils.py functions could not be imported in signals.")
        return

    # Guard clause: Ensure pre_save ran
    if not hasattr(instance, '_old_status'):
        return

    # === 1. NEW BOOKING OR STATUS -> CONFIRMED ===
    # Handles when a booking is created or changed from Pending -> Confirmed
    if instance.status == 'CONFIRMED' and (created or instance._old_status != 'CONFIRMED'):
        
        print(f"🆕 Booking Confirmed: #{instance.id}")

        # A. Send Confirmation WhatsApp (When they actually book)
        try:
            if hasattr(instance.owner, 'hotel_settings'):
                print(f"   -> Sending WhatsApp Confirmation...")
                # Ensure you have a 'CONFIRMATION' template in your utils
                send_whatsapp_message(instance, 'CONFIRMATION')
        except Exception as e:
            print(f"   ❌ WhatsApp Error: {e}")

    # === 2. STATUS CHANGED TO CHECKED_IN ===
    elif instance.status == 'CHECKED_IN' and instance._old_status != 'CHECKED_IN':
        
        print(f"🔄 Processing Check-In for Booking #{instance.id}...")

        # A. Update Room Status to OCCUPIED
        if instance.room:
            print(f"   -> Marking Room {instance.room.room_number} as OCCUPIED")
            instance.room.status = 'OCCUPIED'
            instance.room.save()

        # B. Send WhatsApp Welcome Message (When they arrive)
        try:
            if hasattr(instance.owner, 'hotel_settings'):
                print(f"   -> Sending WhatsApp Welcome...")
                send_whatsapp_message(instance, 'WELCOME')
        except Exception as e:
            print(f"   ❌ WhatsApp Error: {e}")

    # === 3. STATUS CHANGED TO CHECKED_OUT ===
    elif instance.status == 'CHECKED_OUT' and instance._old_status != 'CHECKED_OUT':
        
        print(f"🔄 Processing Check-Out for Booking #{instance.id}...")

        # A. Update Room Status to DIRTY (Needs Housekeeping)
        if instance.room:
            print(f"   -> Marking Room {instance.room.room_number} as DIRTY")
            instance.room.status = 'DIRTY'
            instance.room.save()

        # B. Send Invoice Email (If enabled in settings)
        try:
            settings = getattr(instance.owner, 'hotel_settings', None)
            if settings and settings.auto_send_invoice:
                print(f"   -> Sending Invoice Email...")
                send_booking_email(instance, 'INVOICE')
                print(f"   ✅ Invoice Email Triggered")
        except Exception as e:
            print(f"   ❌ Email Error: {e}")

    # === 4. STATUS CHANGED TO CANCELLED ===
    elif instance.status == 'CANCELLED' and instance._old_status != 'CANCELLED':
        
        print(f"🚫 Processing Cancellation for Booking #{instance.id}...")

        # A. Free up the Room (Make AVAILABLE)
        if instance.room:
            print(f"   -> Releasing Room {instance.room.room_number} to AVAILABLE")
            instance.room.status = 'AVAILABLE'
            instance.room.save()