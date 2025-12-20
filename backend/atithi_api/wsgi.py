"""
WSGI config for atithi_api project.
Updated for Production Deployment with WhiteNoise Static Handling.
"""

import os
from django.core.wsgi import get_wsgi_application

# 1. Set the default settings module for the 'atithi_api' project.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'atithi_api.settings')

# 2. Initialize the standard Django WSGI application.
application = get_wsgi_application()

# 3. Wrap the application with WhiteNoise to serve static files in production.
# This allows gunicorn to serve your CSS, JS, and Images directly.
try:
    from whitenoise import WhiteNoise
    application = WhiteNoise(application)
except ImportError:
    # If whitenoise is not installed (local dev), fall back to standard app
    pass