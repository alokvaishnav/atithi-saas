from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser # 👈 Added IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken 
from django.contrib.auth import get_user_model
from django.db.models import Q 
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from django.conf import settings

from .models import SaaSConfig
from .serializers import (
    UserSerializer, 
    SaaSConfigSerializer,
    PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer
)

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
class SaaSConfigView(viewsets.ModelViewSet): # 👈 Changed to ModelViewSet to allow updates
    """
    Publicly accessible (authenticated) view to get Support Info.
    Fetched from the 'Software Company Settings' in Admin Panel.
    Write access is restricted to Super Admin only.
    """
    queryset = SaaSConfig.objects.all()
    serializer_class = SaaSConfigSerializer
    
    def get_permissions(self):
        """
        Custom Permissions:
        - Read (GET): Authenticated Users (Hotel Owners/Staff)
        - Write (POST/PUT/DELETE): Super Admin Only
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

# ==========================================
# 🔐 PASSWORD RESET FLOW
# ==========================================

class PasswordResetRequestView(APIView):
    """
    Step 1: User requests password reset.
    - Validates email.
    - Generates Token.
    - Sends Email with reset link.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Generate Token & ID
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = PasswordResetTokenGenerator().make_token(user)
            
            # Construct Link (Points to React Frontend)
            # Ensure FRONTEND_URL is set in your settings.py
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            
            # Send Email
            try:
                send_mail(
                    "Password Reset Request - Atithi SaaS",
                    f"Click the link below to reset your password:\n\n{reset_link}\n\nIf you didn't request this, ignore this email.",
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                return Response({"status": "Password reset link sent to email."})
            except Exception as e:
                return Response({"email": ["Failed to send email. Please try again later."]}, status=500)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    """
    Step 2: User submits new password with the token.
    - Validates Token & UID.
    - Sets new password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "Password reset successfully."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)