from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from .models import CustomUser

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom Login View that requires Hotel ID + Username + Password.
    It enforces Multi-Tenant security by verifying the user belongs to the requested Hotel ID.
    """
    def post(self, request, *args, **kwargs):
        hotel_code = request.data.get('hotel_code')
        username = request.data.get('username')
        
        # 1. Pre-validation: Fetch User to check constraints before verifying password
        try:
            # We filter by username to check existence and role
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            # Return standard unauthorized error if user doesn't exist
            return Response({"detail": "No active account found with the given credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Security Check: Enforce Hotel ID for Non-Superusers
        if not user.is_superuser:
            if not hotel_code:
                return Response({"detail": "Hotel ID is required for staff login."}, status=status.HTTP_400_BAD_REQUEST)
            
            # STRICT CHECK: The user's assigned hotel_code must match the input
            if user.hotel_code != hotel_code:
                return Response({"detail": "This user does not belong to the specified Hotel ID."}, status=status.HTTP_401_UNAUTHORIZED)

        # 3. Standard Authentication (Verifies Password & Generates Token)
        # We let the parent class handle the password check and token creation
        response = super().post(request, *args, **kwargs)
        
        # 4. Success: Inject User Data into Response
        if response.status_code == 200:
            response.data['role'] = user.role
            response.data['hotel_code'] = user.hotel_code
            response.data['user_id'] = user.id
            response.data['username'] = user.username
            response.data['is_superuser'] = user.is_superuser
        
        return response