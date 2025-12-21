from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
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
    seed_data_trigger
)
from core.views import StaffViewSet, SaaSConfigView # 👈 ADDED SaaSConfigView

from hotel.views import InvoicePDFView # Add this to the list   

# 🛡️ IMPORT FOR ROLE-BASED LOGIN
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from hotel.views import (
    # ... existing imports ...
    InvoicePDFView, 
    AdvancedAnalyticsView, 
    ExportReportView, 
    ActivateLicenseView, 
    CheckLicenseView
)

from hotel.views import CreatePaymentOrderView, VerifyPaymentView # Add imports

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
router.register(r'support-info', SaaSConfigView) # 👈 Added Support Info Route

# ==========================================
# 3. URL PATTERNS
# ==========================================
urlpatterns = [
    path('', home_view), 
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # 📈 EXECUTIVE ANALYTICS (Owner Only)
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),

    # 🔓 PUBLIC GUEST FOLIO (Guest Access via ID)
    path('api/public/folio/<int:booking_id>/', PublicFolioView.as_view(), name='public_folio'),
    
    # 🪄 MAGIC SEED LINK (Run this to populate DB)
    path('seed-db-now/', seed_data_trigger, name='seed_data_trigger'),

    # 🔑 AUTHENTICATION
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/invoice/<int:booking_id>/pdf/', InvoicePDFView.as_view(), name='invoice_pdf'),
    # 📊 Reports
    path('api/reports/analytics/', AdvancedAnalyticsView.as_view()),
    path('api/reports/export/', ExportReportView.as_view()),

    # 💳 License
    path('api/license/activate/', ActivateLicenseView.as_view()),
    path('api/license/check/', CheckLicenseView.as_view()),

    path('api/payment/create/', CreatePaymentOrderView.as_view()),
    path('api/payment/verify/', VerifyPaymentView.as_view()),
]