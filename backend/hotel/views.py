from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Room, Booking, HotelSettings, Guest
from .serializers import RoomSerializer, BookingSerializer, GuestSerializer
from core.models import CustomUser

from .models import InventoryItem, Expense, MenuItem, Order, HousekeepingTask
from .serializers import InventorySerializer, ExpenseSerializer, MenuItemSerializer, OrderSerializer, HousekeepingTaskSerializer

class CustomTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        data['role'] = self.user.role
        data['id'] = self.user.id
        data['is_superuser'] = self.user.is_superuser
        try: data['hotel_name'] = self.user.hotel_settings.hotel_name
        except: data['hotel_name'] = 'Atithi HMS'
        return data

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        data = request.data
        try:
            if CustomUser.objects.filter(username=data['username']).exists():
                return Response({'error': 'Username already exists'}, status=400)
            user = CustomUser.objects.create_user(username=data['username'], email=data['email'], password=data['password'], role='OWNER')
            HotelSettings.objects.create(owner=user, hotel_name=data['hotel_name'])
            return Response({'status': 'Success'})
        except Exception as e: return Response({'error': str(e)}, status=400)

class BaseSaaSViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return self.queryset.filter(owner=self.request.user)
    def perform_create(self, serializer): serializer.save(owner=self.request.user)

class RoomViewSet(BaseSaaSViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class BookingViewSet(BaseSaaSViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

class GuestViewSet(BaseSaaSViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer

class InventoryViewSet(BaseSaaSViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventorySerializer

class ExpenseViewSet(BaseSaaSViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class MenuItemViewSet(BaseSaaSViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer

class OrderViewSet(BaseSaaSViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class HousekeepingViewSet(BaseSaaSViewSet):
    queryset = HousekeepingTask.objects.all()
    serializer_class = HousekeepingTaskSerializer