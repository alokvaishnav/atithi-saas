from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from datetime import datetime, timedelta
from django.db.models import Sum, Count

from .models import Room, Booking, HotelSettings, Guest, InventoryItem, Expense, MenuItem, Order, HousekeepingTask, ActivityLog
from .serializers import (
    RoomSerializer, BookingSerializer, GuestSerializer, InventorySerializer, 
    ExpenseSerializer, MenuItemSerializer, OrderSerializer, HousekeepingTaskSerializer,
    ActivityLogSerializer, StaffSerializer, HotelSettingsSerializer
)
from core.models import CustomUser

# --- LOGIN & AUTH ---
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

# --- BASE SAAS VIEWSET ---
class BaseSaaSViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return self.queryset.filter(owner=self.request.user)
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# --- CORE VIEWSETS ---
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

class ActivityLogViewSet(BaseSaaSViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer

# --- STAFF MANAGEMENT ---
class StaffViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StaffSerializer
    
    def get_queryset(self):
        # Show staff belonging to this owner
        return CustomUser.objects.filter(hotel_owner=self.request.user)

class StaffRegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        data = request.data
        try:
            user = CustomUser.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                role=data['role'],
                hotel_owner=request.user # Link to Owner
            )
            return Response({'status': 'Staff Created'})
        except Exception as e: return Response({'error': str(e)}, status=400)

# --- SETTINGS & ANALYTICS ---
class SettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        settings, _ = HotelSettings.objects.get_or_create(owner=request.user)
        return Response(HotelSettingsSerializer(settings).data)
    def patch(self, request):
        settings, _ = HotelSettings.objects.get_or_create(owner=request.user)
        serializer = HotelSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        owner = request.user
        total_revenue = Booking.objects.filter(owner=owner).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        active_bookings = Booking.objects.filter(owner=owner, status='CONFIRMED').count()
        rooms_available = Room.objects.filter(owner=owner, status='AVAILABLE').count()
        total_guests = Guest.objects.filter(owner=owner).count()
        
        return Response({
            'revenue': total_revenue,
            'active_bookings': active_bookings,
            'rooms_available': rooms_available,
            'total_guests': total_guests
        })

# --- LICENSE MOCKS ---
class LicenseStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({'status': 'ACTIVE', 'days_left': 365, 'is_expired': False})

class LicenseActivateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return Response({'status': 'ACTIVE'})