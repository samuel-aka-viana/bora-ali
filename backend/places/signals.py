from django.db.models.signals import post_delete
from django.dispatch import receiver

from core.image_service import ImageService
from .models import Place, Visit, VisitItem


@receiver(post_delete, sender=Place)
def cleanup_place_cover_photo(sender, instance, **kwargs):
    ImageService.delete(instance.cover_photo.name if instance.cover_photo else "")


@receiver(post_delete, sender=Visit)
def cleanup_visit_photo(sender, instance, **kwargs):
    ImageService.delete(instance.photo.name if instance.photo else "")


@receiver(post_delete, sender=VisitItem)
def cleanup_visit_item_photo(sender, instance, **kwargs):
    ImageService.delete(instance.photo.name if instance.photo else "")
