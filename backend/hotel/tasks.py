from celery import shared_task
from django.core.mail import EmailMessage, get_connection
from django.conf import settings
from .models import Booking
from core.models import HotelSMTPSettings, HotelWhatsAppSettings # 👈 Import HotelWhatsAppSettings
from twilio.rest import Client

@shared_task
def send_booking_confirmation_email(booking_id):
    """
    Async task to send booking confirmation email via Hotel's SMTP.
    """
    try:
        booking = Booking.objects.get(id=booking_id)
        owner = booking.owner
        
        if not booking.guest.email:
            return "No Guest Email"

        # 1. Fetch SMTP Config
        smtp_config = HotelSMTPSettings.objects.filter(owner=owner).first()
        if not smtp_config:
            return "No SMTP Config"

        connection = get_connection(
            host=smtp_config.email_host,
            port=smtp_config.email_port,
            username=smtp_config.email_host_user,
            password=smtp_config.email_host_password,
            use_tls=True
        )

        # 2. Prepare Email
        hotel_name = owner.hotel_profile.hotel_name if hasattr(owner, 'hotel_profile') else 'Atithi Hotel'
        subject = f"Booking Confirmed - #{booking.id}"
        message = (
            f"Dear {booking.guest.full_name},\n\n"
            f"Your stay at {hotel_name} is confirmed.\n"
            f"Check-In: {booking.check_in_date.strftime('%d %b %Y')}\n\n"
            f"Thank you!"
        )

        email = EmailMessage(
            subject,
            message,
            smtp_config.email_host_user,
            [booking.guest.email],
            connection=connection
        )
        email.send()
        return "Email Sent"

    except Exception as e:
        return f"Email Failed: {e}"

@shared_task
def send_booking_whatsapp(booking_id):
    """
    Async task to send WhatsApp/SMS via HOTEL'S Twilio Credentials.
    """
    try:
        booking = Booking.objects.get(id=booking_id)
        owner = booking.owner

        # 1. Fetch Hotel's WhatsApp Config
        wa_config = HotelWhatsAppSettings.objects.filter(owner=owner).first()
        
        if not wa_config:
            return "Hotel WhatsApp Not Configured"

        # 2. Use Hotel's Credentials
        client = Client(wa_config.twilio_sid, wa_config.twilio_token)
        
        hotel_name = owner.hotel_profile.hotel_name if hasattr(owner, 'hotel_profile') else 'Atithi Hotel'
        
        msg_body = (
            f"🏨 Booking Confirmed!\n"
            f"Welcome to {hotel_name}.\n"
            f"Guest: {booking.guest.full_name}\n"
            f"Dates: {booking.check_in_date.strftime('%d/%m')} to {booking.check_out_date.strftime('%d/%m')}\n"
            f"See you soon!"
        )

        # 3. Format numbers correctly for Twilio WhatsApp
        # Ensure the 'from' number has 'whatsapp:' prefix
        from_number = wa_config.twilio_phone
        if not from_number.startswith('whatsapp:'):
            from_number = f"whatsapp:{from_number}"
            
        # Ensure the 'to' number has 'whatsapp:' prefix
        to_number = f"whatsapp:{booking.guest.phone}" 

        message = client.messages.create(
            from_=from_number,
            body=msg_body,
            to=to_number
        )
        return f"WhatsApp Sent: {message.sid}"

    except Exception as e:
        return f"WhatsApp Failed: {e}"