import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  }[size];

  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600",
    secondary:
      "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-400",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  }[variant];

  return (
    <button className={`${base} ${sizes} ${variants} ${className}`} {...props} />
  );
}
