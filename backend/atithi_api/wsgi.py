"""
WSGI config for atithi_api project.
Updated for Production Deployment on Vercel.
Includes Critical Patches for ReportLab 4.0+ compatibility.
"""

import os
import sys
from io import BytesIO

# --------------------------------------------------------
# 🚀 MONKEY PATCH: FIX REPORTLAB 4.0 vs XHTML2PDF 0.2.5
# --------------------------------------------------------
# ReportLab 4.0 removed several features that xhtml2pdf 0.2.5 needs.
# We inject them manually to prevent the server from crashing.

import reportlab.lib.utils
import reportlab.platypus.frames

# Patch 1: Restore 'getStringIO'
if not hasattr(reportlab.lib.utils, 'getStringIO'):
    reportlab.lib.utils.getStringIO = BytesIO

# Patch 2: Restore 'ShowBoundaryValue' (Caused the latest crash)
if not hasattr(reportlab.platypus.frames, 'ShowBoundaryValue'):
    reportlab.platypus.frames.ShowBoundaryValue = 0

# --------------------------------------------------------
# 🚀 VERCEL PATH FIX
# --------------------------------------------------------
current_path = os.path.dirname(os.path.abspath(__file__)) 
backend_path = os.path.dirname(current_path)              
sys.path.append(backend_path)

# 1. Set default settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'atithi_api.settings')

from django.core.wsgi import get_wsgi_application

# 2. Initialize Django Application
application = get_wsgi_application()

# 3. WhiteNoise for Static Files
try:
    from whitenoise import WhiteNoise
    application = WhiteNoise(application, root=os.path.join(backend_path, 'staticfiles'))
except ImportError:
    pass

app = application