import Link from "next/link";

type Props = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: Props) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 max-w-prose text-sm text-slate-600">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
