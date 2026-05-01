import io
import pytest
from django.test import override_settings
from model_bakery import baker
from PIL import Image
from rest_framework.test import APIRequestFactory
from accounts.serializers import UserSerializer


def make_jpeg():
    buf = io.BytesIO()
    Image.new("RGB", (10, 10)).save(buf, format="JPEG")
    buf.seek(0)
    buf.name = "photo.jpg"
    buf.content_type = "image/jpeg"
    buf.size = len(buf.getvalue())
    return buf


_STORAGE_SETTINGS = dict(
    SECRET_KEY="test-secret-key-long-enough-for-hkdf-derivation-1234",
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    },
)


@pytest.mark.django_db
@override_settings(**_STORAGE_SETTINGS)
def test_profile_photo_saved_under_user_path(tmp_path, settings, django_user_model):
    settings.MEDIA_ROOT = str(tmp_path)
    user = baker.make(django_user_model)
    factory = APIRequestFactory()
    request = factory.patch("/api/auth/me/")
    request.user = user

    photo = make_jpeg()
    serializer = UserSerializer(
        instance=user,
        data={"profile_photo": photo},
        partial=True,
        context={"request": request},
    )
    assert serializer.is_valid(), serializer.errors
    serializer.save()

    from accounts.models import UserProfile
    profile = UserProfile.objects.get(user=user)
    assert profile.profile_photo.name.startswith(f"users/{user.id}/profiles/")


@pytest.mark.django_db
@override_settings(**_STORAGE_SETTINGS)
def test_old_profile_photo_deleted_on_update(tmp_path, settings, django_user_model):
    settings.MEDIA_ROOT = str(tmp_path)
    user = baker.make(django_user_model)
    factory = APIRequestFactory()
    request = factory.patch("/api/auth/me/")
    request.user = user

    # First upload
    s1 = UserSerializer(
        instance=user,
        data={"profile_photo": make_jpeg()},
        partial=True,
        context={"request": request},
    )
    assert s1.is_valid()
    s1.save()

    from accounts.models import UserProfile
    from django.core.files.storage import default_storage
    profile = UserProfile.objects.get(user=user)
    old_path = profile.profile_photo.name
    assert default_storage.exists(old_path)

    # Second upload — old file must be deleted
    s2 = UserSerializer(
        instance=user,
        data={"profile_photo": make_jpeg()},
        partial=True,
        context={"request": request},
    )
    assert s2.is_valid()
    s2.save()

    assert not default_storage.exists(old_path)
