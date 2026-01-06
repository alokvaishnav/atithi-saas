import os
import sys
from django.core.wsgi import get_wsgi_application

# ==============================================================================
# 1. PATH CONFIGURATION
# ==============================================================================
# This adds the project root to the Python path.
# Essential for locating modules when running on VPS or Shared Hosting.
path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if path not in sys.path:
    sys.path.append(path)

# ==============================================================================
# 2. SETTINGS MODULE
# ==============================================================================
# Points to your settings.py file.
# Ensure 'atithi_api' matches the folder name containing settings.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'atithi_api.settings')

# ==============================================================================
# 3. GET WSGI APPLICATION (With Error Logging)
# ==============================================================================
# We wrap this in a try-except block to capture startup errors in logs.
try:
    application = get_wsgi_application()
    print("WSGI Application loaded successfully.")
except Exception as e:
    # This prints the error to the server error log (stderr), 
    # which is critical for debugging 500 errors in production.
    print(f"CRITICAL ERROR: Failed to load WSGI application: {e}", file=sys.stderr)
    raise e

# ==============================================================================
# 4. SERVERLESS ALIAS (Vercel / AWS Lambda)
# ==============================================================================
# Many serverless platforms look for a variable named 'app' by default.
app = application