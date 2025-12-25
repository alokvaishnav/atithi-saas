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
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-=n8%jjzrhdr)$7&npl*kyl6lbp(%f@79b_+tp*bo6_ppe(0m=v')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
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
    'whitenoise.runserver_nostatic',
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
    'corsheaders.middleware.CorsMiddleware', 
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
# 🗄️ DATABASE CONFIGURATION
# --------------------------------------------------------
MANUAL_DB_URL = os.environ.get('MANUAL_DB_URL') 

if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(conn_max_age=600, ssl_require=True)
    }
elif MANUAL_DB_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=MANUAL_DB_URL,
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
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
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
}

# --------------------------------------------------------
# 🌐 CORS & CSRF
# --------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "https://atithi-saas-frontend.vercel.app", 
    # "http://localhost:5173", # Keep for local testing
]

CSRF_TRUSTED_ORIGINS = [
    "https://atithi-saas.onrender.com",
    "https://atithi-saas-frontend.vercel.app",
]

# --------------------------------------------------------
# 📧 EMAIL AUTOMATION & PASSWORD RESET
# --------------------------------------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_USER', 'your-hotel-email@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PASS', 'your-app-password')
DEFAULT_FROM_EMAIL = f"Atithi Support <{EMAIL_HOST_USER}>"

# URL used in Password Reset Emails (Points to Frontend)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://atithi-saas-frontend.vercel.app')

# --------------------------------------------------------
# 🚀 CELERY & REDIS (Async Tasks)
# --------------------------------------------------------
# Use Redis Cloud URL in production, localhost in development
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

# --------------------------------------------------------
# 📱 TWILIO / WHATSAPP CONFIG
# --------------------------------------------------------
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER') # e.g., '+123456789' or 'whatsapp:+14155238886'

# --------------------------------------------------------
# 📁 MEDIA & STATIC FILES
# --------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata' 
USE_I18N = True
USE_TZ = True 

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# --------------------------------------------------------
# 💳 RAZORPAY CONFIGURATION
# --------------------------------------------------------
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', "rzp_test_KEY")
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', "SECRET")

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'