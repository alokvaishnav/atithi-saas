from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # --- ViewSets (CRUD operations) ---
    RoomViewSet, 
    BookingViewSet, 
    GuestViewSet, 
    InventoryViewSet, 
    ExpenseViewSet, 
    MenuItemViewSet, 
    OrderViewSet, 
    HousekeepingViewSet, 
    ActivityLogViewSet, 
    StaffViewSet,

    # --- Auth & Account Views ---
    CustomTokenObtainPairView,  # Updated to match JWT implementation
    StaffRegisterView,
    PasswordResetRequestView, 
    PasswordResetConfirmView,

    # --- Core System Views ---
    SettingsView, 
    AnalyticsView,
    
    # --- License Views ---
    LicenseStatusView, 
    LicenseActivateView,

    # --- POS & Reports Views ---
    POSChargeView, 
    ReportExportView, 
    DailyReportPDFView,

    # --- Super Admin Views ---
    SuperAdminStatsView, 
    PlatformSettingsView,

    # --- Channel Manager View ---
    RoomICalView,

    # --- Public Booking Views ---
    PublicHotelView, 
    PublicBookingCreateView
)

# --- ROUTER CONFIGURATION ---
# This automatically generates URLs for standard CRUD operations (GET, POST, PUT, DELETE)
# and custom @action decorators like 'mark-clean', 'folio', 'pay', etc.
router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'services', MenuItemViewSet) # Mapped to 'services' to match Frontend API calls
router.register(r'orders', OrderViewSet)
router.register(r'housekeeping', HousekeepingViewSet)
router.register(r'logs', ActivityLogViewSet)
router.register(r'staff', StaffViewSet, basename='staff')

# --- URL PATTERNS ---
urlpatterns = [
    # 1. Router URLs (Include all ViewSets above)
    path('', include(router.urls)),

    # 2. Authentication
    # Note: RegisterView is usually handled by a separate serializer/view in core
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('register/staff/', StaffRegisterView.as_view(), name='register-staff'),
    
    # 3. Password Reset
    path('password_reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password_reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # 4. Global Settings & Dashboard Analytics
    path('settings/', SettingsView.as_view(), name='settings'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),

    # 5. Licensing System
    path('license/status/', LicenseStatusView.as_view(), name='license-status'),
    path('license/activate/', LicenseActivateView.as_view(), name='license-activate'),

    # 6. Point of Sale (POS)
    path('pos/charge/', POSChargeView.as_view(), name='pos-charge'),

    # 7. Reports & Exports
    # Supports ?token=... for direct browser download
    path('reports/daily-pdf/', DailyReportPDFView.as_view(), name='daily-report-pdf'),
    path('reports/export/', ReportExportView.as_view(), name='report-export'),

    # 8. Channel Manager (iCal for Airbnb/Booking.com)
    path('rooms/<int:room_id>/ical/', RoomICalView.as_view(), name='room-ical'),

    # 9. Super Admin Controls (SaaS Platform HQ)
    path('super-admin/stats/', SuperAdminStatsView.as_view(), name='super-admin-stats'),
    path('super-admin/platform-settings/', PlatformSettingsView.as_view(), name='platform-settings'),

    # 10. Public Booking Engine (Guest Facing)
    path('public/hotel/<str:username>/', PublicHotelView.as_view(), name='public-hotel'),
    path('public/book/', PublicBookingCreateView.as_view(), name='public-book'),
]