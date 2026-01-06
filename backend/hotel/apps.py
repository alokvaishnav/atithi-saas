import logging
from django.apps import AppConfig

# Setup a logger to track startup status
logger = logging.getLogger(__name__)

class HotelConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hotel'
    verbose_name = 'Atithi Hotel Management System'

    def ready(self):
        """
        This method is called when Django starts. 
        We use it to import signals so that our automation 
        (like sending emails on booking creation) works correctly.
        """
        try:
            # Import signals to register the event listeners (pre_save/post_save)
            import hotel.signals
            logger.info("Atithi HMS: Signals registered successfully.")
            
        except ImportError as e:
            # This catches common errors like typos in signals.py
            logger.warning(f"Atithi HMS: Failed to import signals. Automation (Emails/Logs) may not work. Error: {e}")
            
        except Exception as e:
            # Catches any other unexpected errors during app startup
            logger.error(f"Atithi HMS: App startup error: {e}")