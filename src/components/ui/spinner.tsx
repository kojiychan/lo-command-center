export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2 text-sm text-slate-600"
      role="status"
      aria-live="polite"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
      <span>{label}</span>
    </div>
  );
}
