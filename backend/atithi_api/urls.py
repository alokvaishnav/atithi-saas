from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from hotel.views import (
    RoomViewSet, 
    GuestViewSet, 
    BookingViewSet, 
    ServiceViewSet, 
    BookingChargeViewSet
)
from core.views import UserViewSet

# 🛡️ IMPORT FOR ROLE-BASED LOGIN
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

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
        "version": "2.0 (Role Based Access Control Enabled)",
        "admin_panel": "/admin/"
    })

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'charges', BookingChargeViewSet)
router.register(r'users', UserViewSet)

# ==========================================
# 3. URL PATTERNS
# ==========================================
urlpatterns = [
    path('', home_view), 
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # 👇 UPDATED: Uses the custom view to send user_role back to React
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]