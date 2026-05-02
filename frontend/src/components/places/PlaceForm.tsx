import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Place, PlaceStatus } from "../../types/place";
import { PLACE_STATUSES } from "../../utils/constants";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { LocationPicker } from "../ui/LocationPicker";
import { AuthImage } from "../ui/AuthImage";
import { api } from "../../services/api";
import { getApiErrorState } from "../../services/api-errors";
import { validateImageFile, ALLOWED_IMAGE_ACCEPT } from "../../utils/url";
import { geocodeAddress } from "../../services/geocoding.service";

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
  const [geocoding, setGeocoding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const lastGeocodedAddressRef = useRef<string>("");

  const [resolvingUrl, setResolvingUrl] = useState(false);

  const upd = (k: keyof Place) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const handleExtractCoords = useCallback(async () => {
    const url = f.maps_url ?? "";
    if (!url) return;

    // tenta client-side primeiro (URLs longas)
    const localMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? url.match(/\/maps\/search\/(-?\d+\.\d+)[,+\s]+(-?\d+\.\d+)/);
    if (localMatch) {
      setF((prev) => ({ ...prev, latitude: localMatch[1], longitude: localMatch[2] }));
      return;
    }

    // URL curta: chama o backend para expandir
    setResolvingUrl(true);
    try {
      const res = await api.post("places/resolve-maps-url/", { url });
      setF((prev) => ({ ...prev, latitude: res.data.latitude, longitude: res.data.longitude }));
      setFieldErrors((prev) => { const n = { ...prev }; delete n.maps_url; return n; });
    } catch {
      setFieldErrors((prev) => ({ ...prev, maps_url: t("placeForm.coordsNotFound") }));
    } finally {
      setResolvingUrl(false);
    }
  }, [f.maps_url, t]);

  async function handleAddressBlur() {
    const address = f.address?.trim() ?? "";
    if (address.length < 5 || address === lastGeocodedAddressRef.current) return;
    geocodeAbortRef.current?.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;
    setGeocoding(true);
    const coords = await geocodeAddress(address, controller.signal);
    setGeocoding(false);
    if (!coords) return;
    lastGeocodedAddressRef.current = address;
    setF((prev) => ({ ...prev, latitude: String(coords.lat), longitude: String(coords.lon) }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setCoverFile(null);
      setPreview(initial.cover_photo ?? null);
      return;
    }
    const err = validateImageFile(file);
    if (err === "type") {
      setFieldErrors({ cover_photo: t("upload.invalidType") });
      e.target.value = "";
      return;
    }
    if (err === "size") {
      setFieldErrors({ cover_photo: t("upload.tooLarge") });
      e.target.value = "";
      return;
    }
    setFieldErrors({});
    setCoverFile(file);
    setPreview(URL.createObjectURL(file));
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
      <Input label={t("placeForm.name")} value={f.name || ""} onChange={upd("name")} error={fieldErrors.name} required />
      <Input label={t("placeForm.category")} value={f.category || ""} onChange={upd("category")} error={fieldErrors.category} />
      <Input
        label={t("placeForm.address")}
        value={f.address || ""}
        onChange={upd("address")}
        onBlur={handleAddressBlur}
        error={geocoding ? t("placeForm.geocoding") : fieldErrors.address}
      />
      <Input label={t("placeForm.instagram")} value={f.instagram_url || ""} onChange={upd("instagram_url")} error={fieldErrors.instagram_url} />
      <div className="space-y-1.5">
        <span className="text-sm font-medium">{t("placeForm.maps")}</span>
        <div className="flex gap-2">
          <Input
            value={f.maps_url || ""}
            onChange={upd("maps_url")}
            error={fieldErrors.maps_url}
            className="flex-1"
          />
          <button
            type="button"
            title={t("placeForm.extractCoords")}
            onClick={handleExtractCoords}
            disabled={resolvingUrl || !f.maps_url}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-none stroke-current stroke-2 ${resolvingUrl ? "animate-spin" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>
      <LocationPicker
        label={t("placeForm.location")}
        hint={t("placeForm.locationHint")}
        clearLabel={t("placeForm.clearLocation")}
        useCurrentLocationLabel={t("placeForm.useCurrentLocation")}
        locatingLabel={t("placeForm.locating")}
        geolocationUnavailableMessage={t("placeForm.geolocationUnavailable")}
        geolocationDeniedMessage={t("placeForm.geolocationDenied")}
        geolocationErrorMessage={t("placeForm.geolocationError")}
        zoomInLabel={t("placeForm.zoomIn")}
        zoomOutLabel={t("placeForm.zoomOut")}
        latitude={f.latitude}
        longitude={f.longitude}
        onChange={({ latitude, longitude }) => setF({ ...f, latitude, longitude })}
      />
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

      <div className="space-y-1.5">
        <span className="text-sm font-medium">{t("placeForm.coverPhoto")}</span>
        <input ref={fileRef} type="file" accept={ALLOWED_IMAGE_ACCEPT} className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border transition hover:border-primary/40"
        >
          {preview ? (
            <>
              <AuthImage
                src={preview}
                alt={t("placeForm.coverPreviewAlt")}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                <span className="text-xs font-medium text-white">{t("placeForm.changePhoto")}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted transition group-hover:text-primary/70">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0021 18v-1.5M16.5 8.25L12 3.75m0 0L7.5 8.25M12 3.75V15" />
              </svg>
              <span className="text-xs">{t("placeForm.uploadPhoto")}</span>
            </div>
          )}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => { setCoverFile(null); setPreview(initial.cover_photo ?? null); }}
            className="text-xs text-muted transition hover:text-red-500"
          >
            {t("placeForm.removePhoto")}
          </button>
        )}
        {fieldErrors.cover_photo && <ErrorMessage message={fieldErrors.cover_photo} />}
      </div>

      {submitError && <ErrorMessage message={submitError} />}
      <Button type="submit" className="w-full">{t("placeForm.save")}</Button>
    </form>
  );
}
