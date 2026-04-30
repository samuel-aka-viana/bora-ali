import { useState } from "react";
import type { Place, PlaceStatus } from "../../types/place";
import { PLACE_STATUSES } from "../../utils/constants";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";

type Props = {
  initial?: Partial<Place>;
  onSubmit: (data: Partial<Place>) => Promise<void>;
};

export function PlaceForm({ initial = {}, onSubmit }: Props) {
  const [f, setF] = useState<Partial<Place>>({
    status: "want_to_visit",
    ...initial,
  });
  const [nameError, setNameError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const upd = (k: keyof Place) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.name?.trim()) {
          setNameError("Name is required");
          return;
        }
        setNameError("");
        setSubmitError("");
        try {
          await onSubmit(f);
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
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      <Textarea label="Notes" value={f.notes || ""} onChange={upd("notes")} />
      {submitError && <ErrorMessage message={submitError} />}
      <Button type="submit" className="w-full">
        Save
      </Button>
    </form>
  );
}
