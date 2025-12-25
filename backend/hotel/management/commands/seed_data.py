import random
from django.core.management.base import BaseCommand
from hotel.models import Room, Guest, Booking, Expense
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.conf import settings # 👈 Import settings

User = get_user_model()

class Command(BaseCommand):
    help = 'Stress test: Auto-generates Rooms, Guests, Bookings, and Expenses'

    def handle(self, *args, **kwargs):
        self.stdout.write("🌱 Starting Data Seeding...")

        # 🛑 CRITICAL FIX: Disable actual email sending to prevent Timeouts
        # This tells Django to "pretend" to send emails without connecting to Gmail
        settings.EMAIL_BACKEND = 'django.core.mail.backends.dummy.EmailBackend'

        # 0. Get or Create a System User (REQUIRED for 'created_by')
        system_user = User.objects.first()
        if not system_user:
            self.stdout.write("... Creating System Admin User")
            system_user = User.objects.create_superuser(
                username='system_admin',
                email='admin@hotel.com',
                password='admin_password_123'
            )

        # 1. Create Dummy Rooms if none exist
        if Room.objects.count() == 0:
            self.stdout.write("... Creating 10 Deluxe Rooms")
            room_types = ['SINGLE', 'DOUBLE', 'SUITE']
            for i in range(101, 111):
                Room.objects.create(
                    room_number=str(i),
                    room_type=random.choice(room_types),
                    price_per_night=random.randint(2000, 5000),
                    status='AVAILABLE'
                )
        
        # 2. Create Dummy Guests if none exist
        if Guest.objects.count() == 0:
            self.stdout.write("... Creating 5 VIP Guests")
            names = ["Amit Sharma", "Priya Verma", "Rahul Singh", "Sneha Gupta", "Vikram Malhotra"]
            for name in names:
                Guest.objects.create(
                    full_name=name,
                    phone=f"98765{random.randint(10000, 99999)}",
                    email=f"{name.split()[0].lower()}@example.com",
                    id_proof_number=f"ABCD{random.randint(1000,9999)}F"
                )

        # Re-fetch lists
        rooms = list(Room.objects.all())
        guests = list(Guest.objects.all())

        # 3. Create 50 Bookings
        self.stdout.write("... Generating 50 Bookings (Emails Disabled)")
        for i in range(50):
            Booking.objects.create(
                guest=random.choice(guests),
                room=random.choice(rooms),
                check_in_date=timezone.now() - timedelta(days=random.randint(1, 30)),
                check_out_date=timezone.now() + timedelta(days=random.randint(1, 5)),
                status=random.choice(['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT']),
                advance_paid=random.randint(500, 2000),
                created_by=system_user
            )

        # 4. Create 20 Expenses
        self.stdout.write("... Generating 20 Expenses")
        categories = ['UTILITY', 'SALARY', 'INVENTORY', 'MAINTENANCE']
        for i in range(20):
            Expense.objects.create(
                title=f"Vendor Payment #{i}",
                category=random.choice(categories),
                amount=random.randint(1000, 15000),
                date=timezone.now().date(),
                paid_by=system_user
            )
        
        self.stdout.write(self.style.SUCCESS("✅ Successfully seeded live database!"))
        