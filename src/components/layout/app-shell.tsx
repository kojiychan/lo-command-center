import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { signOut } from "@/app/actions/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/webinars", label: "Webinars" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/dashboard" className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              {APP_NAME}
            </span>
            <span className="text-xs text-slate-500">
              Webinar funnels built for loan officers
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
