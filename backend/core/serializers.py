from rest_framework import serializers
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from .models import User, SaaSConfig, Subscription

# 👇 NEW: Subscription Serializer for Admin View
class SubscriptionSerializer(serializers.ModelSerializer):
    days_left = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = ['plan_name', 'expiry_date', 'is_active', 'days_left', 'license_key']

class UserSerializer(serializers.ModelSerializer):
    # Added hotel_name helper for Frontend Context (Sidebar/Header)
    hotel_name = serializers.CharField(source='get_hotel_name', read_only=True)
    
    # 👇 NEW: Include Subscription details if available (For Admin Panel)
    subscription = SubscriptionSerializer(read_only=True)

    class Meta:
        model = User
        # 👇 ADDED 'is_superuser' to fields list (Critical for Frontend Logic)
        fields = [
            'id', 'username', 'email', 'role', 'phone', 
            'password', 'hotel_owner', 'date_joined', 
            'hotel_name', 'subscription', 'is_superuser'
        ]
        
        # 'hotel_owner', 'hotel_name', 'subscription', 'is_superuser' are read-only
        read_only_fields = ['id', 'date_joined', 'hotel_owner', 'hotel_name', 'subscription', 'is_superuser']
        
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        """
        Create and return a new User instance.
        Handles password hashing and any extra fields automatically.
        """
        # Extract password to hash it securely
        password = validated_data.pop('password', None)
        
        # Create user instance with remaining data
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

# ==========================================
# 👇 NEW: PUBLIC REGISTRATION SERIALIZER
# ==========================================
class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Handles Public Sign-Ups.
    1. Creates the User (Owner).
    2. Auto-creates a 14-Day Trial Subscription.
    """
    password = serializers.CharField(write_only=True)
    hotel_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'phone', 'hotel_name']

    def create(self, validated_data):
        # Extract hotel name (frontend sends it, but it's not a direct User field)
        hotel_name_input = validated_data.pop('hotel_name', 'My New Hotel')
        
        # 1. Create User (Force role to OWNER)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
            role='OWNER', 
            is_active=True
        )
        
        # 2. Create Default Subscription (14 Day Trial)
        Subscription.objects.create(
            owner=user,
            plan_name='TRIAL',
            is_active=True
        )
        
        # Note: We rely on the User model's signal or the Settings page 
        # to create the actual PropertySetting object later, 
        # or we could create it here if we imported PropertySetting (avoiding circular imports).
        
        return user

# ==========================================
# 👇 NEW: PASSWORD RESET SERIALIZERS
# ==========================================

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=6)
    token = serializers.CharField()
    uidb64 = serializers.CharField()

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uidb64']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid Token or User ID")

        if not PasswordResetTokenGenerator().check_token(user, attrs['token']):
            raise serializers.ValidationError("Token is invalid or expired")

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['password'])
        user.save()
        return user