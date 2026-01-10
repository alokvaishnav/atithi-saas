import logging
from django.conf import settings
from .models import PlatformSettings, HotelSettings
from .utils import send_welcome_email, send_booking_email, send_whatsapp_message

# Try importing requests safely (matches utils.py dependency)
try:
    import requests
except ImportError:
    requests = None

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Centralized Service to handle System & Tenant Notifications.
    Separates the 'Trigger' logic (Views) from the 'Sending' logic (utils.py).
    """

    @staticmethod
    def notify_new_tenant(user, password):
        """
        Triggered when a new Hotel Owner registers.
        Sends:
        1. Welcome Email (Includes Hotel ID) -> Handled by utils.py
        2. Welcome WhatsApp (Includes Hotel ID) -> Handled locally here
        """
        try:
            # 1. Send Email (This uses the logic in utils.py which includes the Hotel ID)
            email_sent = send_welcome_email(user, password)
            if email_sent:
                logger.info(f"Welcome email sent to {user.email}")

            # 2. Send WhatsApp to Owner
            # We do this here explicitly to ensure the owner gets their credentials
            NotificationService.send_owner_whatsapp(user, password)

        except Exception as e:
            logger.error(f"Notification Service Error: {e}")

    @staticmethod
    def send_owner_whatsapp(user, password):
        """
        Sends the Hotel ID and Credentials to the Owner's WhatsApp.
        Uses Meta Cloud API (Consistent with utils.py).
        """
        if not requests:
            logger.warning("Requests library not installed. Skipping Owner WhatsApp.")
            return

        try:
            # Fetch Global Platform Config for WhatsApp API Credentials
            ps = PlatformSettings.objects.first()
            
            # Only proceed if Platform has WhatsApp configured
            if not ps or not ps.whatsapp_phone_id or not ps.whatsapp_token:
                logger.warning("Global WhatsApp not configured. Skipping owner alert.")
                return

            # Get User Phone
            # Priority: HotelSettings Phone -> User Phone
            phone = None
            if hasattr(user, 'hotel_settings') and user.hotel_settings.phone:
                phone = user.hotel_settings.phone
            elif user.phone_number:
                phone = user.phone_number

            if not phone:
                logger.warning(f"No phone number found for user {user.username}")
                return

            # 🟢 Get Hotel Code (Critical for Login)
            hotel_code = getattr(user, 'hotel_code', 'PENDING')

            # Construct Message
            message_body = (
                f"🎉 Welcome to {ps.app_name}!\n\n"
                f"Your Hotel Management System is ready.\n\n"
                f"🏨 *License ID:* {hotel_code} (Save this!)\n"
                f"👤 *User:* {user.username}\n"
                f"🔑 *Pass:* {password}\n\n"
                f"Login here: http://16.171.144.127/login"
            )

            # API Call to Meta
            url = f"https://graph.facebook.com/v19.0/{ps.whatsapp_phone_id}/messages"
            headers = {
                "Authorization": f"Bearer {ps.whatsapp_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "messaging_product": "whatsapp",
                "to": phone,
                "type": "text",
                "text": {"body": message_body}
            }

            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code in [200, 201]:
                logger.info(f"Welcome WhatsApp sent to {phone}")
            else:
                logger.error(f"Meta API Error: {response.text}")

        except Exception as e:
            logger.error(f"Failed to send Owner WhatsApp: {e}")

    @staticmethod
    def notify_guest_booking(booking):
        """
        Triggered when a Guest books via the Public Engine.
        Delegates to utils.py to ensure consistent templates are used.
        """
        try:
            # 1. Send Confirmation Email
            send_booking_email(booking, 'CONFIRMATION')
            
            # 2. Send WhatsApp
            send_whatsapp_message(booking, 'CONFIRMATION')
            
        except Exception as e:
            logger.error(f"Guest Notification Error: {e}")