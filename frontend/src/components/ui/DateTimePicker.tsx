import DatePicker from "react-datepicker";
import { useTranslation } from "react-i18next";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function DateTimePicker({ label, value, onChange, error }: Props) {
  const { t } = useTranslation();
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
        timeCaption={t("dateTimePicker.timeCaption")}
        placeholderText={t("dateTimePicker.placeholder")}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        wrapperClassName="w-full"
        calendarClassName="!font-sans !rounded-xl !border-border !shadow-lg"
        popperPlacement="bottom-start"
      />
      {error && <span className="text-danger text-xs mt-1 block">{error}</span>}
    </div>
  );
}
