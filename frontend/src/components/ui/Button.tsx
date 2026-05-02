import { type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-primary text-white hover:bg-primary-dark active:scale-95",
  secondary: "bg-surface text-text border border-border hover:border-muted/50 hover:bg-background active:scale-95",
  danger: "bg-danger text-white hover:opacity-90 active:scale-95",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
};

export function Button({ variant = "primary", size = "md", className = "", ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-xl font-medium shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    />
  );
}
