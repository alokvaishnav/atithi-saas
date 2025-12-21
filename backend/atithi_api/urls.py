from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter

# 🛡️ IMPORT FOR ROLE-BASED LOGIN
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# 🏨 HOTEL APP IMPORTS
from hotel.views import (
    RoomViewSet, 
    GuestViewSet, 
    BookingViewSet, 
    ServiceViewSet, 
    BookingChargeViewSet,
    ExpenseViewSet,
    SettingViewSet,
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
    HotelSMTPSettingsView
)

# 🏢 CORE APP IMPORTS
from core.views import StaffViewSet, SaaSConfigView, RegisterView  # 👈 Added RegisterView

# ==========================================
# 1. CUSTOM LOGIN LOGIC (To send User Role)
# ==========================================
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims (Data sent inside the encrypted token)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra data to the plain JSON response for the Frontend
        data['user_role'] = self.user.role
        data['username'] = self.user.username
        data['hotel_name'] = self.user.get_hotel_name() # Useful for frontend state
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# ==========================================
# 2. VIEWS & ROUTING
# ==========================================
def home_view(request):
    return JsonResponse({
        "message": "Welcome to Atithi SaaS API 🏨",
        "status": "Running",
        "version": "2.5 (Full Enterprise Features)",
        "admin_panel": "/admin/"
    })

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'charges', BookingChargeViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'settings', SettingViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'support-info', SaaSConfigView)

# ==========================================
# 3. URL PATTERNS
# ==========================================
urlpatterns = [
    # 🏠 Homepage
    path('', home_view), 
    
    # ⚙️ Django Admin
    path('admin/', admin.site.urls),
    
    # 🔗 Standard API Routes (Router)
    path('api/', include(router.urls)),
    
    # 🔐 AUTHENTICATION & REGISTRATION
    path('api/auth/register/', RegisterView.as_view()), # 👈 NEW: Public Sign Up
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 📈 EXECUTIVE ANALYTICS (Owner Only)
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('api/reports/analytics/', AdvancedAnalyticsView.as_view()),
    path('api/reports/export/', ExportReportView.as_view()),

    # 🔓 PUBLIC GUEST FOLIO (Guest Access via ID)
    path('api/public/folio/<int:booking_id>/', PublicFolioView.as_view(), name='public_folio'),
    
    # 🧾 INVOICING & PDF
    path('api/invoice/<int:booking_id>/pdf/', InvoicePDFView.as_view(), name='invoice_pdf'),
    path('api/invoice/<int:pk>/email/', EmailInvoiceView.as_view()), # 📧 Email Invoice

    # 💳 LICENSE & PAYMENTS
    path('api/license/activate/', ActivateLicenseView.as_view()),
    path('api/license/check/', CheckLicenseView.as_view()),
    path('api/payment/create/', CreatePaymentOrderView.as_view()),
    path('api/payment/verify/', VerifyPaymentView.as_view()),

    # ⚙️ HOTEL CONFIGURATION
    path('api/settings/email/', HotelSMTPSettingsView.as_view()), # 📧 SMTP Settings

    # 🪄 MAGIC SEED LINK (Run this to populate DB)
    path('seed-db-now/', seed_data_trigger, name='seed_data_trigger'),
]
