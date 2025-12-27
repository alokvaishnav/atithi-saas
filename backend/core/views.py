from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
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
    Handles Staff Onboarding via Email Invitation.
    Restricted to Authenticated Staff with SaaS Isolation Logic.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        🔐 SAAS HIERARCHY LOGIC:
        - SUPER ADMIN: Sees EVERYONE in the system.
        - OWNER: Sees THEMSELVES + THEIR Employees.
        - MANAGER: Sees other staff belonging to the SAME Owner.
        """
        user = self.request.user
        
        if not user.is_authenticated:
            return User.objects.none()

        # 1. Super Admin sees ALL
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
            
        # 4. Standard staff sees only themselves
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        """
        🚀 INVITE FLOW:
        1. Auto-assign 'hotel_owner'.
        2. If password provided -> Set it (Manual Mode).
        3. If NO password -> Send Invite Email (Invite Mode).
        """
        user = self.request.user
        save_kwargs = {}

        # Auto-Link Logic
        if user.role == 'OWNER':
            save_kwargs['hotel_owner'] = user
        elif user.role == 'MANAGER':
            save_kwargs['hotel_owner'] = user.hotel_owner

        # 1. Save User (No Password yet)
        instance = serializer.save(**save_kwargs)
        
        # 2. Handle Password Logic
        password = self.request.data.get('password')
        
        if password:
            # A. Manual Setup
            instance.set_password(password)
            instance.save()
        else:
            # B. Invite Flow (No password set)
            instance.set_unusable_password()
            instance.save()
            
            # Generate Link
            uid = urlsafe_base64_encode(force_bytes(instance.pk))
            token = PasswordResetTokenGenerator().make_token(instance)
            invite_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            
            # Send Email
            try:
                send_mail(
                    subject="Welcome to Atithi - Activate Your Account",
                    message=f"Hello {instance.username},\n\nYou have been added to the Atithi Hotel Management System.\n\nPlease click the link below to set your password and activate your account:\n\n{invite_link}\n\nWelcome aboard!",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[instance.email],
                    fail_silently=False
                )
            except Exception as e:
                # Log error but don't crash the request
                print(f"Invite Email Failed: {e}")

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
        Prevent users from accidentally deleting their own account.
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
class SaaSConfigView(viewsets.ModelViewSet):
    """
    Publicly accessible (authenticated) view to get Support Info.
    Write access is restricted to Super Admin only.
    """
    queryset = SaaSConfig.objects.all()
    serializer_class = SaaSConfigSerializer
    
    def get_permissions(self):
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
            
            try:
                user = User.objects.get(email=email)
                
                # Generate Token & ID
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = PasswordResetTokenGenerator().make_token(user)
                
                # Construct Link
                reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
                
                # Send Email
                send_mail(
                    "Password Reset Request - Atithi SaaS",
                    f"Click the link below to reset your password:\n\n{reset_link}\n\nIf you didn't request this, ignore this email.",
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                return Response({"status": "Password reset link sent to email."})
            
            except User.DoesNotExist:
                # Security: Don't reveal if user exists or not
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