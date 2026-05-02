import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../services/auth.service";
import { getApiErrorState } from "../services/api-errors";
import { validateImageFile, ALLOWED_IMAGE_ACCEPT } from "../utils/url";
import { useAuth } from "../contexts/useAuth";
import { BackButton } from "../components/ui/BackButton";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { AuthImage } from "../components/ui/AuthImage";

export default function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profile_photo_url ?? "");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setPhoto(null);
      setPhotoPreview(user?.profile_photo_url ?? "");
      return;
    }
    const err = validateImageFile(file);
    if (err === "type") {
      setProfileFieldErrors((prev) => ({ ...prev, profile_photo: t("upload.invalidType") }));
      event.target.value = "";
      return;
    }
    if (err === "size") {
      setProfileFieldErrors((prev) => ({ ...prev, profile_photo: t("upload.tooLarge") }));
      event.target.value = "";
      return;
    }
    setProfileFieldErrors((prev) => ({ ...prev, profile_photo: "" }));
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-8">
      <BackButton fallbackTo="/places" />
      <div>
        <h1 className="font-fraunces text-3xl font-bold text-text">{t("account.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("account.subtitle")}</p>
      </div>

      <Card>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              setProfileError("");
              setProfileMessage("");
              setProfileFieldErrors({});
              const updatedUser = await authService.updateMe({
                username,
                email,
                display_name: displayName,
                nickname,
                profile_photo: photo,
              });
              setUser(updatedUser);
              setPhoto(null);
              setPhotoPreview(updatedUser.profile_photo_url);
              setProfileMessage(t("account.profile.saved"));
            } catch (error) {
              const apiError = getApiErrorState(error, t("account.profile.error"));
              setProfileError(apiError.message);
              setProfileFieldErrors(apiError.fieldErrors);
            }
          }}
        >
          <div className="flex items-center gap-4">
            {photoPreview ? (
              <AuthImage
                src={photoPreview}
                alt={t("account.photoAlt")}
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-background text-sm font-semibold text-muted">
                {t("common.photo")}
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text shadow-sm transition hover:border-muted/50 hover:bg-background">
              {t("account.profile.changePhoto")}
              <input type="file" accept={ALLOWED_IMAGE_ACCEPT} className="sr-only" onChange={onPhotoChange} />
            </label>
          </div>

          <Input label={t("account.profile.name")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} error={profileFieldErrors.display_name} />
          <Input label={t("account.profile.nickname")} value={nickname} onChange={(e) => setNickname(e.target.value)} error={profileFieldErrors.nickname} />
          <Input label={t("account.profile.username")} value={username} onChange={(e) => setUsername(e.target.value)} error={profileFieldErrors.username} />
          <Input label={t("account.profile.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={profileFieldErrors.email} />
          {profileMessage && <p className="text-sm font-medium text-primary">{profileMessage}</p>}
          {profileError && <ErrorMessage message={profileError} />}
          <Button type="submit" className="w-full sm:w-auto">{t("account.profile.save")}</Button>
        </form>
      </Card>

      {!user?.is_google_account && (
        <Card>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                setPasswordError("");
                setPasswordMessage("");
                setPasswordFieldErrors({});
                await authService.changePassword({
                  current_password: currentPassword,
                  new_password: newPassword,
                  confirm_password: confirmPassword,
                });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordMessage(t("account.password.saved"));
              } catch (error) {
                const apiError = getApiErrorState(error, t("account.password.error"));
                setPasswordError(apiError.message);
                setPasswordFieldErrors(apiError.fieldErrors);
              }
            }}
          >
            <h2 className="text-lg font-semibold text-text">{t("account.password.title")}</h2>
            <PasswordInput label={t("account.password.current")} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} error={passwordFieldErrors.current_password} />
            <PasswordInput label={t("account.password.next")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={passwordFieldErrors.new_password} />
            <PasswordInput label={t("account.password.confirm")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={passwordFieldErrors.confirm_password} />
            {passwordMessage && <p className="text-sm font-medium text-primary">{passwordMessage}</p>}
            {passwordError && <ErrorMessage message={passwordError} />}
            <Button type="submit" variant="secondary" className="w-full sm:w-auto">{t("account.password.save")}</Button>
          </form>
        </Card>
      )}

      <Button
        type="button"
        variant="danger"
        onClick={async () => {
          await logout();
          navigate("/login", { replace: true });
        }}
        className="w-full sm:w-auto"
      >
        {t("account.menu.logout")}
      </Button>
    </div>
  );
}
