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
import { Modal } from "../ui/Modal";
import { getApiErrorState } from "../../services/api-errors";

type VisitPayload = Partial<Omit<Visit, "photo">> & { photo?: string | File };
type ItemPayload = Partial<Omit<VisitItem, "photo">> & { photo?: string | File };

const EMPTY_ITEM: ItemPayload = { type: "other", rating: 7, price: "0", would_order_again: true };

type Props = {
  initial?: Partial<Visit>;
  initialItems?: ItemPayload[];
  onSubmit: (visit: VisitPayload, items: ItemPayload[]) => Promise<void>;
};

function ItemTypeIcon({ type }: { type?: string }) {
  const icons: Record<string, string> = {
    sweet: "🍬", savory: "🍽️", drink: "🥤", coffee: "☕",
    juice: "🧃", dessert: "🍰", other: "🛒",
  };
  return <span className="text-xl">{icons[type ?? "other"] ?? "🛒"}</span>;
}

function RatingDots({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < value ? "bg-primary" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

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

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftItem, setDraftItem] = useState<ItemPayload>(EMPTY_ITEM);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPreview(file ? URL.createObjectURL(file) : (initial.photo ?? null));
  }

  function openAdd() {
    setEditingIndex(null);
    setDraftItem({ ...EMPTY_ITEM });
    setModalOpen(true);
  }

  function openEdit(i: number) {
    setEditingIndex(i);
    setDraftItem({ ...items[i] });
    setModalOpen(true);
  }

  function saveItem() {
    if (editingIndex !== null) {
      setItems(items.map((x, j) => (j === editingIndex ? draftItem : x)));
    } else {
      setItems([...items, draftItem]);
    }
    setModalOpen(false);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, j) => j !== i));
  }

  return (
    <>
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

        <div className="space-y-1.5">
          <span className="text-sm font-medium">{t("visitForm.photo")}</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border transition hover:border-primary/40"
          >
            {preview ? (
              <>
                <img
                  src={preview}
                  alt={t("visitForm.visitPhotoAlt")}
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
              onClick={() => { setPhotoFile(null); setPreview(initial.photo ?? null); }}
              className="text-xs text-muted transition hover:text-red-500"
            >
              {t("placeForm.removePhoto")}
            </button>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{t("visitForm.consumedTitle")}</h3>
              <p className="text-xs text-muted">{t("visitForm.consumedDescription")}</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={openAdd}>
              + {t("visitForm.addConsumable")}
            </Button>
          </div>

          {items.length === 0 ? (
            <button
              type="button"
              onClick={openAdd}
              className="w-full rounded-xl border-2 border-dashed border-border py-6 text-sm text-muted transition hover:border-primary/40 hover:text-primary/70"
            >
              + {t("visitForm.addConsumable")}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="group relative flex flex-col gap-1.5 rounded-xl border border-border bg-background p-3 transition hover:border-primary/40 hover:shadow-sm"
                >
                  {it.photo && typeof it.photo === "string" ? (
                    <img
                      src={it.photo}
                      alt=""
                      className="h-20 w-full rounded-lg object-cover"
                    />
                  ) : it.photo instanceof File ? (
                    <img
                      src={URL.createObjectURL(it.photo)}
                      alt=""
                      className="h-20 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-full items-center justify-center rounded-lg bg-surface">
                      <ItemTypeIcon type={it.type} />
                    </div>
                  )}

                  <p className="truncate text-xs font-semibold text-text">
                    {it.name || t("visitItemForm.namePlaceholder")}
                  </p>
                  <RatingDots value={Number(it.rating ?? 0)} />
                  {it.price && Number(it.price) > 0 && (
                    <p className="text-xs text-muted">R$ {Number(it.price).toFixed(2)}</p>
                  )}

                  <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                    <button
                      type="button"
                      onClick={() => openEdit(i)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-surface/90 text-muted shadow-sm transition hover:text-text"
                      aria-label="Editar"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-surface/90 text-muted shadow-sm transition hover:text-red-500"
                      aria-label="Remover"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={openAdd}
                className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm text-muted transition hover:border-primary/40 hover:text-primary/70"
              >
                <span className="text-xl">+</span>
                <span>{t("visitForm.addConsumable")}</span>
              </button>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full">{t("visitForm.save")}</Button>
      </form>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingIndex !== null ? t("visitItemForm.editTitle") : t("visitItemForm.addTitle")}
      >
        <div className="space-y-4">
          <VisitItemForm
            value={draftItem}
            onChange={setDraftItem}
            onRemove={() => setModalOpen(false)}
          />
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" className="flex-1" onClick={saveItem}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
