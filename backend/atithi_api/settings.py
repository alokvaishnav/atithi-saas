"""
Django settings for atithi_api project.
Updated for Atithi HMS Enterprise v2.1 - Deployment Optimized
"""

from pathlib import Path
import os
import dj_database_url
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-=n8%jjzrhdr)$7&npl*kyl6lbp(%f@79b_+tp*bo6_ppe(0m=v')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['*'] # Render handles specific host security via environment

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic', # Must be before staticfiles
    'django.contrib.staticfiles',
    
    # 📦 Professional SaaS Stack
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # 🏨 Internal Apps
    'core',
    'hotel',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 👈 Priority #1
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # 👈 Priority #2
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# --------------------------------------------------------
# 🔒 AUTHENTICATION & REST SECURITY
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
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
}

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
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'atithi_db',
        'USER': 'atithi_admin',
        'PASSWORD': 'secure_password_123',
        'HOST': 'db', 
        'PORT': 5432,
    }
}

# Render.com External URL
MANUAL_DB_URL = "postgresql://atithi_admin:LxawXbutHDKbsN3jYHNDdShDTcYBfCDv@dpg-d522vgnpm1nc73as3alg-a.singapore-postgres.render.com/atithi_db_4ekr"

if os.environ.get('DATABASE_URL'):
    DATABASES['default'] = dj_database_url.config(conn_max_age=600, ssl_require=True)
else:
    DATABASES['default'] = dj_database_url.config(
        default=MANUAL_DB_URL,
        conn_max_age=600,
        ssl_require=True
    )

# --------------------------------------------------------
# 📧 EMAIL AUTOMATION CONFIGURATION
# --------------------------------------------------------
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
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

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# WhiteNoise storage optimized for production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# 🌐 CORS CONFIGURATION
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# ☁️ CLOUD OVERRIDE (Render.com Logic)
if os.environ.get('RENDER'):
    CORS_ALLOW_ALL_ORIGINS = True  # Allows your frontend to talk to backend
    DEBUG = False
    RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
    if RENDER_EXTERNAL_HOSTNAME:
        ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# RAZORPAY SETTINGS
# Replace these with your actual keys from Razorpay Dashboard
RAZORPAY_KEY_ID = "rzp_test_YOUR_KEY_HERE" 
RAZORPAY_KEY_SECRET = "YOUR_SECRET_HERE"