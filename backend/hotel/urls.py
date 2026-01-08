from django.urls import path, include
from rest_framework.routers import DefaultRouter

# ==========================================
#  VIEW IMPORTS
# ==========================================
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
    SubscriptionPlanViewSet, # 🟢 NEW: Plan Management

    # --- Auth & Account Views ---
    CustomTokenObtainPairView,  # Login (JWT)
    TenantRegisterView,         # Tenant Registration (Deploy Node)
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
    GenerateInvoiceView,        # 🟢 NEW: Invoice PDF

    # --- Super Admin Views ---
    SuperAdminStatsView, 
    PlatformConfigView,         # (Formerly PlatformSettingsView)
    SuperAdminImpersonateView,  # 🟢 CRITICAL: Impersonation

    # --- Channel Manager & Images ---
    RoomICalView,
    RoomImageUploadView,        # 🟢 NEW: Room Gallery Uploads

    # --- Public Booking & Guest Views ---
    PublicHotelView, 
    PublicBookingCreateView,
    PublicMenuView,             # 🟢 NEW: Guest POS Menu
    PublicOrderCreateView,      # 🟢 NEW: Guest POS Order
)

# ==========================================
#  ROUTER CONFIGURATION
# ==========================================
router = DefaultRouter()

# Standard ViewSets
router.register(r'rooms', RoomViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'services', MenuItemViewSet) # Food/Laundry items
router.register(r'orders', OrderViewSet)
router.register(r'housekeeping', HousekeepingViewSet)

# Subscription Plans (Super Admin Only)
router.register(r'plans', SubscriptionPlanViewSet)

# Critical: 'basename' required for custom querysets
router.register(r'logs', ActivityLogViewSet, basename='activitylog')
router.register(r'staff', StaffViewSet, basename='staff')

# ==========================================
#  URL PATTERNS
# ==========================================
urlpatterns = [
    # 1. Router URLs (Include all ViewSets above)
    path('', include(router.urls)),

    # 2. Authentication & Registration
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('register/', TenantRegisterView.as_view(), name='register-tenant'),
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

    # 6. Point of Sale (POS) & Invoices
    path('pos/charge/', POSChargeView.as_view(), name='pos-charge'),
    path('bookings/<int:booking_id>/invoice/', GenerateInvoiceView.as_view(), name='generate-invoice'), # 🟢 NEW

    # 7. Reports & Exports
    path('reports/daily-pdf/', DailyReportPDFView.as_view(), name='daily-report-pdf'),
    path('reports/export/', ReportExportView.as_view(), name='report-export'),

    # 8. Channel Manager & Room Images
    path('rooms/<int:room_id>/ical/', RoomICalView.as_view(), name='room-ical'),
    path('rooms/<int:room_id>/images/', RoomImageUploadView.as_view(), name='room-images'), # 🟢 NEW: Gallery

    # 9. Super Admin Controls (SaaS Platform HQ)
    path('super-admin/stats/', SuperAdminStatsView.as_view(), name='super-admin-stats'),
    # Note: PlatformConfigView matches the name in your updated views.py
    path('super-admin/platform-settings/', PlatformConfigView.as_view(), name='platform-settings'), 
    path('super-admin/impersonate/', SuperAdminImpersonateView.as_view(), name='impersonate'),

    # 10. Public Booking Engine & Guest App
    path('public/hotel/<str:username>/', PublicHotelView.as_view(), name='public-hotel'),
    path('public/book/', PublicBookingCreateView.as_view(), name='public-book'),
    
    # 🟢 NEW: Guest POS Endpoints
    path('public/menu/<str:username>/', PublicMenuView.as_view(), name='public-menu'),
    path('public/order/', PublicOrderCreateView.as_view(), name='public-order'),
]