from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from icalendar import Calendar, Event
import datetime
import requests # Needed for WhatsApp API
import json

# --- EMAIL AUTOMATION ---
def send_booking_email(booking, email_type='CONFIRMATION'):
    """
    Sends automated emails to guests using the System's default SMTP.
    """
    try:
        # Access the hotel settings related to this booking's owner
        hotel_settings = booking.owner.hotel_settings
        guest_email = booking.guest.email
        
        if not guest_email:
            return False # No email to send to

        subject = ""
        message = ""
        
        if email_type == 'CONFIRMATION':
            subject = f"Booking Confirmed at {hotel_settings.hotel_name} - #{booking.id}"
            message = f"""
            Dear {booking.guest.full_name},

            Your booking is confirmed!
            
            Room: {booking.room.room_number if booking.room else 'Unassigned'}
            Check-in: {booking.check_in_date}
            Check-out: {booking.check_out_date}
            
            Total Amount: {hotel_settings.currency_symbol}{booking.total_amount}
            
            We look forward to hosting you.
            
            Regards,
            {hotel_settings.hotel_name}
            """
        
        # In a production SaaS, you would swap 'settings.EMAIL_HOST_USER' 
        # with the specific hotel's SMTP credentials if they provided them in Settings.
        # For now, we use the system default.
        
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER, 
            [guest_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        return False

# --- WHATSAPP AUTOMATION (NEW) ---
def send_whatsapp_message(booking, msg_type='CONFIRMATION'):
    """
    Sends WhatsApp notification using Meta Cloud API.
    """
    try:
        settings = booking.owner.hotel_settings
        
        # Check if WhatsApp is configured
        if not settings.whatsapp_phone_id or not settings.whatsapp_auth_token:
            return False
            
        guest_phone = booking.guest.phone
        if not guest_phone:
            return False
            
        # Meta API URL (v17.0 is a stable version)
        url = f"https://graph.facebook.com/v17.0/{settings.whatsapp_phone_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {settings.whatsapp_auth_token}",
            "Content-Type": "application/json"
        }
        
        # Construct Message Body
        text_body = ""
        if msg_type == 'CONFIRMATION':
            text_body = f"Hello {booking.guest.full_name}, your booking at {settings.hotel_name} is confirmed! Check-in: {booking.check_in_date}. See you soon!"
            
        # Payload for Meta API
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

# --- ICAL / CHANNEL MANAGER ---
def generate_ical_for_room(room):
    """
    Generates an iCalendar (.ics) string for a specific room containing all its bookings.
    Used by Airbnb/Booking.com to sync availability.
    """
    cal = Calendar()
    cal.add('prodid', f'-//{room.owner.username}//Atithi SaaS//EN')
    cal.add('version', '2.0')
    
    # Fetch all active bookings for this room
    bookings = room.bookings.exclude(status='CANCELLED')
    
    for booking in bookings:
        event = Event()
        event.add('summary', 'Booked') # Don't reveal guest name to OTA for privacy
        event.add('dtstart', booking.check_in_date)
        event.add('dtend', booking.check_out_date)
        event.add('dtstamp', datetime.datetime.now())
        event.add('uid', f'booking-{booking.id}@atithi.com')
        
        cal.add_component(event)
        
    return cal.to_ical()