import logging
from django.apps import AppConfig

# Setup a logger to track startup status
logger = logging.getLogger(__name__)

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = 'Core Authentication & Users'

    def ready(self):
        """
        Import signals when the app starts to register signal handlers.
        """
        try:
            # We import this inside ready() to ensure the models are loaded first.
            # This registers the signal handlers (listeners).
            import core.signals
            logger.info("Core App: Signals registered successfully.")
            
        except ImportError as e:
            # This catches issues if signals.py is missing or has bad imports
            logger.warning(f"Core App: Failed to import signals. Automation (e.g., Welcome Emails) may not work. Error: {e}")
            
        except Exception as e:
            # Catches any other unexpected errors during app startup
            logger.error(f"Core App: App startup error: {e}")