import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ==============================================================================
# 1. SECURITY SETTINGS
# ==============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
# Use environment variable if available, otherwise fallback to dev key
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-local-dev-key-CHANGE-IN-PROD')

# SECURITY WARNING: don't run with debug turned on in production!
# Set to False in production for security
DEBUG = True

# ALLOWED_HOSTS: Add your AWS IP and any domains you use
# Including '*' is convenient for dev but insecure for prod.
ALLOWED_HOSTS = ['*', '16.171.144.127', 'localhost', '127.0.0.1']

# ==============================================================================
# 2. INSTALLED APPS
# ==============================================================================

INSTALLED_APPS = [
    'jazzmin',  # 🟢 MUST be at the very top for the theme to load
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third Party Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters', # Required for search/filter functionalities
    
    # Local Apps
    'core',   # Auth & Users
    'hotel',  # Main Logic App
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # Must be at the top for React to work
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Ensure this matches your actual project folder name
ROOT_URLCONF = 'atithi_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

# ==============================================================================
# 3. DATABASE
# ==============================================================================
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ==============================================================================
# 4. AUTH & PASSWORD
# ==============================================================================

# Custom User Model
AUTH_USER_MODEL = 'core.CustomUser'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ==============================================================================
# 5. INTERNATIONALIZATION & FILES
# ==============================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata' # Set to your local timezone for correct reports
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media Files (User Uploads like Hotel Logos)
# CRITICAL for the Settings Page Logo Upload functionality
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# File Upload Limits (For high-res logos)
# Set to 10MB to prevent server crashes on large uploads
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760 
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760 

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==============================================================================
# 6. REST FRAMEWORK & JWT
# ==============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # Better Error Handling
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    # Pagination default
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Filtering
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),  # Long life for dev convenience
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ==============================================================================
# 7. CORS (CROSS-ORIGIN RESOURCE SHARING)
# ==============================================================================

# CORS Settings (Allow React Frontend & Public Access)
CORS_ALLOW_ALL_ORIGINS = True  # Required for public booking pages
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# ==============================================================================
# 8. EMAIL CONFIGURATION (SMTP)
# ==============================================================================
# Required for Booking Confirmations & Welcome Emails
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com' # Change to your provider (Outlook/Zoho/AWS SES) if needed
EMAIL_PORT = 587
EMAIL_USE_TLS = True

# Note: In your SaaS, these default credentials are used only for system notifications
# or as a fallback if the Hotel Owner hasn't set their own SMTP.
# Ideally, fetch these from env variables.
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'your-system-email@gmail.com') 
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'your-app-password')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# ==============================================================================
# 9. LOGGING CONFIGURATION
# ==============================================================================
# Helps debug Automation/SMTP/WhatsApp issues in production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'hotel': {  # Your app name
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'core': {   # Auth app
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# ==============================================================================
# 10. JAZZMIN ADMIN THEME SETTINGS (Professional SaaS UI)
# ==============================================================================

JAZZMIN_SETTINGS = {
    # Branding
    "site_title": "Atithi SaaS",
    "site_header": "Atithi Command Center",
    "site_brand": "Atithi HQ",
    "welcome_sign": "Welcome to the Command Center",
    "copyright": "Atithi Tech Ltd",
    "search_model": ["core.CustomUser", "hotel.Booking"],

    # UI Customization
    "topmenu_links": [
        {"name": "Dashboard", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Public Site", "url": "/", "new_window": True},
        {"name": "Support", "url": "https://support.atithi.com", "new_window": True},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    
    # Icons (FontAwesome)
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        
        # Hotel Operations
        "hotel.Booking": "fas fa-calendar-check",
        "hotel.Room": "fas fa-bed",
        "hotel.Guest": "fas fa-user-tie",
        "hotel.HotelSettings": "fas fa-hotel",
        "hotel.InventoryItem": "fas fa-boxes",
        "hotel.MenuItem": "fas fa-utensils",
        "hotel.Order": "fas fa-receipt",
        "hotel.HousekeepingTask": "fas fa-broom",
        
        # Finance
        "hotel.BookingPayment": "fas fa-file-invoice-dollar",
        "hotel.BookingCharge": "fas fa-file-invoice",
        "hotel.Expense": "fas fa-money-bill-wave",
        
        # SaaS Management
        "hotel.SubscriptionPlan": "fas fa-gem",
        "hotel.PlanFeature": "fas fa-list-check",
        
        # System
        "hotel.PlatformSettings": "fas fa-cogs",
        "hotel.ActivityLog": "fas fa-history",
        "hotel.GlobalAnnouncement": "fas fa-bullhorn",
    },
    
    # Order of Sidebar Menus
    "order_with_respect_to": [
        "hotel.Booking", 
        "hotel.Room", 
        "hotel.Guest", 
        "hotel.BookingPayment", 
        "hotel.Expense", 
        "core.CustomUser", 
        "hotel.HotelSettings",
        "hotel.PlatformSettings"
    ],

    # Custom CSS/JS (Optional)
    "custom_css": None,
    "custom_js": None,
    "show_ui_builder": False,  # Set to True to customize colors live
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-dark",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "theme": "flatly",  # Professional Flat Theme
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}