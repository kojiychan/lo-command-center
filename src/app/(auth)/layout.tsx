import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-20">
      <Link
        href="/"
        className="absolute left-4 top-4 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white hover:shadow-sm sm:left-8 sm:top-6"
        aria-label="Back to RealEstateWebinar.io home"
      >
        <span className="block leading-tight">RealEstateWebinar.io</span>
        <span className="block text-xs font-medium text-slate-500">LO Command Center</span>
      </Link>
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
