from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()

# ==========================================
# STAFF & USER MANAGEMENT VIEWSET
# ==========================================

class StaffViewSet(viewsets.ModelViewSet):  # Renamed to match router in urls.py
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
        - OTHERS: Cannot see the staff directory.
        """
        user = self.request.user
        
        # Security: Prevent unauthenticated access (double check)
        if not user.is_authenticated:
            return User.objects.none()

        if user.role == 'OWNER':
            return User.objects.all().order_by('-date_joined')
        
        # Managers can manage lower staff but not the property owner
        if user.role == 'MANAGER':
            return User.objects.exclude(role='OWNER').order_by('-date_joined')
            
        # Standard staff shouldn't see the full list via API usually, 
        # but if they do, show only themselves or empty list
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        """
        🛡️ SECURITY LOGIC:
        Intercepts the creation process to properly hash the password
        before saving it to the database. Plain text passwords will not work.
        """
        user = serializer.save()
        password = self.request.data.get('password')
        
        # Ensure password is set securely using set_password (hashes it)
        if password:
            user.set_password(password)
            user.save()

    def perform_update(self, serializer):
        """
        🛡️ UPDATE LOGIC:
        If a password is provided during an update, re-hash it.
        """
        user = serializer.save()
        password = self.request.data.get('password')
        
        if password:
            user.set_password(password)
            user.save()

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