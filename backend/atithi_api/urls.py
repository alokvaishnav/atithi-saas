from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hotel.views import RoomViewSet, GuestViewSet, BookingViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Create a Router to automatically handle URLs
router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'guests', GuestViewSet, basename='guest')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 🔐 Authentication Endpoints (Login)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 🏨 Hotel API Endpoints
    path('api/', include(router.urls)),
]