import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { VisitItem, VisitItemType } from "../../types/visit-item";
import { VISIT_ITEM_TYPES } from "../../utils/constants";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { RatingInput } from "../ui/RatingInput";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";

type VisitItemPayload = Partial<Omit<VisitItem, "photo">> & { photo?: string | File };

type Props = {
  value: VisitItemPayload;
  onChange: (v: VisitItemPayload) => void;
  onRemove: () => void;
};

export function VisitItemForm({ value, onChange, onRemove }: Props) {
  const { t } = useTranslation();
  const existingPhoto = typeof value.photo === "string" ? value.photo : null;
  const [preview, setPreview] = useState<string | null>(existingPhoto);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPreview(file ? URL.createObjectURL(file) : existingPhoto);
    onChange({ ...value, photo: file ?? undefined });
  }

  return (
    <div className="border border-border rounded-xl bg-background p-3 space-y-3">
      <Input
        label={t("visitItemForm.name")}
        placeholder={t("visitItemForm.namePlaceholder")}
        value={value.name || ""}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <Select
        label={t("visitItemForm.type")}
        value={value.type || "other"}
        onChange={(e) => onChange({ ...value, type: e.target.value as VisitItemType })}
      >
        {VISIT_ITEM_TYPES.map((item) => (
          <option key={item.value} value={item.value}>{t(`itemType.${item.value}`)}</option>
        ))}
      </Select>
      <RatingInput
        label={t("visitItemForm.rating")}
        value={Number(value.rating ?? 0)}
        onChange={(n) => onChange({ ...value, rating: n })}
      />
      <Input
        label={t("visitItemForm.price")}
        type="number"
        min={0}
        step="0.01"
        value={String(value.price ?? "")}
        onChange={(e) => onChange({ ...value, price: e.target.value })}
        onFocus={(e) => e.target.select()}
      />
      <Textarea
        label={t("visitItemForm.notes")}
        placeholder={t("visitItemForm.notesPlaceholder")}
        value={value.notes || ""}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!value.would_order_again}
          onChange={(e) => onChange({ ...value, would_order_again: e.target.checked })}
        />
        {t("visitItemForm.wouldOrderAgain")}
      </label>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">{t("placeForm.coverPhoto")}</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border transition hover:border-primary/40"
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt={t("visitItemForm.itemPhotoAlt")}
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
            onClick={() => { setPreview(existingPhoto); onChange({ ...value, photo: undefined }); }}
            className="text-xs text-muted transition hover:text-red-500"
          >
            {t("placeForm.removePhoto")}
          </button>
        )}
      </div>

    </div>
  );
}
