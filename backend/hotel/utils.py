from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from icalendar import Calendar, Event
import datetime

# --- EMAIL AUTOMATION ---
def send_booking_email(booking, email_type='CONFIRMATION'):
    """
    Sends automated emails to guests using the Hotel's specific SMTP settings (if configured)
    or the System's default SMTP.
    """
    try:
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
        
        # Logic to swap SMTP backend dynamically if user has custom SMTP would go here.
        # For MVP, we use the system default defined in settings.py
        
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER, # From System
            [guest_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Email Error: {e}")
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