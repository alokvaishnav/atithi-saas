from rest_framework import viewsets
from rest_framework.permissions import AllowAny # 👈 Key import
from .models import Room, Guest, Booking
from .serializers import RoomSerializer, GuestSerializer, BookingSerializer
from core.models import User # Imported for fallback assignment

class BaseSaaSViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet that filters data by the current user's Hotel Owner.
    """
    # 🔓 UNLOCKED FOR TESTING (Change back to IsAuthenticated later)
    permission_classes = [AllowAny] 

    def get_queryset(self):
        # ⚠️ CRITICAL FIX:
        # Since we are AllowAny, the user might be Anonymous.
        # Anonymous users don't have 'hotel_owner', so we can't filter.
        # For testing, we just return ALL data.
        return self.model.objects.all()

    def perform_create(self, serializer):
        # ⚠️ CRITICAL FIX: 
        # When creating a room via API without login, we need an owner.
        if self.request.user.is_authenticated:
            user = self.request.user
            owner = user.hotel_owner if user.hotel_owner else user
            serializer.save(owner=owner)
        else:
            # Fallback for testing: Assign to the first Superuser found
            admin_user = User.objects.filter(is_superuser=True).first()
            if admin_user:
                serializer.save(owner=admin_user)
            else:
                # Safety valve
                raise Exception("Cannot create room: No Superuser found to assign ownership to.")

# --- Actual ViewSets ---

class RoomViewSet(BaseSaaSViewSet):
    model = Room
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class GuestViewSet(BaseSaaSViewSet):
    model = Guest
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer

class BookingViewSet(BaseSaaSViewSet):
    model = Booking
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer