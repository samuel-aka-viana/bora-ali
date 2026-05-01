from core.image_service import ImageService
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import UserProfile


@receiver(post_delete, sender=UserProfile)
def cleanup_profile_photo(sender, instance, **kwargs):
    ImageService.delete(
        instance.profile_photo.name if instance.profile_photo else ""
    )
