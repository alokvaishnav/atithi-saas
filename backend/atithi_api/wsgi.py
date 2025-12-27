"""
WSGI config for atithi_api project.
Updated for Production Deployment on Vercel.
"""

import os
import sys
from django.core.wsgi import get_wsgi_application

# --------------------------------------------------------
# 🚀 VERCEL PATH FIX (CRITICAL)
# --------------------------------------------------------
# This tells Python: "Look inside the 'backend' folder to find my files"
# because Vercel starts in the Root folder, not inside 'backend/'.
current_path = os.path.dirname(os.path.abspath(__file__)) # .../backend/atithi_api
backend_path = os.path.dirname(current_path)              # .../backend
sys.path.append(backend_path)

# 1. Set the default settings module for the 'atithi_api' project.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'atithi_api.settings')

# 2. Initialize the standard Django WSGI application.
application = get_wsgi_application()

# 3. Wrap with WhiteNoise for Static Files (Best Practice)
try:
    from whitenoise import WhiteNoise
    # Explicitly point to staticfiles to ensure they are found
    application = WhiteNoise(application, root=os.path.join(backend_path, 'staticfiles'))
except ImportError:
    pass

# 4. Vercel/Lambda often looks for 'app', so we alias it.
app = application