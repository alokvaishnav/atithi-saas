from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
# 👇 Updated Import: Added ServiceViewSet and BookingChargeViewSet
from hotel.views import (
    RoomViewSet, 
    GuestViewSet, 
    BookingViewSet, 
    ServiceViewSet, 
    BookingChargeViewSet
)

# 👇 1. Import the Security Views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# This Router automatically creates URLs
router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'bookings', BookingViewSet)

# 👇 NEW: Register the POS URLs
router.register(r'services', ServiceViewSet)       # For the Menu (Coca Cola, etc.)
router.register(r'charges', BookingChargeViewSet)  # For adding items to a bill

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # All our APIs will start with /api/
    
    # 👇 2. Add the Login & Refresh Token URLs here
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]