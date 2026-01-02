from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # ViewSets (CRUD operations handled by Router)
    RoomViewSet, BookingViewSet, GuestViewSet, 
    InventoryViewSet, ExpenseViewSet, MenuItemViewSet, 
    OrderViewSet, HousekeepingViewSet, ActivityLogViewSet, 
    StaffViewSet,

    # Auth & Account Views
    CustomLoginView, RegisterView, StaffRegisterView,
    PasswordResetRequestView, PasswordResetConfirmView,

    # Core System Views
    SettingsView, AnalyticsView,
    
    # License Views
    LicenseStatusView, LicenseActivateView,

    # POS & Reports Views
    POSChargeView, ReportExportView, DailyReportPDFView,

    # Super Admin Views
    SuperAdminStatsView
)

# --- ROUTER CONFIGURATION ---
# This automatically generates URLs for standard CRUD operations (GET, POST, PUT, DELETE)
# Example: /api/rooms/, /api/bookings/, /api/bookings/{id}/
router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'services', MenuItemViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'housekeeping', HousekeepingViewSet)
router.register(r'logs', ActivityLogViewSet)
router.register(r'staff', StaffViewSet, basename='staff')

# --- URL PATTERNS ---
urlpatterns = [
    # 1. Router URLs (Include all ViewSets above)
    path('', include(router.urls)),

    # 2. Authentication
    path('login/', CustomLoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
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
    # Handles the Checkout/Charge logic from POS.jsx
    path('pos/charge/', POSChargeView.as_view(), name='pos-charge'),

    # 7. Reports & Exports
    # Handles PDF generation and CSV exports from Reports.jsx
    path('reports/daily-pdf/', DailyReportPDFView.as_view(), name='daily-report-pdf'),
    path('reports/export/', ReportExportView.as_view(), name='report-export'),

    # 8. Super Admin Controls
    # Handles the platform stats from SuperAdmin.jsx
    path('super-admin/stats/', SuperAdminStatsView.as_view(), name='super-admin-stats'),
]