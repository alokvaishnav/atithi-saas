from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework import permissions

# --- Third Party Imports (Docs & Auth) ---
# Ensure you have installed: pip install drf-yasg djangorestframework-simplejwt
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import TokenRefreshView

# --- Import Views from the 'hotel' app ---
# We use 'CustomTokenObtainPairView' instead of 'CustomLoginView' for JWT
from hotel.views import (
    # 1. ViewSets (CRUD Operations)
    RoomViewSet, BookingViewSet, GuestViewSet, 
    InventoryViewSet, ExpenseViewSet, MenuItemViewSet, 
    OrderViewSet, HousekeepingViewSet, ActivityLogViewSet, 
    StaffViewSet,

    # 2. Authentication Views
    CustomTokenObtainPairView,  # Replaces CustomLoginView for JWT
    RegisterView, StaffRegisterView,
    PasswordResetRequestView, PasswordResetConfirmView,

    # 3. Core Feature Views
    SettingsView, AnalyticsView,
    LicenseStatusView, LicenseActivateView,
    POSChargeView, ReportExportView, DailyReportPDFView,
    
    # 4. Super Admin Views
    SuperAdminStatsView, PlatformSettingsView,

    # 5. Public Website & Channel Manager Views
    PublicHotelView, PublicBookingCreateView, RoomICalView
)

# ==============================================================================
# 1. SWAGGER / API DOCS CONFIGURATION
# ==============================================================================
schema_view = get_schema_view(
   openapi.Info(
      title="Hotel Management API",
      default_version='v1',
      description="API documentation for the Atithi Hotel Management System",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="support@hotelapp.com"),
      license=openapi.License(name="Proprietary License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

# ==============================================================================
# 2. ROUTER CONFIGURATION
# ==============================================================================
# Handles Standard CRUD APIs
router = DefaultRouter()

# Core Operations
router.register(r'rooms', RoomViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'guests', GuestViewSet)

# Inventory & POS
router.register(r'inventory', InventoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'services', MenuItemViewSet)
router.register(r'orders', OrderViewSet)

# Operations
router.register(r'housekeeping', HousekeepingViewSet)

# Users & Logs
# 'basename' is required for these because they use custom get_queryset logic
router.register(r'logs', ActivityLogViewSet, basename='activitylog')
router.register(r'staff', StaffViewSet, basename='staff')

# ==============================================================================
# 3. URL PATTERNS
# ==============================================================================
urlpatterns = [
    # A. Django Admin Panel
    path('admin/', admin.site.urls),

    # B. API Documentation (Swagger & Redoc)
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # C. Main API Router (Includes all ViewSets defined above)
    path('api/', include(router.urls)),

    # D. Custom API Endpoints
    
    # --- Authentication ---
    path('api/login/', CustomTokenObtainPairView.as_view(), name='login'), # JWT Login
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'), # Owner Registration
    path('api/register/staff/', StaffRegisterView.as_view(), name='register-staff'),
    path('api/password_reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('api/password_reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # --- Core Settings & Dashboard ---
    path('api/settings/', SettingsView.as_view(), name='settings'),
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    
    # --- License & SaaS Features ---
    path('api/license/status/', LicenseStatusView.as_view(), name='license-status'),
    path('api/license/activate/', LicenseActivateView.as_view(), name='license-activate'),

    # --- Reports & Exports ---
    path('api/pos/charge/', POSChargeView.as_view(), name='pos-charge'),
    path('api/reports/daily-pdf/', DailyReportPDFView.as_view(), name='daily-report-pdf'),
    path('api/reports/export/', ReportExportView.as_view(), name='report-export'),

    # --- Super Admin (Platform Owner) ---
    path('api/super-admin/stats/', SuperAdminStatsView.as_view(), name='super-admin-stats'),
    
    # Flexible pattern for Platform Settings (Handles both /settings/ and /settings/1/)
    re_path(r'^api/super-admin/platform-settings/(?:(?P<pk>\d+)/)?$', PlatformSettingsView.as_view(), name='platform-settings'),

    # --- PUBLIC BOOKING ENGINE (Website Builder) ---
    # These paths are Open (AllowAny)
    path('api/public/hotel/<str:username>/', PublicHotelView.as_view(), name='public-hotel'),
    path('api/public/book/', PublicBookingCreateView.as_view(), name='public-book'),

    # --- CHANNEL MANAGER (iCal) ---
    path('api/room/<int:room_id>/ical/', RoomICalView.as_view(), name='room-ical'),
]

# ==============================================================================
# 4. MEDIA FILES SERVING (DEV MODE)
# ==============================================================================
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)