from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny # 👈 Added AllowAny
from rest_framework_simplejwt.tokens import RefreshToken # 👈 Added for Auto-Login
from django.contrib.auth import get_user_model
from django.db.models import Q 
from .models import SaaSConfig
from .serializers import UserSerializer, SaaSConfigSerializer, UserRegistrationSerializer # 👈 Added Registration Serializer

User = get_user_model()

# ==========================================
# STAFF & USER MANAGEMENT VIEWSET
# ==========================================

class StaffViewSet(viewsets.ModelViewSet):
    """
    Handles Staff Onboarding, Role Assignment, and Identity Management.
    Restricted to Authenticated Staff with SaaS Isolation Logic.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        🔐 SAAS HIERARCHY LOGIC:
        - SUPER ADMIN: Sees EVERYONE in the system.
        - OWNER: Sees THEMSELVES + THEIR Employees (hotel_owner=self).
        - MANAGER: Sees other staff belonging to the SAME Owner.
        - OTHERS: Cannot see the staff directory.
        """
        user = self.request.user
        
        # Security: Prevent unauthenticated access
        if not user.is_authenticated:
            return User.objects.none()

        # 1. Super Admin (Software Company) sees ALL
        if user.is_superuser:
            return User.objects.all().order_by('-date_joined')

        # 2. Hotel Owner sees: Themselves + Their Employees
        if user.role == 'OWNER':
            return User.objects.filter(
                Q(hotel_owner=user) | Q(id=user.id)
            ).order_by('-date_joined')
        
        # 3. Manager sees: Their Team (Same Boss)
        if user.role == 'MANAGER' and user.hotel_owner:
            return User.objects.filter(hotel_owner=user.hotel_owner).order_by('-date_joined')
            
        # 4. Standard staff shouldn't see the full list usually
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        """
        🛡️ CREATION LOGIC:
        1. Auto-assign the 'hotel_owner' link based on who is creating the user.
        2. Hash the password securely.
        """
        user = self.request.user
        save_kwargs = {}

        # Auto-Link Logic
        if user.role == 'OWNER':
            save_kwargs['hotel_owner'] = user
        elif user.role == 'MANAGER':
            save_kwargs['hotel_owner'] = user.hotel_owner

        # Save the user instance first
        instance = serializer.save(**save_kwargs)
        
        # Hash Password if provided
        password = self.request.data.get('password')
        if password:
            instance.set_password(password)
            instance.save()

    def perform_update(self, serializer):
        """
        🛡️ UPDATE LOGIC:
        If a password is provided during an update, re-hash it.
        """
        instance = serializer.save()
        password = self.request.data.get('password')
        
        if password:
            instance.set_password(password)
            instance.save()

    def destroy(self, request, *args, **kwargs):
        """
        🚫 SAFETY LOGIC:
        Prevent users from accidentally deleting their own administrative account.
        """
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {"error": "Security Breach: You cannot delete your own administrative account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

# ==========================================
# SUPPORT PAGE CONFIG VIEW
# ==========================================
class SaaSConfigView(viewsets.ReadOnlyModelViewSet):
    """
    Publicly accessible (authenticated) view to get Support Info.
    Fetched from the 'Software Company Settings' in Admin Panel.
    """
    queryset = SaaSConfig.objects.all()
    serializer_class = SaaSConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

# ==========================================
# 👇 NEW: PUBLIC REGISTRATION VIEW
# ==========================================
class RegisterView(APIView):
    """
    Handles Public Sign-Ups.
    Accessible by ANYONE (No Login Required).
    """
    permission_classes = [AllowAny] # Open to the public

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Auto-Login: Generate Token immediately so they don't have to login manually
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "status": "User Registered Successfully",
                "user_id": user.id,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "role": user.role,
                "hotel_name": getattr(user, 'hotel_name', 'My New Hotel')
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)