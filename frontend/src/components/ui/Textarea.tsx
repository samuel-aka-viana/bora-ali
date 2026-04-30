import { type TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string };

export function Textarea({ label, id, ...rest }: Props) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block" htmlFor={textareaId}>
      {label && <span className="block text-sm font-medium mb-1">{label}</span>}
      <textarea
        id={textareaId}
        {...rest}
        className="w-full rounded-xl border border-border px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
