import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Visit } from "../../types/visit";
import type { VisitItem } from "../../types/visit-item";
import { DateTimePicker } from "../ui/DateTimePicker";
import { Textarea } from "../ui/Textarea";
import { RatingInput } from "../ui/RatingInput";
import { Button } from "../ui/Button";
import { VisitItemForm } from "./VisitItemForm";
import { ErrorMessage } from "../ui/ErrorMessage";
import { getApiErrorState } from "../../services/api-errors";

type VisitPayload = Partial<Omit<Visit, "photo">> & { photo?: string | File };
type ItemPayload = Partial<Omit<VisitItem, "photo">> & { photo?: string | File };

type Props = {
  initial?: Partial<Visit>;
  initialItems?: ItemPayload[];
  onSubmit: (visit: VisitPayload, items: ItemPayload[]) => Promise<void>;
};

export function VisitForm({ initial = {}, initialItems = [], onSubmit }: Props) {
  const { t } = useTranslation();
  const [v, setV] = useState<Partial<Visit>>({
    visited_at: new Date().toISOString().slice(0, 16),
    environment_rating: 7,
    service_rating: 7,
    overall_rating: 7,
    would_return: true,
    ...initial,
  });
  const [items, setItems] = useState<ItemPayload[]>(initialItems);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial.photo ?? null);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPreview(file ? URL.createObjectURL(file) : (initial.photo ?? null));
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitError("");
        setFieldErrors({});
        try {
          await onSubmit({ ...v, ...(photoFile ? { photo: photoFile } : {}) }, items);
        } catch (error) {
          const apiError = getApiErrorState(error, t("visitForm.saveError"));
          setSubmitError(apiError.message);
          setFieldErrors(apiError.fieldErrors);
        }
      }}
      className="space-y-4"
    >
      {submitError && <ErrorMessage message={submitError} />}
      <DateTimePicker
        label={t("visitForm.visitedAt")}
        value={v.visited_at || ""}
        onChange={(val) => setV({ ...v, visited_at: val })}
        error={fieldErrors.visited_at}
      />
      <RatingInput
        label={t("visitForm.environmentRating")}
        value={Number(v.environment_rating ?? 0)}
        onChange={(n) => setV({ ...v, environment_rating: n })}
        error={fieldErrors.environment_rating}
      />
      <RatingInput
        label={t("visitForm.serviceRating")}
        value={Number(v.service_rating ?? 0)}
        onChange={(n) => setV({ ...v, service_rating: n })}
        error={fieldErrors.service_rating}
      />
      <RatingInput
        label={t("visitForm.overallRating")}
        value={Number(v.overall_rating ?? 0)}
        onChange={(n) => setV({ ...v, overall_rating: n })}
        error={fieldErrors.overall_rating}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!v.would_return}
          onChange={(e) => setV({ ...v, would_return: e.target.checked })}
        />
        {t("visitForm.wouldReturn")}
      </label>
      <Textarea
        label={t("visitForm.generalNotes")}
        value={v.general_notes || ""}
        onChange={(e) => setV({ ...v, general_notes: e.target.value })}
        error={fieldErrors.general_notes}
      />

      <div className="space-y-1">
        <span className="text-sm font-medium">{t("visitForm.photo")}</span>
        {preview && (
          <img
            src={preview}
            alt={t("visitForm.visitPhotoAlt")}
            className="w-full h-40 object-cover rounded-lg border border-border"
          />
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          {preview ? t("placeForm.changePhoto") : t("placeForm.uploadPhoto")}
        </Button>
        {photoFile && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => { setPhotoFile(null); setPreview(initial.photo ?? null); }}
          >
            {t("placeForm.removePhoto")}
          </Button>
        )}
      </div>

      <div>
        <div className="mb-2">
          <h3 className="font-semibold">{t("visitForm.consumedTitle")}</h3>
          <p className="text-sm text-muted">{t("visitForm.consumedDescription")}</p>
        </div>
        <div className="space-y-3">
          {items.map((it, i) => (
            <VisitItemForm
              key={i}
              value={it}
              onChange={(nv) => setItems(items.map((x, j) => (j === i ? nv : x)))}
              onRemove={() => setItems(items.filter((_, j) => j !== i))}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() =>
            setItems([...items, { type: "other", rating: 7, price: "0", would_order_again: true }])
          }
        >
          {t("visitForm.addConsumable")}
        </Button>
      </div>

      <Button type="submit" className="w-full">{t("visitForm.save")}</Button>
    </form>
  );
}
