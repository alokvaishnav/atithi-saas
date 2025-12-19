from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # Only Owners and Managers should be able to manage staff
    permission_classes = [permissions.IsAuthenticated]