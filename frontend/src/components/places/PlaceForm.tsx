import { useState, useRef } from "react";
import type { Place, PlaceStatus } from "../../types/place";
import { PLACE_STATUSES } from "../../utils/constants";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";

type PlacePayload = Partial<Omit<Place, "cover_photo">> & { cover_photo?: string | File };

type Props = {
  initial?: Partial<Place>;
  onSubmit: (data: PlacePayload) => Promise<void>;
};

export function PlaceForm({ initial = {}, onSubmit }: Props) {
  const [f, setF] = useState<Partial<Place>>({ status: "want_to_visit", ...initial });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial.cover_photo ?? null);
  const [nameError, setNameError] = useState("");
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
        if (!f.name?.trim()) { setNameError("Name is required"); return; }
        setNameError("");
        setSubmitError("");
        try {
          await onSubmit({ ...f, ...(coverFile ? { cover_photo: coverFile } : {}) });
        } catch {
          setSubmitError("Failed to save place");
        }
      }}
      className="space-y-3"
    >
      <Input label="Name" value={f.name || ""} onChange={upd("name")} error={nameError} />
      <Input label="Category" value={f.category || ""} onChange={upd("category")} />
      <Input label="Address" value={f.address || ""} onChange={upd("address")} />
      <Input label="Instagram URL" value={f.instagram_url || ""} onChange={upd("instagram_url")} />
      <Input label="Maps URL" value={f.maps_url || ""} onChange={upd("maps_url")} />
      <Select
        label="Status"
        value={f.status}
        onChange={(e) => setF({ ...f, status: e.target.value as PlaceStatus })}
      >
        {PLACE_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </Select>
      <Textarea label="Notes" value={f.notes || ""} onChange={upd("notes")} />

      <div className="space-y-1">
        <span className="text-sm font-medium">Cover photo</span>
        {preview && (
          <img
            src={preview}
            alt="Cover preview"
            className="w-full h-40 object-cover rounded-lg border border-border"
          />
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          {preview ? "Change photo" : "Upload photo"}
        </Button>
        {coverFile && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => { setCoverFile(null); setPreview(initial.cover_photo ?? null); }}
          >
            Remove
          </Button>
        )}
      </div>

      {submitError && <ErrorMessage message={submitError} />}
      <Button type="submit" className="w-full">Save</Button>
    </form>
  );
}
