import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

export function DateTimePicker({ label, value, onChange }: Props) {
  const selected = value ? new Date(value) : null;

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <DatePicker
        selected={selected}
        onChange={(date: Date | null) => onChange(date ? date.toISOString() : "")}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="dd/MM/yyyy HH:mm"
        timeCaption="Time"
        placeholderText="Select date and time"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        wrapperClassName="w-full"
        calendarClassName="!font-sans !rounded-xl !border-border !shadow-lg"
        popperPlacement="bottom-start"
      />
    </div>
  );
}
