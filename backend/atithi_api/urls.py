from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hotel.views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'guests', GuestViewSet, basename='guest')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'housekeeping', HousekeepingViewSet, basename='housekeeping')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'settings', SettingsViewSet, basename='settings')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 🔐 Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    
    # 📊 Special Logic
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('api/pos/charge/', POSChargeView.as_view(), name='pos_charge'),

    # 🏨 Standard APIs
    path('api/', include(router.urls)),
]