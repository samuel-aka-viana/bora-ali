import { type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, ...rest }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="block text-sm font-medium mb-1.5 text-text">{label}</span>
      )}
      <input
        id={inputId}
        {...rest}
        className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
      />
      {error && <span className="text-danger text-xs mt-1 block">{error}</span>}
    </label>
  );
}
