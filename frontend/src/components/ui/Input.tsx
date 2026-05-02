import { type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, required, ...rest }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="block text-sm font-medium mb-1.5 text-text">
          {label}{required && <span className="text-primary ml-0.5" aria-hidden="true">*</span>}
        </span>
      )}
      <input
        id={inputId}
        required={required}
        {...rest}
        className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
      />
      {error && <span className="text-danger text-xs mt-1 block">{error}</span>}
    </label>
  );
}
