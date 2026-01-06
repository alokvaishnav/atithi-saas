from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Booking

# NOTE: We do NOT import utils at the top level here.
# This prevents the "Circular Import" crash because utils.py imports models too.

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
                # Note: Changed 'CONFIRMATION' to 'WELCOME' for better logic. 
                # If you don't have a 'WELCOME' template, change this back to 'CONFIRMATION'.
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