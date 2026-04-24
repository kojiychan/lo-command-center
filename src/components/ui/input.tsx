import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ label, hint, id, className = "", ...props }: Props) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label ? (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <input
        id={inputId}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 ${className}`}
        {...props}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
