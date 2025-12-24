from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# 🏢 CORE APP IMPORTS (User & Auth)
# We import RegisterView from CORE as per your latest update
from core.views import StaffViewSet, SaaSConfigView, RegisterView 

# 🏨 HOTEL APP IMPORTS (Business Logic)
from hotel.views import (
    RoomViewSet, 
    GuestViewSet, 
    BookingViewSet, 
    ServiceViewSet, 
    BookingChargeViewSet,
    ExpenseViewSet,
    SettingViewSet,
    InventoryViewSet,        
    HousekeepingTaskViewSet, 
    AnalyticsView,
    PublicFolioView,
    seed_data_trigger,
    InvoicePDFView, 
    AdvancedAnalyticsView, 
    ExportReportView, 
    ActivateLicenseView, 
    CheckLicenseView,
    # 💳 Payment Classes
    CreatePaymentOrderView, 
    VerifyPaymentView,
    # 📧 Automation
    EmailInvoiceView,
    HotelSMTPSettingsView,
    CustomTokenObtainPairView
)

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

# --- Core Features ---
router.register(r'rooms', RoomViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'charges', BookingChargeViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'settings', SettingViewSet)

# --- SaaS & Staff Features ---
router.register(r'staff', StaffViewSet)
router.register(r'support-info', SaaSConfigView)

# --- 🚀 Enterprise Inventory & Housekeeping ---
router.register(r'inventory', InventoryViewSet)           
router.register(r'housekeeping', HousekeepingTaskViewSet) 

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
    # ✅ CORRECTED: Points to 'core.views.RegisterView'
    path('api/auth/register/', RegisterView.as_view()), 
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 📈 EXECUTIVE ANALYTICS & REPORTS
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('api/reports/analytics/', AdvancedAnalyticsView.as_view()),
    path('api/reports/export/', ExportReportView.as_view()),

    # 🔓 PUBLIC GUEST FOLIO
    path('api/public/folio/<int:booking_id>/', PublicFolioView.as_view(), name='public_folio'),
    
    # 🧾 INVOICING & PDF
    path('api/invoice/<int:booking_id>/pdf/', InvoicePDFView.as_view(), name='invoice_pdf'),
    path('api/invoice/<int:pk>/email/', EmailInvoiceView.as_view()),

    # 💳 LICENSE & SAAS RENT PAYMENTS
    path('api/license/activate/', ActivateLicenseView.as_view()),
    path('api/license/check/', CheckLicenseView.as_view()),
    
    # 👇 PAYMENT ROUTES (Fixed to use Class-Based Views)
    path('api/payment/create/', CreatePaymentOrderView.as_view()),
    path('api/payment/verify/', VerifyPaymentView.as_view()),

    # ⚙️ HOTEL OWNER SMTP CONFIGURATION
    path('api/settings/email/', HotelSMTPSettingsView.as_view()),

    # 🪄 SYSTEM TOOLS
    path('seed-db-now/', seed_data_trigger, name='seed_data_trigger'),
]