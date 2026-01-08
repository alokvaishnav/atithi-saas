# backend/hotel/notifications.py

import logging
from django.core.mail import send_mail
from django.conf import settings
from .models import PlatformSettings, HotelSettings

# Try importing Twilio (We will install this package next)
try:
    from twilio.rest import Client
except ImportError:
    Client = None

logger = logging.getLogger(__name__)

class NotificationService:
    
    @staticmethod
    def get_platform_config():
        return PlatformSettings.objects.first()

    @staticmethod
    def send_whatsapp(to_number, body):
        """
        Sends WhatsApp message using Global Platform Credentials (Twilio).
        """
        config = NotificationService.get_platform_config()
        if not config or not config.twilio_account_sid:
            logger.warning("Twilio not configured.")
            return False

        if not Client:
            logger.error("Twilio library not installed.")
            return False

        try:
            client = Client(config.twilio_account_sid, config.twilio_auth_token)
            message = client.messages.create(
                from_=f"whatsapp:{config.twilio_whatsapp_number}",
                body=body,
                to=f"whatsapp:{to_number}"
            )
            return message.sid
        except Exception as e:
            logger.error(f"WhatsApp Failed: {e}")
            return False

    @staticmethod
    def send_email(subject, body, to_email):
        """
        Sends Email using Django's SMTP backend.
        """
        try:
            send_mail(
                subject,
                body,
                settings.DEFAULT_FROM_EMAIL,
                [to_email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Email Failed: {e}")
            return False

    # --- SCENARIO 1: CEO -> HOTEL OWNER ---
    @staticmethod
    def notify_new_tenant(user, password):
        config = NotificationService.get_platform_config()
        
        # 1. Prepare Message
        context = {
            "name": user.first_name,
            "hotel": user.hotel_settings.hotel_name if hasattr(user, 'hotel_settings') else "Your Hotel",
            "username": user.username,
            "password": password,
            "url": "http://16.171.144.127/login"
        }
        
        # Format the default template
        msg_body = config.welcome_email_body.format(**context)
        subject = config.welcome_email_subject

        # 2. Send Email
        NotificationService.send_email(subject, msg_body, user.email)

        # 3. Send WhatsApp (if phone exists)
        # Assuming you added a 'phone' field to CustomUser or profile
        # NotificationService.send_whatsapp(user.phone, msg_body)

    # --- SCENARIO 2: HOTEL OWNER -> GUEST ---
    @staticmethod
    def notify_guest_booking(booking):
        owner_settings = HotelSettings.objects.get(owner=booking.owner)
        
        # 1. Prepare Message (Customizable by Owner)
        context = {
            "guest_name": booking.guest.full_name,
            "hotel_name": owner_settings.hotel_name,
            "room_type": booking.room.room_type,
            "check_in": booking.check_in_date,
            "amount": booking.total_amount
        }
        
        # Use the Owner's custom template
        try:
            msg_body = owner_settings.guest_welcome_template.format(**context)
        except KeyError:
            # Fallback if template has invalid keys
            msg_body = f"Booking Confirmed at {owner_settings.hotel_name} for {booking.check_in_date}."

        # 2. Send WhatsApp (if enabled by Owner)
        if owner_settings.enable_whatsapp_alerts and booking.guest.phone:
            NotificationService.send_whatsapp(booking.guest.phone, msg_body)

        # 3. Send Email (if enabled by Owner)
        if owner_settings.enable_email_alerts and booking.guest.email:
            NotificationService.send_email(f"Booking Confirmation - {owner_settings.hotel_name}", msg_body, booking.guest.email)