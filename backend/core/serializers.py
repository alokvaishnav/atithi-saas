from rest_framework import serializers
from .models import User, SaaSConfig

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Added 'hotel_owner' and 'date_joined' to fields
        fields = ['id', 'username', 'email', 'role', 'phone', 'password', 'hotel_owner', 'date_joined']
        
        # 'hotel_owner' is read-only because it's set automatically by the System (View), not the user
        read_only_fields = ['id', 'date_joined', 'hotel_owner']
        
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        """
        Create and return a new User instance.
        Handles password hashing and any extra fields (like hotel_owner) automatically.
        """
        # Extract password to hash it securely
        password = validated_data.pop('password', None)
        
        # Create user instance with all remaining data (username, email, role, hotel_owner, etc.)
        instance = self.Meta.model(**validated_data)
        
        if password is not None:
            instance.set_password(password)
        
        instance.save()
        return instance

    def update(self, instance, validated_data):
        """
        Update User instance.
        Hashes password if provided, otherwise leaves it unchanged.
        """
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
            
        return super().update(instance, validated_data)

class SaaSConfigSerializer(serializers.ModelSerializer):
    """
    Serializer for the Software Company Settings (Support Page Info).
    """
    class Meta:
        model = SaaSConfig
        fields = '__all__'