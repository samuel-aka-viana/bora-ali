import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserSession(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="active_session",
        verbose_name=_("user"),
    )
    session_key = models.UUIDField(default=uuid.uuid4, verbose_name=_("session key"))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "accounts_user_session"
        verbose_name = _("user session")
        verbose_name_plural = _("user sessions")

    def __str__(self) -> str:
        return f"{self.user.username} — {self.session_key}"

    def rotate(self) -> None:
        self.session_key = uuid.uuid4()
        self.save(update_fields=["session_key"])


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
        verbose_name=_("user"),
    )
    nickname = models.CharField(max_length=80, blank=True, verbose_name=_("nickname"))
    profile_photo = models.FileField(
        upload_to="profiles/",
        blank=True,
        null=True,
        verbose_name=_("profile photo"),
    )

    class Meta:
        db_table = "accounts_user_profile"
        verbose_name = _("user profile")
        verbose_name_plural = _("user profiles")

    def __str__(self) -> str:
        return self.user.username
