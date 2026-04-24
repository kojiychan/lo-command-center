type Props = {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

export function Badge({ children, tone = "neutral" }: Props) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    warning: "bg-amber-50 text-amber-900 ring-amber-100",
    danger: "bg-red-50 text-red-800 ring-red-100",
    info: "bg-sky-50 text-sky-900 ring-sky-100",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones}`}
    >
      {children}
    </span>
  );
}
