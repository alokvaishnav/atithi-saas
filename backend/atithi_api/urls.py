from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework import permissions

# --- Third Party Imports (Docs & Auth) ---
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import (
    TokenRefreshView, 
    TokenVerifyView  # Added for token validity checks
)

# --- Import Views from the 'hotel' app ---
from hotel.views import (
    # 1. ViewSets (CRUD Operations)
    RoomViewSet, BookingViewSet, GuestViewSet, 
    InventoryViewSet, ExpenseViewSet, MenuItemViewSet, 
    OrderViewSet, HousekeepingViewSet, ActivityLogViewSet, 
    StaffViewSet, SubscriptionPlanViewSet, 

    # 2. Authentication Views
    CustomTokenObtainPairView,  # Login (JWT)
    TenantRegisterView,         # Tenant Deployment
    StaffRegisterView,
    PasswordResetRequestView, PasswordResetConfirmView,

    # 3. Core Feature Views
    SettingsView, AnalyticsView,
    LicenseStatusView, LicenseActivateView,
    POSChargeView, ReportExportView, DailyReportPDFView,
    GenerateInvoiceView,        # Invoice PDF
    
    # 4. Super Admin Views
    SuperAdminStatsView, 
    PlatformConfigView,         # Renamed from PlatformSettingsView
    SuperAdminImpersonateView,  # Impersonation

    # 5. Public Website & Guest Engine
    PublicHotelView, PublicBookingCreateView, 
    PublicMenuView,             # Guest Menu
    PublicOrderCreateView,      # Guest Ordering
    
    # 6. Channel Manager & Images
    RoomICalView, 
    RoomImageUploadView         # Room Gallery
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
router = DefaultRouter()

# --- Core Operations ---
router.register(r'rooms', RoomViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'guests', GuestViewSet)

# --- Inventory & POS ---
router.register(r'inventory', InventoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'services', MenuItemViewSet)
router.register(r'orders', OrderViewSet)

# --- Operations ---
router.register(r'housekeeping', HousekeepingViewSet)

# --- Subscription Plans (Super Admin Only) ---
router.register(r'plans', SubscriptionPlanViewSet)

# --- Users & Logs ---
router.register(r'logs', ActivityLogViewSet, basename='activitylog')
router.register(r'staff', StaffViewSet, basename='staff')

# ==============================================================================
# 3. URL PATTERNS
# ==============================================================================
urlpatterns = [
    # A. Django Admin Panel
    path('admin/', admin.site.urls),

    # B. API Documentation (Corrected to use re_path)
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # C. Main API Router
    path('api/', include(router.urls)),
    
    # D. Browsable API Login (Standard DRF login)
    path('api-auth/', include('rest_framework.urls')), 

    # E. Custom API Endpoints
    
    # --- Authentication & Registration ---
    path('api/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/register/', TenantRegisterView.as_view(), name='register'), 
    path('api/register/staff/', StaffRegisterView.as_view(), name='register-staff'),
    
    # --- Password Reset ---
    path('api/password_reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('api/password_reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # --- Core Settings & Dashboard ---
    path('api/settings/', SettingsView.as_view(), name='settings'),
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    
    # --- License & SaaS Features ---
    path('api/license/status/', LicenseStatusView.as_view(), name='license-status'),
    path('api/license/activate/', LicenseActivateView.as_view(), name='license-activate'),

    # --- Reports, POS & Invoices ---
    path('api/pos/charge/', POSChargeView.as_view(), name='pos-charge'),
    path('api/reports/daily-pdf/', DailyReportPDFView.as_view(), name='daily-report-pdf'),
    path('api/reports/export/', ReportExportView.as_view(), name='report-export'),
    path('api/bookings/<int:booking_id>/invoice/', GenerateInvoiceView.as_view(), name='generate-invoice'),

    # --- Super Admin (Platform Owner) ---
    path('api/super-admin/stats/', SuperAdminStatsView.as_view(), name='super-admin-stats'),
    path('api/super-admin/config/', PlatformConfigView.as_view(), name='platform-config'),
    path('api/super-admin/impersonate/', SuperAdminImpersonateView.as_view(), name='impersonate'),

    # --- PUBLIC BOOKING ENGINE (Website Builder) ---
    path('api/public/hotel/<str:username>/', PublicHotelView.as_view(), name='public-hotel'),
    path('api/public/book/', PublicBookingCreateView.as_view(), name='public-book'),
    
    # --- PUBLIC GUEST POS (Menu & Ordering) ---
    path('api/public/menu/<str:username>/', PublicMenuView.as_view(), name='public-menu'),
    path('api/public/order/', PublicOrderCreateView.as_view(), name='public-order'),

    # --- CHANNEL MANAGER & IMAGES ---
    path('api/rooms/<int:room_id>/ical/', RoomICalView.as_view(), name='room-ical'),
    path('api/rooms/<int:room_id>/images/', RoomImageUploadView.as_view(), name='room-images'),
]

# ==============================================================================
# 4. MEDIA FILES SERVING (DEV MODE)
# ==============================================================================
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)