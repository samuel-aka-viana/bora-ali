import type { VisitItem, VisitItemType } from "../../types/visit-item";
import { VISIT_ITEM_TYPES } from "../../utils/constants";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { RatingInput } from "../ui/RatingInput";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";

type Props = {
  value: Partial<VisitItem>;
  onChange: (v: Partial<VisitItem>) => void;
  onRemove: () => void;
};

export function VisitItemForm({ value, onChange, onRemove }: Props) {
  return (
    <div className="border border-border rounded-xl bg-background p-3 space-y-3">
      <Input
        label="Consumable name"
        placeholder="Croissant, espresso, juice..."
        value={value.name || ""}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <Select
        label="Type"
        value={value.type || "other"}
        onChange={(e) => onChange({ ...value, type: e.target.value as VisitItemType })}
      >
        {VISIT_ITEM_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>
      <RatingInput
        label="Rating (0-10)"
        value={Number(value.rating ?? 0)}
        onChange={(n) => onChange({ ...value, rating: n })}
      />
      <Input
        label="Price (R$)"
        type="number"
        min={0}
        step="0.01"
        value={String(value.price ?? "")}
        onChange={(e) => onChange({ ...value, price: e.target.value })}
      />
      <Textarea
        label="Comments"
        placeholder="Texture, flavor, portion size..."
        value={value.notes || ""}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!value.would_order_again}
          onChange={(e) => onChange({ ...value, would_order_again: e.target.checked })}
        />
        Would order again
      </label>
      <Button type="button" variant="danger" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
