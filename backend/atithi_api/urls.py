from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# 🏨 HOTEL APP IMPORTS
from hotel.views import (
    RoomViewSet, 
    GuestViewSet, 
    BookingViewSet, 
    ServiceViewSet, 
    BookingChargeViewSet,
    ExpenseViewSet,
    SettingViewSet,
    InventoryViewSet,        # 👈 NEW: Added Inventory
    HousekeepingTaskViewSet, # 👈 NEW: Added Housekeeping
    AnalyticsView,
    PublicFolioView,
    seed_data_trigger,
    InvoicePDFView, 
    AdvancedAnalyticsView, 
    ExportReportView, 
    ActivateLicenseView, 
    CheckLicenseView,
    CreatePaymentOrderView, 
    VerifyPaymentView,
    EmailInvoiceView,
    HotelSMTPSettingsView,
    register_user,
    CustomTokenObtainPairView # 👈 Use the centralized logic from views.py
)

# 🏢 CORE APP IMPORTS
from core.views import StaffViewSet, SaaSConfigView

# ==========================================
# 1. VIEWS & ROUTING
# ==========================================
def home_view(request):
    return JsonResponse({
        "message": "Welcome to Atithi SaaS API 🏨",
        "status": "Running",
        "version": "2.5 (Full Enterprise Features)",
        "admin_panel": "/admin/"
    })

router = DefaultRouter()
# --- Existing Features ---
router.register(r'rooms', RoomViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'charges', BookingChargeViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'settings', SettingViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'support-info', SaaSConfigView)

# --- 🚀 NEW FEATURES (Now Registered) ---
router.register(r'inventory', InventoryViewSet)           # 👈 Inventory API
router.register(r'housekeeping', HousekeepingTaskViewSet) # 👈 Housekeeping API

# ==========================================
# 2. URL PATTERNS
# ==========================================
urlpatterns = [
    # 🏠 Homepage
    path('', home_view), 
    
    # ⚙️ Django Admin
    path('admin/', admin.site.urls),
    
    # 🔗 Standard API Routes (Router)
    path('api/', include(router.urls)),
    
    # 🔐 AUTHENTICATION & REGISTRATION
    path('api/auth/register/', register_user),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'), # 👈 Fixed: Uses hotel/views.py logic
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 📈 EXECUTIVE ANALYTICS
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('api/reports/analytics/', AdvancedAnalyticsView.as_view()),
    path('api/reports/export/', ExportReportView.as_view()),

    # 🔓 PUBLIC GUEST FOLIO
    path('api/public/folio/<int:booking_id>/', PublicFolioView.as_view(), name='public_folio'),
    
    # 🧾 INVOICING & PDF
    path('api/invoice/<int:booking_id>/pdf/', InvoicePDFView.as_view(), name='invoice_pdf'),
    path('api/invoice/<int:pk>/email/', EmailInvoiceView.as_view()),

    # 💳 LICENSE & PAYMENTS
    path('api/license/activate/', ActivateLicenseView.as_view()),
    path('api/license/check/', CheckLicenseView.as_view()),
    path('api/payment/create/', CreatePaymentOrderView.as_view()),
    path('api/payment/verify/', VerifyPaymentView.as_view()),

    # ⚙️ HOTEL CONFIGURATION
    path('api/settings/email/', HotelSMTPSettingsView.as_view()),

    # 🪄 MAGIC SEED LINK
    path('seed-db-now/', seed_data_trigger, name='seed_data_trigger'),
]