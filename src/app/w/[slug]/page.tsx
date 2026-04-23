import { notFound } from "next/navigation";
import { getPublicWebinarLanding } from "@/server/public-webinar";
import { formatWebinarDate } from "@/lib/format";
import { RegisterForm } from "@/components/public/register-form";
import { CountdownTimer } from "@/components/public/countdown-timer";

export default async function PublicWebinarPage({ params }: { params: { slug: string } }) {
  const res = await getPublicWebinarLanding(params.slug);
  if ("error" in res) {
    notFound();
  }

  const { data } = res;
  const w = data.webinar;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-slate-50" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                Live Webinar for First-Time Buyers
              </div>

              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                {data.headline || "First-Time Homebuyer Webinar: Buy With Less Cash Than You Think"}
              </h1>

              <div className="mt-5">
                <CountdownTimer targetDate={w.starts_at} variant="hero" />
              </div>

              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-700">
                {data.subheadline ||
                  "A clear, step-by-step walkthrough of down payment assistance, affordability, and pre-approval prep — so you can make confident next moves without feeling overwhelmed."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoPill
                  label="Date & time"
                  value={formatWebinarDate(w.starts_at, w.timezone)}
                />
                <InfoPill label="Hosted by" value={`${w.host_name} · Mortgage Loan Officer`} />
              </div>

              {w.cta_text ? (
                <div className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                  {w.cta_text}
                </div>
              ) : (
                <div className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                  Free to attend · Live Q&A included
                </div>
              )}

              {data.hero_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.hero_image_url}
                  alt=""
                  className="mt-8 w-full rounded-3xl border border-slate-200 bg-white object-cover shadow-sm"
                />
              ) : (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">
                    What we’ll cover (in plain English)
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      How down payment assistance works (and who qualifies)
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      The pre-approval checklist lenders actually use
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      The top 3 mistakes that delay closings for first-time buyers
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Registration card */}
            <div className="lg:col-span-5 lg:sticky lg:top-10">
              <div
                id="register"
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Reserve your free seat
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Free to attend. We’ll send reminders so you don’t miss it.
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                    Limited spots
                  </div>
                </div>

                <div className="mt-5">
                  <RegisterForm slug={data.slug} ctaLabel={data.button_text || "Reserve My Free Spot"} />
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                  By registering, you agree to receive email/SMS reminders for this webinar. Message/data rates may
                  apply. Reply STOP to opt out of texts (Twilio integration placeholder).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value / Takeaways */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            What you’ll walk away with
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Clear next steps — whether you’re 60 days out or just testing what’s possible.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BenefitCard
            title="Down payment assistance — demystified"
            body="Understand the programs, requirements, and how to avoid common “gotchas.”"
            icon="🏡"
          />
          <BenefitCard
            title="Affordability without guesswork"
            body="Learn how lenders look at income, debt, and credit so you can estimate your range."
            icon="💬"
          />
          <BenefitCard
            title="A pre-approval checklist you can use"
            body="Know what to gather ahead of time to avoid last-minute surprises."
            icon="✅"
          />
          <BenefitCard
            title="Mistakes that slow buyers down"
            body="Avoid the common moves that can delay approval or weaken your offer."
            icon="⚠️"
          />
          <BenefitCard
            title="A simple plan for your next best step"
            body="Walk away with a clear action plan based on where you are today."
            icon="🧭"
          />
        </div>
      </section>

      {/* Who this is for */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Who this webinar is for
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                If you want clarity before you tour homes, this is for you.
              </p>
            </div>
            <div className="lg:col-span-7">
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  "First-time buyers who feel overwhelmed by the process",
                  "Renters wondering if buying is realistic (and when)",
                  "Anyone curious about down payment assistance options",
                  "Buyers who want to understand pre-approval before talking to agents",
                  "People who want a clear plan, not a sales pitch",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="mt-0.5 text-emerald-600">✓</span>
                    <span className="text-sm text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Credibility */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Hosted by {w.host_name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Mortgage Loan Officer · First-time buyer education focused
            </p>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Professional, no-pressure guidance
                  </div>
                  <div className="text-sm text-slate-600">
                    Educational session designed to reduce confusion and help you make smart next steps.
                  </div>
                </div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  Helped hundreds of buyers understand options before they shop
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  Experience with down payment assistance + first-time programs
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  Clear explanations — no jargon, no judgment
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">A quick note on trust</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                You’ll learn the process and programs first. If you want personal numbers afterward, we’ll offer a
                short optional consult — but the webinar is designed to stand on its own.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ProofCard
                  title="Clear steps"
                  body="Understand what happens before you make an offer."
                />
                <ProofCard
                  title="Realistic expectations"
                  body="Know what matters for approval — and what doesn’t."
                />
                <ProofCard
                  title="Practical next steps"
                  body="Leave with a simple checklist you can use this week."
                />
                <ProofCard
                  title="Optional help"
                  body="If you want, book a quick follow-up after the session."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">FAQ</h2>
            <p className="mt-2 text-sm text-slate-600">
              Quick answers to reduce friction before you register.
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Faq
              q="Is this webinar really free?"
              a="Yes. It’s free to attend — the goal is to give you clarity on programs and next steps."
            />
            <Faq
              q="Will there be a replay?"
              a="Often yes (it depends on the session). If a replay is available, we’ll email it after the webinar."
            />
            <Faq
              q="Is this only for first-time buyers?"
              a="It’s geared toward first-time buyers, but anyone who wants to understand the process can join."
            />
            <Faq
              q="Do I need to be ready to buy now?"
              a="No. This is designed to help you plan — whether you’re months away or actively searching."
            />
            <Faq
              q="Will you cover down payment assistance?"
              a="Yes. We’ll cover how DPA typically works, eligibility basics, and how to avoid common pitfalls."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50 p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Save your seat before the webinar starts
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                Join the free webinar and walk away with a clearer homebuying game plan — down payment assistance,
                pre-approval, and next steps.
              </p>
            </div>
            <div className="lg:col-span-4 lg:flex lg:justify-end">
              <a
                href="#register"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 lg:w-auto"
              >
                Reserve my free spot
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/90 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-slate-900">Free live webinar</div>
            <div className="truncate text-xs text-slate-600">{formatWebinarDate(w.starts_at, w.timezone)}</div>
          </div>
          <a
            href="#register"
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Reserve seat
          </a>
        </div>
      </div>
      <div className="h-20 md:hidden" />
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function BenefitCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-lg ring-1 ring-emerald-100">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
        </div>
      </div>
    </div>
  );
}

function ProofCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{body}</div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
        <span className="flex items-center justify-between gap-3">
          <span>{q}</span>
          <span className="text-slate-400 transition group-open:rotate-180">⌄</span>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{a}</p>
    </details>
  );
}
