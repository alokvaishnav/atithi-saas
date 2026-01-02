import os
from django.core.wsgi import get_wsgi_application

# Set the default settings module for the 'atithi_api' project
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'atithi_api.settings')

application = get_wsgi_application()