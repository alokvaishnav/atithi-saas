from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Import Views from the local app
from hotel.views import (
    # ViewSets
    RoomViewSet, BookingViewSet, GuestViewSet, 
    InventoryViewSet, ExpenseViewSet, MenuItemViewSet, 
    OrderViewSet, HousekeepingViewSet, ActivityLogViewSet, 
    StaffViewSet,

    # Auth Views
    CustomLoginView, RegisterView, StaffRegisterView,
    PasswordResetRequestView, PasswordResetConfirmView,

    # Feature Views
    SettingsView, AnalyticsView,
    LicenseStatusView, LicenseActivateView,
    POSChargeView, ReportExportView, DailyReportPDFView,
    SuperAdminStatsView
)

# --- 1. ROUTER CONFIGURATION ---
# Handles Standard CRUD APIs (e.g., /api/rooms/, /api/bookings/)
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

# --- 2. URL PATTERNS ---
urlpatterns = [
    # A. Django Admin
    path('admin/', admin.site.urls),

    # B. API Router (Includes all ViewSets under /api/)
    path('api/', include(router.urls)),

    # C. Custom API Endpoints (Manually defined under /api/)
    
    # Authentication
    path('api/login/', CustomLoginView.as_view(), name='login'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/register/staff/', StaffRegisterView.as_view(), name='register-staff'),
    path('api/password_reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('api/password_reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # Core Features
    path('api/settings/', SettingsView.as_view(), name='settings'),
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    
    # License & SaaS
    path('api/license/status/', LicenseStatusView.as_view(), name='license-status'),
    path('api/license/activate/', LicenseActivateView.as_view(), name='license-activate'),

    # POS & Reports
    path('api/pos/charge/', POSChargeView.as_view(), name='pos-charge'),
    path('api/reports/daily-pdf/', DailyReportPDFView.as_view(), name='daily-report-pdf'),
    path('api/reports/export/', ReportExportView.as_view(), name='report-export'),

    # Super Admin
    path('api/super-admin/stats/', SuperAdminStatsView.as_view(), name='super-admin-stats'),
]

# --- 3. MEDIA FILES SERVING (DEV MODE) ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)