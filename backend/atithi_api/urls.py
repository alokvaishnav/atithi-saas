from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

# 🏨 HOTEL APP IMPORTS
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
    InvoicePDFView, 
    AdvancedAnalyticsView, 
    ExportReportView, 
    ActivateLicenseView, 
    CheckLicenseView,
    create_payment_order, 
    verify_payment,
    EmailInvoiceView,
    HotelSMTPSettingsView,
    HotelWhatsAppSettingsView, 
    register_user,
    CustomTokenObtainPairView 
)

# 🏢 CORE APP IMPORTS
from core.views import (
    StaffViewSet, 
    SaaSConfigView,
    PasswordResetRequestView,
    PasswordResetConfirmView
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

# --- 🚀 NEW FEATURES ---
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
    path('api/auth/register/', register_user),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 🔐 PASSWORD RESET
    path('api/password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('api/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

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
    
    path('api/payment/create/', create_payment_order),
    path('api/payment/verify/', verify_payment),

    # ⚙️ HOTEL CONFIGURATION
    path('api/settings/email/', HotelSMTPSettingsView.as_view()),
    path('api/settings/whatsapp/', HotelWhatsAppSettingsView.as_view()),
]

# 👇 MEDIA FILES CONFIGURATION (Required for Logos/PDFs)
if settings.DEBUG or True:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)