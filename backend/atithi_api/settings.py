"""
Django settings for atithi_api project.
Updated for Atithi HMS Enterprise v2.5 - Production Ready
Stack: Vercel (Compute) + Supabase (DB/Storage)
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
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-=n8%jjzrhdr)$7&npl*kyl6lbp(%f@79b_+tp*bo6_ppe(0m=v')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Allow Vercel and Localhost
ALLOWED_HOSTS = ['.vercel.app', '.now.sh', 'localhost', '127.0.0.1']

# --------------------------------------------------------
# 📦 INSTALLED APPS
# --------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    
    # ☁️ Supabase Storage (S3 Compatible)
    'storages',
    'django.contrib.staticfiles',
    
    # ⚡ 3rd Party SaaS Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_celery_results', # Added for Async Tasks
    'django_celery_beat',
    
    # 🏨 Atithi Internal Apps
    'core',
    'hotel',
]

# --------------------------------------------------------
# ⚙️ MIDDLEWARE
# --------------------------------------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # 👈 MUST BE FIRST
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
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
        'DIRS': [BASE_DIR / 'hotel/templates'], # For PDF Templates
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'atithi_api.wsgi.application'

# --------------------------------------------------------
# 🗄️ DATABASE CONFIGURATION
# --------------------------------------------------------
# Prioritize DATABASE_URL from Supabase, fallback to SQLite for local dev
DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///db.sqlite3',
        conn_max_age=600,
        ssl_require=True # Supabase Postgres requires SSL
    )
}

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
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/minute', 
        'user': '1000/day'
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60), # 🛡️ SECURE: 60 mins access token
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),    # 7 Days refresh window
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# --------------------------------------------------------
# 🌐 CORS & CSRF (Configured for Vercel)
# --------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    # Add your Vercel Frontend URL here later
    # e.g., "https://atithi-saas.vercel.app"
    os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8000",
    # Add your Backend URL here later
    os.environ.get('BACKEND_URL', 'http://localhost:8000'),
    os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# --------------------------------------------------------
# 📧 EMAIL AUTOMATION & PASSWORD RESET
# --------------------------------------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PASS', '')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# URL used in Password Reset Emails (Points to Frontend)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# --------------------------------------------------------
# 🚀 CELERY & REDIS (Async Tasks)
# --------------------------------------------------------
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'

# --------------------------------------------------------
# 📱 TWILIO / WHATSAPP CONFIG
# --------------------------------------------------------
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')

# --------------------------------------------------------
# 💳 RAZORPAY CONFIGURATION
# --------------------------------------------------------
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --------------------------------------------------------
# ☁️ SUPABASE STORAGE (S3 Compatible)
# --------------------------------------------------------
# SYSTEM SETTINGS
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata' 
USE_I18N = True
USE_TZ = True 

# Whitenoise for Static Files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

if not DEBUG:
    # Production: Use Supabase S3 Storage for Media
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
            "OPTIONS": {
                "access_key": os.environ.get('SUPABASE_ACCESS_KEY_ID'),
                "secret_key": os.environ.get('SUPABASE_SECRET_ACCESS_KEY'),
                "bucket_name": os.environ.get('SUPABASE_BUCKET_NAME', 'media'),
                "endpoint_url": os.environ.get('SUPABASE_S3_ENDPOINT'), # e.g. https://<project>.supabase.co/storage/v1/s3
                "region_name": "us-east-1", # Required placeholder for Supabase
                "default_acl": "public-read",
                "querystring_auth": False,
                "object_parameters": {
                    "CacheControl": "max-age=86400",
                },
            },
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

    # Construct Public URL for Media
    SUPABASE_PROJECT_ID = os.environ.get('SUPABASE_PROJECT_ID')
    SUPABASE_BUCKET_NAME = os.environ.get('SUPABASE_BUCKET_NAME', 'media')
    
    if SUPABASE_PROJECT_ID:
        MEDIA_URL = f"https://{SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/{SUPABASE_BUCKET_NAME}/"
    else:
        MEDIA_URL = '/media/'
else:
    # Local Development
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'