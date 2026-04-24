import type { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 space-y-1">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
