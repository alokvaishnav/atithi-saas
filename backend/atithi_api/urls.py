from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hotel.views import (
    # ViewSets
    RoomViewSet, 
    GuestViewSet, 
    BookingViewSet, 
    ServiceViewSet, 
    InventoryViewSet, 
    ExpenseViewSet, 
    HousekeepingViewSet, 
    StaffViewSet, 
    SettingsViewSet,
    SystemLogViewSet, 
    
    # Special Logic Views
    AnalyticsView, 
    RegisterView, 
    POSChargeView,
    
    # Reporting & Exports
    EndOfDayReportView, 
    ExportReportView,
    
    # License & Security
    license_status, 
    activate_license,
    
    # 👑 Super Admin Views
    SuperAdminDashboardView,
    
    # 🔐 Custom Auth View (CRITICAL FOR ROLE FIX)
    CustomTokenObtainPairView
)
from rest_framework_simplejwt.views import TokenRefreshView

# 1. Setup Router for Standard CRUD Operations
router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'guests', GuestViewSet, basename='guest')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'housekeeping', HousekeepingViewSet, basename='housekeeping')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'settings', SettingsViewSet, basename='settings')
router.register(r'logs', SystemLogViewSet, basename='logs')

# 2. Main URL Patterns
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 🔐 Authentication & Identity
    # We use CustomTokenObtainPairView to send 'role' and 'is_superuser' to Frontend
    path('api/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_alias'), 
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 📝 Registration
    path('api/register/', RegisterView.as_view(), name='register'),

    # 🔑 Password Recovery Alias (To prevent 404s on Frontend)
    path('api/password_reset/', TokenRefreshView.as_view(), name='password_reset_placeholder'),
    
    # 👑 Super Admin Platform Control
    path('api/super-admin/stats/', SuperAdminDashboardView.as_view(), name='super_admin_stats'),
    
    # 📊 Business Intelligence & POS
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('api/pos/charge/', POSChargeView.as_view(), name='pos_charge'),
    
    # 📄 Reporting Engine (PDF & CSV)
    path('api/reports/daily-pdf/', EndOfDayReportView.as_view(), name='daily_pdf'),
    path('api/reports/export/', ExportReportView.as_view(), name='export_report'),

    # 🛡️ License System (SaaS Lock)
    path('api/license/status/', license_status, name='license_status'),
    path('api/license/activate/', activate_license, name='activate_license'),

    # 🏨 Main Hotel Modules (Mapped under /api/)
    path('api/', include(router.urls)),
]