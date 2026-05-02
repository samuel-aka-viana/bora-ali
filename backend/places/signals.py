import threading

from core.image_service import ImageService
from django.db import transaction
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Place, Visit, VisitItem


def _delete_media_async(path: str) -> None:
    if not path:
        return

    def _run() -> None:
        ImageService.delete(path)

    transaction.on_commit(lambda: threading.Thread(target=_run, daemon=True).start())


@receiver(post_delete, sender=Place)
def cleanup_place_cover_photo(sender, instance, **kwargs):
    _delete_media_async(instance.cover_photo.name if instance.cover_photo else "")


@receiver(post_delete, sender=Visit)
def cleanup_visit_photo(sender, instance, **kwargs):
    _delete_media_async(instance.photo_path or (instance.photo.name if instance.photo else ""))


@receiver(post_delete, sender=VisitItem)
def cleanup_visit_item_photo(sender, instance, **kwargs):
    _delete_media_async(instance.photo_path or (instance.photo.name if instance.photo else ""))
