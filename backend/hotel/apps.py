from django.apps import AppConfig

class HotelConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hotel'
    verbose_name = 'Atithi Hotel Management System'

    def ready(self):
        import hotel.signals  # This line activates the automation listeners