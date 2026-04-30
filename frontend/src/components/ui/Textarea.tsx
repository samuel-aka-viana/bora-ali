import { type TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, id, ...rest }: Props) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block" htmlFor={textareaId}>
      {label && <span className="block text-sm font-medium mb-1">{label}</span>}
      <textarea
        id={textareaId}
        {...rest}
        className="w-full rounded-xl border border-border px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {error && <span className="text-danger text-xs mt-1 block">{error}</span>}
    </label>
  );
}
