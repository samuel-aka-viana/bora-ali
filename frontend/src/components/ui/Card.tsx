import { type HTMLAttributes } from "react";

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`bg-surface rounded-2xl shadow-sm border border-border p-4 ${className}`}
    />
  );
}
