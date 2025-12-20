from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer

# ==========================================
# STAFF & USER MANAGEMENT VIEWSET
# ==========================================

class UserViewSet(viewsets.ModelViewSet):
    """
    Handles Staff Onboarding, Role Assignment, and Identity Management.
    Restricted to Authenticated Staff with specific hierarchy logic.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        🔐 HIERARCHY LOGIC:
        - OWNER: Can see and manage all staff members.
        - MANAGER: Can see/manage everyone EXCEPT the Owner.
        - OTHERS: Cannot see the staff directory (handled by App.jsx routing).
        """
        user = self.request.user
        if user.role == 'OWNER':
            return User.objects.all().order_by('-id')
        
        # Managers can manage lower staff but not the property owner
        return User.objects.exclude(role='OWNER').order_by('-id')

    def perform_create(self, serializer):
        """
        🛡️ SECURITY LOGIC:
        Intercepts the creation process to properly hash the password
        before saving it to the database. Plain text passwords will not work.
        """
        password = self.request.data.get('password')
        instance = serializer.save()
        if password:
            instance.set_password(password)
            instance.save()

    def perform_update(self, serializer):
        """
        🛡️ UPDATE LOGIC:
        If a password is provided during an update, re-hash it.
        """
        password = self.request.data.get('password')
        instance = serializer.save()
        if password:
            instance.set_password(password)
            instance.save()

    def destroy(self, request, *args, **kwargs):
        """
        🚫 SAFETY LOGIC:
        Prevent users from accidentally deleting their own accounts.
        """
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {"error": "Security Breach: You cannot delete your own administrative account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)