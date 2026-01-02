from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet, BookingViewSet, GuestViewSet, CustomLoginView, RegisterView,
    InventoryViewSet, ExpenseViewSet, MenuItemViewSet, OrderViewSet, HousekeepingViewSet,
    LicenseStatusView, LicenseActivateView
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'services', MenuItemViewSet) # <--- FIX: Matches Frontend URL
router.register(r'orders', OrderViewSet)
router.register(r'housekeeping', HousekeepingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('license/status/', LicenseStatusView.as_view(), name='license-status'), # <--- FIX
    path('license/activate/', LicenseActivateView.as_view(), name='license-activate'), # <--- FIX
]