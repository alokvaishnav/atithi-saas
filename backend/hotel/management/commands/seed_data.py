import random
from django.core.management.base import BaseCommand
from hotel.models import Room, Guest, Booking, Expense
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Stress test: Generate 50 bookings and 20 expenses'

    def handle(self, *args, **kwargs):
        rooms = list(Room.objects.all())
        guests = list(Guest.objects.all())
        
        if not rooms or not guests:
            self.stdout.write("Error: Add rooms and guests first.")
            return

        for i in range(50):
            Booking.objects.create(
                guest=random.choice(guests),
                room=random.choice(rooms),
                check_in_date=timezone.now() - timedelta(days=random.randint(1, 30)),
                check_out_date=timezone.now() + timedelta(days=random.randint(1, 5)),
                status='CONFIRMED',
                advance_paid=random.randint(500, 2000)
            )

        categories = ['UTILITY', 'SALARY', 'INVENTORY', 'MAINTENANCE']
        for i in range(20):
            Expense.objects.create(
                title=f"Stress Test Bill #{i}",
                category=random.choice(categories),
                amount=random.randint(1000, 15000),
                date=timezone.now().date()
            )
        
        self.stdout.write(self.style.SUCCESS("Successfully seeded 70 records!"))