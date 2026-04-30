import { type SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

export function Select({ label, children, id, ...rest }: Props) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block" htmlFor={selectId}>
      {label && <span className="block text-sm font-medium mb-1">{label}</span>}
      <select
        id={selectId}
        {...rest}
        className="w-full rounded-xl border border-border px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {children}
      </select>
    </label>
  );
}
