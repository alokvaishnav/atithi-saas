from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        """
        Create and return a new User instance, given the validated data.
        """
        # Professional encryption for the password field using create_user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'RECEPTIONIST'),
            phone=validated_data.get('phone', '')
        )
        return user

    def update(self, instance, validated_data):
        """
        Update and return an existing User instance, given the validated data.
        Handles password hashing if it is being changed.
        """
        # 1. Handle Password Separate (if provided)
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password) # Hashes the password securely

        # 2. Update other fields standardly
        return super().update(instance, validated_data)