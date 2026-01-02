from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet, BookingViewSet, GuestViewSet, CustomLoginView, RegisterView,
    InventoryViewSet, ExpenseViewSet, MenuItemViewSet, OrderViewSet, HousekeepingViewSet,
    ActivityLogViewSet, StaffViewSet, StaffRegisterView, SettingsView, AnalyticsView,
    LicenseStatusView, LicenseActivateView
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'guests', GuestViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'services', MenuItemViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'housekeeping', HousekeepingViewSet)
router.register(r'logs', ActivityLogViewSet)
router.register(r'staff', StaffViewSet, basename='staff')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('register/staff/', StaffRegisterView.as_view(), name='register-staff'),
    path('settings/', SettingsView.as_view(), name='settings'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('license/status/', LicenseStatusView.as_view(), name='license-status'),
    path('license/activate/', LicenseActivateView.as_view(), name='license-activate'),
]