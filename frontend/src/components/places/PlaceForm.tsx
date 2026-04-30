import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Place, PlaceStatus } from "../../types/place";
import { PLACE_STATUSES } from "../../utils/constants";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { getApiErrorState } from "../../services/api-errors";

type PlacePayload = Partial<Omit<Place, "cover_photo">> & { cover_photo?: string | File };

type Props = {
  initial?: Partial<Place>;
  onSubmit: (data: PlacePayload) => Promise<void>;
};

export function PlaceForm({ initial = {}, onSubmit }: Props) {
  const { t } = useTranslation();
  const [f, setF] = useState<Partial<Place>>({ status: "want_to_visit", ...initial });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial.cover_photo ?? null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upd = (k: keyof Place) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    setPreview(file ? URL.createObjectURL(file) : (initial.cover_photo ?? null));
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.name?.trim()) {
          setFieldErrors({ name: t("placeForm.nameRequired") });
          return;
        }
        setFieldErrors({});
        setSubmitError("");
        try {
          await onSubmit({ ...f, ...(coverFile ? { cover_photo: coverFile } : {}) });
        } catch (error) {
          const apiError = getApiErrorState(error, t("placeForm.saveError"));
          setSubmitError(apiError.message);
          setFieldErrors(apiError.fieldErrors);
        }
      }}
      className="space-y-3"
    >
      <Input label={t("placeForm.name")} value={f.name || ""} onChange={upd("name")} error={fieldErrors.name} />
      <Input label={t("placeForm.category")} value={f.category || ""} onChange={upd("category")} error={fieldErrors.category} />
      <Input label={t("placeForm.address")} value={f.address || ""} onChange={upd("address")} error={fieldErrors.address} />
      <Input label={t("placeForm.instagram")} value={f.instagram_url || ""} onChange={upd("instagram_url")} error={fieldErrors.instagram_url} />
      <Input label={t("placeForm.maps")} value={f.maps_url || ""} onChange={upd("maps_url")} error={fieldErrors.maps_url} />
      <Select
        label={t("placeForm.status")}
        value={f.status}
        onChange={(e) => setF({ ...f, status: e.target.value as PlaceStatus })}
        error={fieldErrors.status}
      >
        {PLACE_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{t(`status.${s.value}`)}</option>
        ))}
      </Select>
      <Textarea label={t("placeForm.notes")} value={f.notes || ""} onChange={upd("notes")} error={fieldErrors.notes} />

      <div className="space-y-1">
        <span className="text-sm font-medium">{t("placeForm.coverPhoto")}</span>
        {preview && (
          <img
            src={preview}
            alt={t("placeForm.coverPreviewAlt")}
            className="w-full h-40 object-cover rounded-lg border border-border"
          />
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          {preview ? t("placeForm.changePhoto") : t("placeForm.uploadPhoto")}
        </Button>
        {coverFile && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => { setCoverFile(null); setPreview(initial.cover_photo ?? null); }}
          >
            {t("placeForm.removePhoto")}
          </Button>
        )}
      </div>

      {submitError && <ErrorMessage message={submitError} />}
      <Button type="submit" className="w-full">{t("placeForm.save")}</Button>
    </form>
  );
}
