from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # ViewSets
    RoomViewSet, 
    GuestViewSet, 
    ServiceViewSet, 
    InventoryViewSet, 
    ExpenseViewSet, 
    HousekeepingViewSet, 
    StaffViewSet, 
    SettingsViewSet, 
    BookingViewSet,
    
    # API Views / Functions
    AnalyticsView,
    RegisterView,
    POSChargeView,
    license_status,
    activate_license
)

# 1. Setup the Router for ViewSets
# This automatically handles GET, POST, PUT, DELETE for the main models
router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='rooms')
router.register(r'guests', GuestViewSet, basename='guests')
router.register(r'services', ServiceViewSet, basename='services')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'expenses', ExpenseViewSet, basename='expenses')
router.register(r'housekeeping', HousekeepingViewSet, basename='housekeeping')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'settings', SettingsViewSet, basename='settings')
router.register(r'bookings', BookingViewSet, basename='bookings')

# 2. Define URL Patterns
urlpatterns = [
    # Router URLs (Standard CRUD)
    path('', include(router.urls)),

    # Custom Analytics Endpoint
    path('analytics/', AnalyticsView.as_view(), name='analytics'),

    # Registration (Owner Level)
    path('register/', RegisterView.as_view(), name='register'),

    # POS Terminal Charging
    path('pos/charge/', POSChargeView.as_view(), name='pos_charge'),

    # License System Management
    path('license/status/', license_status, name='license_status'),
    path('license/activate/', activate_license, name='activate_license'),
]