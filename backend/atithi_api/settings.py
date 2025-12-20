"""
Django settings for atithi_api project.
Updated for Atithi HMS v2.0 - Email Automation & Enterprise Security
"""

from pathlib import Path
import os
import dj_database_url
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-=n8%jjzrhdr)$7&npl*kyl6lbp(%f@79b_+tp*bo6_ppe(0m=v'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'core',
    'hotel',
    'corsheaders',
]

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

# REST Framework & JWT Configuration
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

MANUAL_DB_URL = "postgresql://atithi_admin:LxawXbutHDKbsN3jYHNDdShDTcYBfCDv@dpg-d522vgnpm1nc73as3alg-a.singapore-postgres.render.com/atithi_db_4ekr"

if 'DATABASE_URL' in os.environ:
    DATABASES['default'] = dj_database_url.config(conn_max_age=600, ssl_require=True)
elif not os.environ.get('DOCKER_ENV'):
    DATABASES['default'] = dj_database_url.config(
        default=MANUAL_DB_URL,
        conn_max_age=600,
        ssl_require=True
    )

# --------------------------------------------------------
# 📧 EMAIL AUTOMATION CONFIGURATION
# --------------------------------------------------------
# For Gmail: Use an "App Password" (16 digits) from Google Account Security
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-hotel-email@gmail.com' # 👈 Update with your email
EMAIL_HOST_PASSWORD = 'your-app-password'      # 👈 Update with your App Password
DEFAULT_FROM_EMAIL = f"Atithi Hotel Manager <{EMAIL_HOST_USER}>"

# --------------------------------------------------------

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata' # 👈 Updated for Indian Standard Time
USE_I18N = True
USE_TZ = True 

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Use Professional User Model
AUTH_USER_MODEL = 'core.User'

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# --------------------------------------------------------
# ☁️ CLOUD CONFIGURATION (Render.com Logic)
# --------------------------------------------------------
if os.environ.get('RENDER'):
    CORS_ALLOW_ALL_ORIGINS = True