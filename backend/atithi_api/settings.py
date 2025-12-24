"""
Django settings for atithi_api project.
Updated for Atithi HMS Enterprise v2.5 - Production Ready
"""

from pathlib import Path
import os
import dj_database_url
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --------------------------------------------------------
# 🔐 SECURITY CONFIGURATION
# --------------------------------------------------------
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-=n8%jjzrhdr)$7&npl*kyl6lbp(%f@79b_+tp*bo6_ppe(0m=v')

# SECURITY WARNING: don't run with debug turned on in production!
# On Render, set the Environment Variable DEBUG = False
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# 🚀 SECURITY FIX: Allow specific hosts
# On Render, this defaults to allowing all if not specified
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# --------------------------------------------------------
# 📦 INSTALLED APPS
# --------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic', # Optimized Static Files
    'django.contrib.staticfiles',
    
    # ⚡ 3rd Party SaaS Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # 🏨 Atithi Internal Apps
    'core',
    'hotel',
]

# --------------------------------------------------------
# ⚙️ MIDDLEWARE
# --------------------------------------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 👈 Must be at the very top
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # 👈 Optimized Static File Serving
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'atithi_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'atithi_api.wsgi.application'

# --------------------------------------------------------
# 🗄️ DATABASE CONFIGURATION (Render.com)
# --------------------------------------------------------
# Default to SQLite for safety, overridden by PostgreSQL below
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 🚀 PRODUCTION DATABASE CONNECTION
# This handles both Local Development (connecting to Cloud DB) and Production Deployment
# Note: Ensure this URL matches your internal Render DB URL for best performance
MANUAL_DB_URL = "postgresql://atithi_admin:LxawXbutHDKbsN3jYHNDdShDTcYBfCDv@dpg-d522vgnpm1nc73as3alg-a.singapore-postgres.render.com/atithi_db_4ekr"

if os.environ.get('DATABASE_URL'):
    # Production Environment (Render automatically sets DATABASE_URL)
    DATABASES['default'] = dj_database_url.config(conn_max_age=600, ssl_require=True)
else:
    # Local Development (Connect to Cloud DB manually)
    DATABASES['default'] = dj_database_url.config(
        default=MANUAL_DB_URL,
        conn_max_age=600,
        ssl_require=True
    )

# --------------------------------------------------------
# 🔒 AUTH & JWT SETTINGS
# --------------------------------------------------------
AUTH_USER_MODEL = 'core.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7), # Extended for better UX
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
}

# --------------------------------------------------------
# 🌐 CORS & CSRF (Critical for Frontend Connection)
# --------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://atithi-saas-frontend.vercel.app", # Your Frontend URL
    "https://atithi-saas-8yopcvwvq-aloks-projects-6839c285.vercel.app"
]

# 🚀 Allow all origins in production if strict list fails (Helps prevent CORS errors during testing)
CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True

# 🛡️ CSRF Trusted Origins (Required for Django 4.0+)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "https://atithi-saas.onrender.com",
    "https://atithi-saas-frontend.vercel.app",
    "https://atithi-saas-8yopcvwvq-aloks-projects-6839c285.vercel.app"
]

# 🛡️ FIX FOR RENDER HTTPS (Prevents Redirect Loops & Admin Login Issues)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --------------------------------------------------------
# 📧 EMAIL AUTOMATION
# --------------------------------------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_USER', 'your-hotel-email@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PASS', 'your-app-password')
DEFAULT_FROM_EMAIL = f"Atithi Hotel Manager <{EMAIL_HOST_USER}>"

# --------------------------------------------------------
# 📁 MEDIA & STATIC FILES
# --------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata' # 🇮🇳 Indian Standard Time
USE_I18N = True
USE_TZ = True 

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Media files (ID Proofs, Invoices)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# --------------------------------------------------------
# 💳 RAZORPAY CONFIGURATION (Live Mode Active)
# --------------------------------------------------------
# These are kept here for reference, but your Views currently use hardcoded keys to ensure safety.
RAZORPAY_KEY_ID = "rzp_live_RvBOgLN1rxP9zd"
RAZORPAY_KEY_SECRET = "LhT40VfsBxIX5VUJjrTE2W9h"

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'