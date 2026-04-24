import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, id, className = "", children, ...props }: Props) {
  const selectId = id ?? props.name;

  return (
    <label className="block space-y-1.5" htmlFor={selectId}>
      {label ? (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <select
        id={selectId}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
