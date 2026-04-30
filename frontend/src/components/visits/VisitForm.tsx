import { useState } from "react";
import type { Visit } from "../../types/visit";
import type { VisitItem } from "../../types/visit-item";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { RatingInput } from "../ui/RatingInput";
import { Button } from "../ui/Button";
import { VisitItemForm } from "./VisitItemForm";

type Props = {
  initial?: Partial<Visit>;
  initialItems?: Partial<VisitItem>[];
  onSubmit: (visit: Partial<Visit>, items: Partial<VisitItem>[]) => Promise<void>;
};

export function VisitForm({ initial = {}, initialItems = [], onSubmit }: Props) {
  const [v, setV] = useState<Partial<Visit>>({
    visited_at: new Date().toISOString().slice(0, 16),
    environment_rating: 7,
    service_rating: 7,
    overall_rating: 7,
    would_return: true,
    ...initial,
  });
  const [items, setItems] = useState<Partial<VisitItem>[]>(initialItems);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(v, items);
      }}
      className="space-y-4"
    >
      <Input
        label="Visited at"
        type="datetime-local"
        value={(v.visited_at || "").slice(0, 16)}
        onChange={(e) => setV({ ...v, visited_at: e.target.value })}
      />
      <RatingInput
        label="Environment (0-10)"
        value={Number(v.environment_rating ?? 0)}
        onChange={(n) => setV({ ...v, environment_rating: n })}
      />
      <RatingInput
        label="Service (0-10)"
        value={Number(v.service_rating ?? 0)}
        onChange={(n) => setV({ ...v, service_rating: n })}
      />
      <RatingInput
        label="Overall (0-10)"
        value={Number(v.overall_rating ?? 0)}
        onChange={(n) => setV({ ...v, overall_rating: n })}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!v.would_return}
          onChange={(e) => setV({ ...v, would_return: e.target.checked })}
        />
        Would return
      </label>
      <Textarea
        label="General notes"
        value={v.general_notes || ""}
        onChange={(e) => setV({ ...v, general_notes: e.target.value })}
      />

      <div>
        <div className="mb-2">
          <h3 className="font-semibold">Food and drinks consumed</h3>
          <p className="text-sm text-muted">
            Add each consumable with price, rating, and comments.
          </p>
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
          + Add consumable
        </Button>
      </div>

      <Button type="submit" className="w-full">
        Save visit
      </Button>
    </form>
  );
}
