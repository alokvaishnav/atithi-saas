from django.core.mail import send_mail, get_connection
from django.conf import settings
from icalendar import Calendar, Event
from datetime import datetime
import requests # Needed for WhatsApp API
import json

# --- 1. EMAIL AUTOMATION (Dynamic SMTP) ---
def send_booking_email(booking, email_type='CONFIRMATION'):
    """
    Sends automated emails to guests.
    Tries to use the Hotel's custom SMTP settings first.
    """
    try:
        # Access the hotel settings related to this booking's owner
        owner = booking.owner
        if hasattr(owner, 'hotel_settings'):
            conf = owner.hotel_settings
        else:
            print("No HotelSettings found.")
            return False

        guest_email = booking.guest.email
        if not guest_email:
            return False 

        # Check Automation Toggles
        if email_type == 'CONFIRMATION' and not conf.auto_send_confirmation:
            return False
        if email_type == 'INVOICE' and not conf.auto_send_invoice:
            return False

        # Construct Email Content
        subject = f"Booking {email_type.title()} - {conf.hotel_name} (#{booking.id})"
        room_info = f"Room {booking.room.room_number}" if booking.room else "Room Assigned on Arrival"
        
        message = f"""
        Dear {booking.guest.full_name},

        Your booking at {conf.hotel_name} has been {email_type.lower()}.

        --- Reservation Details ---
        Booking ID: #{booking.id}
        {room_info}
        Check-in: {booking.check_in_date}
        Check-out: {booking.check_out_date}
        Total Amount: {conf.currency_symbol}{booking.total_amount}

        --- Hotel Contact ---
        Address: {conf.address}
        Phone: {conf.phone}
        Website: {conf.website}

        We look forward to hosting you!
        """

        # Logic: Use Custom SMTP if available, else System Default
        connection = None
        sender_email = settings.EMAIL_HOST_USER

        if conf.smtp_server and conf.smtp_username and conf.smtp_password:
            try:
                connection = get_connection(
                    host=conf.smtp_server,
                    port=int(conf.smtp_port),
                    username=conf.smtp_username,
                    password=conf.smtp_password,
                    use_tls=True
                )
                sender_email = conf.smtp_username
            except Exception as e:
                print(f"Custom SMTP Failed, reverting to default: {e}")
                connection = None # Fallback to default

        # Send Mail
        send_mail(
            subject,
            message,
            sender_email, 
            [guest_email],
            connection=connection,
            fail_silently=False,
        )
        return True

    except Exception as e:
        print(f"Email Error: {e}")
        return False


# --- 2. WHATSAPP AUTOMATION (Meta Cloud API) ---
def send_whatsapp_message(booking, msg_type='CONFIRMATION'):
    """
    Sends WhatsApp notification using Meta Cloud API.
    """
    try:
        conf = booking.owner.hotel_settings
        
        # Check if WhatsApp is configured
        if not conf.whatsapp_phone_id or not conf.whatsapp_auth_token:
            return False
            
        guest_phone = booking.guest.phone
        if not guest_phone:
            return False
            
        # Meta API URL (v17.0 is stable)
        url = f"https://graph.facebook.com/v17.0/{conf.whatsapp_phone_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {conf.whatsapp_auth_token}",
            "Content-Type": "application/json"
        }
        
        # Construct Message Body
        text_body = ""
        if msg_type == 'CONFIRMATION':
            text_body = f"Hello {booking.guest.full_name}, your booking at {conf.hotel_name} is confirmed! Check-in: {booking.check_in_date}. See you soon!"
        
        # Payload
        payload = {
            "messaging_product": "whatsapp",
            "to": guest_phone,
            "type": "text",
            "text": { "body": text_body }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            return True
        else:
            print(f"WhatsApp API Error: {response.text}")
            return False
        
    except Exception as e:
        print(f"WhatsApp Error: {e}")
        return False


# --- 3. CHANNEL MANAGER (iCal Generator) ---
def generate_ical_for_room(room):
    """
    Generates an iCalendar (.ics) string for a specific room.
    OTAs like Airbnb/Booking.com read this to block dates.
    """
    cal = Calendar()
    cal.add('prodid', f'-//Atithi SaaS//{room.room_number}//EN')
    cal.add('version', '2.0')

    # Get all active bookings
    bookings = room.bookings.exclude(status='CANCELLED')

    for booking in bookings:
        event = Event()
        # We use 'Booked' as summary to protect guest privacy in the public feed
        event.add('summary', 'Booked') 
        event.add('dtstart', booking.check_in_date)
        event.add('dtend', booking.check_out_date)
        event.add('dtstamp', datetime.now())
        event.add('uid', f'{booking.id}@atithi.live')
        
        cal.add_component(event)

    return cal.to_ical()