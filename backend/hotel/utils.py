from django.core.mail import send_mail, get_connection
from django.conf import settings
from django.utils import timezone
from icalendar import Calendar, Event
import json

# Try importing requests safely (in case it's not installed in the environment yet)
try:
    import requests
except ImportError:
    requests = None

# --- 1. WELCOME EMAIL (New SaaS Registration) ---
def send_welcome_email(user, password):
    """
    Sends a welcome email to new Hotel Owners using the Global Platform SMTP.
    Uses the EDITABLE template from PlatformSettings.
    """
    try:
        # Import inside function to avoid circular import error with models.py
        from .models import PlatformSettings
        
        # 1. Fetch Global Config
        ps = PlatformSettings.objects.first()
        
        # fallback to defaults if no settings found
        smtp_host = ps.smtp_host if ps and ps.smtp_host else settings.EMAIL_HOST
        smtp_port = ps.smtp_port if ps and ps.smtp_port else settings.EMAIL_PORT
        smtp_user = ps.smtp_user if ps and ps.smtp_user else settings.EMAIL_HOST_USER
        smtp_password = ps.smtp_password if ps and ps.smtp_password else settings.EMAIL_HOST_PASSWORD
        
        from_email = ps.support_email if ps and ps.support_email else settings.DEFAULT_FROM_EMAIL

        # 2. Setup Connection
        connection = get_connection(
            host=smtp_host,
            port=int(smtp_port),
            username=smtp_user,
            password=smtp_password,
            use_tls=True
        )

        # 3. Dynamic Replacement (The Magic Part)
        # Default templates if DB is empty
        subject_tpl = ps.welcome_email_subject if ps else "Welcome to Atithi"
        body_tpl = ps.welcome_email_body if ps else "Your account is ready.\nUsername: {username}\nPassword: {password}"
        
        app_name = ps.app_name if ps else "Atithi SaaS"
        company_name = ps.company_name if ps else "Atithi Inc"

        context = {
            "{name}": user.first_name or user.username,
            "{username}": user.username,
            "{password}": password,
            "{app_name}": app_name,
            "{company_name}": company_name
        }

        subject = subject_tpl
        message = body_tpl

        for key, value in context.items():
            subject = subject.replace(key, str(value))
            message = message.replace(key, str(value))

        # 4. Send Email
        send_mail(
            subject,
            message,
            from_email, # From
            [user.email], # To
            connection=connection,
            fail_silently=False
        )
        print(f"✅ Welcome email sent to {user.email}")
        return True
    except Exception as e:
        print(f"❌ Welcome Email Failed: {e}")
        return False


# --- 2. BOOKING EMAIL AUTOMATION (Dynamic SMTP) ---
def send_booking_email(booking, email_type='CONFIRMATION'):
    """
    Sends automated emails to guests.
    Priority:
    1. Hotel's Custom SMTP (Tenant)
    2. Platform's Global SMTP (Super Admin/CEO)
    3. Django Default (settings.py)
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

        # Check Automation Toggles (Only applies if using Tenant Settings)
        if email_type == 'CONFIRMATION' and not conf.auto_send_confirmation:
            return False
        if email_type == 'INVOICE' and not conf.auto_send_invoice:
            return False

        # Construct Email Content
        subject = f"Booking {email_type.title()} - {conf.hotel_name} (#{booking.id})"
        room_info = f"Room {booking.room.room_number}" if booking.room else "Room Assigned on Arrival"
        
        # Customize intro text based on type
        intro_text = ""
        if email_type == 'CONFIRMATION':
            intro_text = f"Your booking at {conf.hotel_name} has been confirmed."
        elif email_type == 'INVOICE':
            intro_text = f"Thank you for staying at {conf.hotel_name}. Please find your invoice details below."
        else:
            intro_text = f"Your booking status is now: {email_type.title()}."

        message = f"""
Dear {booking.guest.full_name},

{intro_text}

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

        # Logic: Determine SMTP Connection
        connection = None
        sender_email = settings.DEFAULT_FROM_EMAIL # Default fallback

        # A. Try Hotel Custom SMTP (Tenant Level)
        if conf.smtp_server and conf.smtp_username and conf.smtp_password:
            try:
                connection = get_connection(
                    host=conf.smtp_server,
                    port=int(conf.smtp_port),
                    username=conf.smtp_username,
                    password=conf.smtp_password,
                    use_tls=True
                )
                sender_email = conf.email or conf.smtp_username
            except Exception as e:
                print(f"Hotel Custom SMTP Failed, attempting fallback: {e}")
                connection = None 

        # B. Try Platform Global SMTP (Platform Level) - FALLBACK
        if not connection:
            try:
                # Import inside function to avoid circular import error
                from .models import PlatformSettings
                ps = PlatformSettings.objects.first()
                
                if ps and ps.smtp_host and ps.smtp_user:
                    connection = get_connection(
                        host=ps.smtp_host,
                        port=int(ps.smtp_port),
                        username=ps.smtp_user,
                        password=ps.smtp_password,
                        use_tls=True
                    )
                    sender_email = ps.support_email or ps.smtp_user
            except Exception as e:
                print(f"Platform Global SMTP Failed: {e}")
                connection = None # Will fallback to settings.py default

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


# --- 3. WHATSAPP AUTOMATION (Meta Cloud API) ---
def send_whatsapp_message(booking, msg_type='CONFIRMATION'):
    """
    Sends WhatsApp notification using Meta Cloud API.
    Supports: 'CONFIRMATION', 'WELCOME'
    """
    if requests is None:
        print("❌ 'requests' library not installed. Cannot send WhatsApp.")
        return False

    try:
        if not hasattr(booking.owner, 'hotel_settings'):
            return False

        conf = booking.owner.hotel_settings
        
        # Check if WhatsApp is configured for Tenant
        if not conf.whatsapp_phone_id or not conf.whatsapp_auth_token:
            # Future: You could add a fallback to Platform Global WhatsApp here
            return False
            
        guest_phone = booking.guest.phone
        if not guest_phone:
            return False
            
        # Meta API URL (Using v19.0 for stability)
        url = f"https://graph.facebook.com/v19.0/{conf.whatsapp_phone_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {conf.whatsapp_auth_token}",
            "Content-Type": "application/json"
        }
        
        # Construct Message Body based on Type
        text_body = ""
        
        if msg_type == 'CONFIRMATION':
            text_body = f"Hello {booking.guest.full_name}, your booking at {conf.hotel_name} is confirmed! Check-in: {booking.check_in_date}. See you soon!"
        
        elif msg_type == 'WELCOME':
            text_body = f"Welcome to {conf.hotel_name}! We are delighted to have you check in. If you need any assistance during your stay, please let us know. Enjoy your stay!"
        
        else:
            # Fallback for unknown types
            text_body = f"Update regarding your booking at {conf.hotel_name}. Status: {msg_type}."

        # Payload
        payload = {
            "messaging_product": "whatsapp",
            "to": guest_phone,
            "type": "text",
            "text": { "body": text_body }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code in [200, 201]:
            return True
        else:
            print(f"WhatsApp API Error: {response.text}")
            return False
        
    except Exception as e:
        print(f"WhatsApp Error: {e}")
        return False


# --- 4. CHANNEL MANAGER (iCal Generator) ---
def generate_ical_for_room(room):
    """
    Generates an iCalendar (.ics) string for a specific room.
    OTAs like Airbnb/Booking.com read this to block dates.
    """
    cal = Calendar()
    cal.add('prodid', f'-//Atithi SaaS//{room.room_number}//EN')
    cal.add('version', '2.0')

    # Get all active bookings
    # Note: 'bookings' is the related_name defined in models.py for Room
    active_bookings = room.bookings.exclude(status='CANCELLED')

    for booking in active_bookings:
        event = Event()
        # We use 'Booked' as summary to protect guest privacy in the public feed
        event.add('summary', 'Booked') 
        event.add('dtstart', booking.check_in_date)
        # iCal end dates are exclusive, so it covers the night
        event.add('dtend', booking.check_out_date) 
        event.add('dtstamp', timezone.now())
        # Unique ID for the calendar event
        event.add('uid', f'{booking.id}@atithi.live')
        
        cal.add_component(event)

    return cal.to_ical()