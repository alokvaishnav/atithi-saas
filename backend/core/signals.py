from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automation Logic:
    1. If a new User is created and their role is 'OWNER':
       - Create a blank 'HotelSettings' entry (needed for hotel name, logo, etc.).
       - Create a default 'License' entry (starts them on a Free Trial).
    """
    if created and instance.role == 'OWNER':
        try:
            # Lazy imports to avoid circular dependency issues
            # (Core depends on Hotel, and Hotel depends on Core)
            from hotel.models import HotelSettings, License
            
            # --- 1. Create Hotel Settings ---
            # using get_or_create prevents duplicates if the signal fires twice
            obj, settings_created = HotelSettings.objects.get_or_create(
                owner=instance,
                defaults={'hotel_name': f"{instance.username}'s Hotel"}
            )
            if settings_created:
                print(f"✅ Auto-created HotelSettings for new owner: {instance.username}")

            # --- 2. Create Default License (SaaS) ---
            # This ensures the user isn't locked out immediately after registering
            lic, license_created = License.objects.get_or_create(
                owner=instance,
                defaults={
                    'plan_type': 'TRIAL',  # Default to Trial
                    'is_active': True
                }
            )
            if license_created:
                print(f"✅ Auto-created Trial License for new owner: {instance.username}")
                
        except ImportError:
            # This happens if the 'hotel' app isn't ready yet or doesn't exist
            print("⚠️ Could not import Hotel models. (Hotel app might be missing or broken)")
        except Exception as e:
            print(f"❌ Error in create_user_profile signal: {e}")