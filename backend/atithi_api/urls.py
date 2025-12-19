from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse # 👈 Import this
from rest_framework.routers import DefaultRouter
from hotel.views import (
    RoomViewSet, 
    GuestViewSet, 
    BookingViewSet, 
    ServiceViewSet, 
    BookingChargeViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# 👇 Define a simple "Home" view
def home_view(request):
    return JsonResponse({
        "message": "Welcome to Atithi SaaS API 🏨",
        "status": "Running",
        "documentation": "/api/"
    })

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'charges', BookingChargeViewSet)

urlpatterns = [
    # 👇 Add the root path here
    path('', home_view), 
    
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]