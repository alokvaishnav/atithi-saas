from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from datetime import timedelta
from django.utils import timezone
from .models import *
from .serializers import *
from core.models import User

# --- Base Class to Isolate Data per Hotel ---
class BaseSaaSViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        owner = user.hotel_owner if user.hotel_owner else user
        return self.model.objects.filter(owner=owner)

    def perform_create(self, serializer):
        user = self.request.user
        owner = user.hotel_owner if user.hotel_owner else user
        serializer.save(owner=owner)

# --- Standard ViewSets ---

class RoomViewSet(BaseSaaSViewSet):
    model = Room
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    @action(detail=True, methods=['post'], url_path='mark-clean')
    def mark_clean(self, request, pk=None):
        room = self.get_object()
        room.status = 'AVAILABLE'
        room.save()
        return Response({'status': 'Room marked clean'})

class GuestViewSet(BaseSaaSViewSet):
    model = Guest
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer

class ServiceViewSet(BaseSaaSViewSet):
    model = Service
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class InventoryViewSet(BaseSaaSViewSet):
    model = InventoryItem
    queryset = InventoryItem.objects.all()
    serializer_class = InventorySerializer

    @action(detail=True, methods=['post'], url_path='update_stock')
    def update_stock(self, request, pk=None):
        item = self.get_object()
        change = int(request.data.get('change', 0))
        item.current_stock += change
        item.save()
        return Response({'status': 'Stock Updated', 'new_stock': item.current_stock})

class ExpenseViewSet(BaseSaaSViewSet):
    model = Expense
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class HousekeepingViewSet(BaseSaaSViewSet):
    model = HousekeepingTask
    queryset = HousekeepingTask.objects.all()
    serializer_class = HousekeepingSerializer

class StaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StaffSerializer

    def get_queryset(self):
        user = self.request.user
        owner = user.hotel_owner if user.hotel_owner else user
        return User.objects.filter(hotel_owner=owner)

class SettingsViewSet(BaseSaaSViewSet):
    model = HotelSettings
    queryset = HotelSettings.objects.all()
    serializer_class = HotelSettingsSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            user = self.request.user
            owner = user.hotel_owner if user.hotel_owner else user
            HotelSettings.objects.create(owner=owner, hotel_name="Atithi Hotel")
            queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class BookingViewSet(BaseSaaSViewSet):
    model = Booking
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    def perform_create(self, serializer):
        super().perform_create(serializer)
        # Auto-set room to occupied
        room = serializer.validated_data['room']
        room.status = 'OCCUPIED'
        room.save()

    @action(detail=True, methods=['post'], url_path='add_payment')
    def add_payment(self, request, pk=None):
        booking = self.get_object()
        amount = float(request.data.get('amount', 0))
        mode = request.data.get('mode', 'CASH')
        BookingPayment.objects.create(booking=booking, amount=amount, mode=mode)
        
        # Update totals
        total_paid = booking.payments.aggregate(Sum('amount'))['amount__sum'] or 0
        booking.amount_paid = total_paid
        booking.payment_status = 'PAID' if total_paid >= booking.total_amount else 'PARTIAL'
        booking.save()
        
        return Response({'status': 'Payment Added'})

    @action(detail=True, methods=['post'], url_path='add_charge')
    def add_charge(self, request, pk=None):
        booking = self.get_object()
        desc = request.data.get('description')
        amount = float(request.data.get('amount', 0))
        BookingCharge.objects.create(booking=booking, description=desc, amount=amount)
        return Response({'status': 'Charge Added'})

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        booking = self.get_object()
        booking.status = 'CHECKED_OUT'
        booking.is_checked_out = True
        booking.check_out_date = timezone.now().date()
        booking.save()
        
        booking.room.status = 'DIRTY'
        booking.room.save()
        return Response({'status': 'Checked Out'})
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny], url_path='public_folio')
    def public_folio(self, request, pk=None):
        booking = Booking.objects.get(pk=pk)
        serializer = BookingSerializer(booking)
        return Response(serializer.data)

# --- SPECIAL LOGIC VIEWS ---

class AnalyticsView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        owner = user.hotel_owner if user.hotel_owner else user
        
        bookings = Booking.objects.filter(owner=owner)
        expenses = Expense.objects.filter(owner=owner)
        
        total_rev = bookings.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_exp = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        net_profit = total_rev - total_exp
        
        # 7-Day Trend
        trend = []
        for i in range(6, -1, -1):
            day = timezone.now().date() - timedelta(days=i)
            day_rev = bookings.filter(created_at__date=day).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            trend.append({'date': str(day), 'daily_revenue': day_rev})
            
        return Response({
            'financials': {
                'total_rev': total_rev,
                'total_expenses': total_exp,
                'net_profit': net_profit,
                'total_advance': 0
            },
            'trend': trend
        })

class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        data = request.data
        try:
            if User.objects.filter(username=data['username']).exists():
                return Response({'error': 'Username already exists'}, status=400)
                
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                role='OWNER'
            )
            HotelSettings.objects.create(owner=user, hotel_name=data.get('hotel_name', 'My Hotel'))
            return Response({'status': 'User created'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class POSChargeView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Securely charge items to a room.
        Expects:
        {
            "room_id": 123,
            "items": [
                { "service_id": 5, "description": "Burger" },
                { "service_id": 8, "description": "Coke" }
            ]
        }
        """
        room_id = request.data.get('room_id')
        items = request.data.get('items', []) # List of {service_id, description}

        # 1. Identify Owner
        user = request.user
        owner = user.hotel_owner if user.hotel_owner else user

        # 2. Find the Room belongs to this owner
        room = get_object_or_404(Room, id=room_id, owner=owner)

        # 3. Find Active Booking
        # Priority 1: Status is 'CHECKED_IN'
        booking = Booking.objects.filter(room=room, status='CHECKED_IN').last()
        
        # Priority 2: Fallback if they forgot to update status but didn't checkout
        if not booking:
            booking = Booking.objects.filter(room=room, is_checked_out=False).last()
            
        if not booking:
            return Response({'error': 'No active guest found in this room! Check if the room is occupied.'}, status=400)

        total_charged = 0
        charged_items = []

        # 4. Process Items Securely
        for item in items:
            service_id = item.get('service_id')
            description = item.get('description', 'POS Item')

            if service_id:
                # Secure Lookup: Get price from DB
                service = Service.objects.filter(id=service_id, owner=owner).first()
                if service:
                    amount = service.price
                    final_desc = f"POS: {service.name}"
                else:
                    continue # Skip invalid service IDs
            else:
                # Fallback for manual items (if allowed) or skip
                continue 

            BookingCharge.objects.create(
                booking=booking,
                description=final_desc,
                amount=amount
            )
            total_charged += amount
            charged_items.append(final_desc)

        return Response({
            'status': 'Charged successfully', 
            'total': total_charged,
            'items': charged_items
        })