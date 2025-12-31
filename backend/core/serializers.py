from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    # Helper to show "Receptionist" instead of "RECEPTIONIST" if needed
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        # REMOVED 'phone' because it does not exist in your core/models.py
        # Added 'role_display' to help the frontend
        fields = ['id', 'username', 'email', 'role', 'role_display', 'hotel_owner']