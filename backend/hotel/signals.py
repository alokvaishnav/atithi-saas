from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Booking
from .utils import send_whatsapp_message, send_booking_email

@receiver(pre_save, sender=Booking)
def track_status_change(sender, instance, **kwargs):
    """
    Check if status is changing to CHECKED_IN or CHECKED_OUT
    """
    if instance.id:
        try:
            old_instance = Booking.objects.get(pk=instance.id)
            instance._old_status = old_instance.status
        except Booking.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Booking)
def trigger_booking_automation(sender, instance, created, **kwargs):
    """
    Trigger WhatsApp/Email based on status changes.
    """
    # 1. STATUS CHANGED TO CHECKED_IN (Welcome Message)
    if hasattr(instance, '_old_status') and instance._old_status != 'CHECKED_IN' and instance.status == 'CHECKED_IN':
        try:
            # Send WhatsApp Welcome
            print(f"🔄 Triggering Welcome Message for Booking #{instance.id}...")
            success = send_whatsapp_message(instance, 'CONFIRMATION') 
            if success:
                print(f"✅ WhatsApp Sent Successfully!")
            else:
                print(f"⚠️ WhatsApp Failed (Check Settings/Logs)")
        except Exception as e:
            print(f"❌ Automation Error: {e}")

    # 2. STATUS CHANGED TO CHECKED_OUT (Optional: Invoice Logic)
    if hasattr(instance, '_old_status') and instance._old_status != 'CHECKED_OUT' and instance.status == 'CHECKED_OUT':
        # Future: Send Invoice Email here
        pass