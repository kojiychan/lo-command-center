import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  getPublicWebinarLanding,
  type PublicPresenter,
  type PublicTestimonial,
} from "@/server/public-webinar";
import { RegisterForm } from "@/components/public/register-form";
import { WebinarViewTracker } from "@/components/analytics/webinar-view-tracker";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { CountdownTimer } from "@/components/public/countdown-timer";
import { WebinarTime } from "@/components/public/webinar-time";
import { WEBINAR_BASE_DOMAIN } from "@/domain/profiles";
import { formatInTimeZone } from "@/lib/timezone-utils";
import { getWebinarTemplate } from "@/lib/webinarTemplates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const result = await getPublicWebinarLanding(params.slug);

  if ("error" in result) {
    return {
      title: { absolute: "Real Estate Seminar" },
    };
  }

  const webinarTitle = result.data.webinar.title;
  const description =
    result.data.subheadline ??
    result.data.webinar.description ??
    `Register for ${webinarTitle}.`;

  return {
    title: { absolute: "Real Estate Seminar" },
    description,
    openGraph: {
      title: "Real Estate Seminar",
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Real Estate Seminar",
      description,
    },
  };
}

export default async function PublicWebinarPage({ params }: { params: { slug: string } }) {
  const res = await getPublicWebinarLanding(params.slug);
  if ("error" in res) {
    notFound();
  }

  const { data } = res;
  const w = data.webinar;
  const template = getWebinarTemplate(w.template_type);
  const heroBullets = data.hero_bullets.length > 0 ? data.hero_bullets : template.defaultHeroBullets;
  const agendaItems = data.agenda_items.length > 0 ? data.agenda_items : template.defaultAgenda;
  const presenterName = data.presenter?.full_name ?? w.host_name;

  enforcePresenterSubdomain({
    slug: data.slug,
    domainPrefix: data.presenter?.domain_prefix ?? null,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MetaPixel pixelId={data.meta_pixel_id} />
      <WebinarViewTracker webinarId={w.id} slug={data.slug} />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-slate-50" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                Live {template.name} Webinar
              </div>

              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                {data.headline || template.defaultHeadline}
              </h1>

              <div className="mt-5">
                <CountdownTimer targetDate={w.starts_at} variant="hero" />
              </div>

              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-700">
                {data.subheadline || template.defaultSubheadline}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoPill label="Date & time">
                  <WebinarTime startsAtIsoUtc={w.starts_at} webinarTimeZone={w.timezone} />
                </InfoPill>
                <InfoPill label="Hosted by" value={`${w.host_name} · Mortgage Loan Officer`} />
              </div>

              <div className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                {w.cta_text || template.defaultCTA}
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">
                  What we’ll cover (in plain English)
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {heroBullets.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
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
                  <RegisterForm
                    slug={data.slug}
                    ctaLabel={data.button_text || template.defaultCTA}
                    metaPixelId={data.meta_pixel_id}
                  />
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

      {/* Value / Agenda */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            What You’ll Learn
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            A practical agenda built for {template.targetAudience.toLowerCase()}.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agendaItems.map((item, index) => (
            <BenefitCard
              key={item}
              title={item}
              body="Clear, practical guidance you can use after the session."
              icon={String(index + 1)}
            />
          ))}
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
                Best for {template.targetAudience.toLowerCase()}.
              </p>
            </div>
            <div className="lg:col-span-7">
              <ul className="grid gap-3 sm:grid-cols-2">
                {heroBullets.map((item) => (
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

      <PresenterSection presenter={data.presenter} presenterName={presenterName} />

      {data.testimonials.length > 0 ? (
        <TestimonialsSection testimonials={data.testimonials} />
      ) : null}

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">FAQ</h2>
            <p className="mt-2 text-sm text-slate-600">
              Quick answers to reduce friction before you register.
            </p>
          </div>
          <div className="mt-8 grid items-start gap-4 lg:grid-cols-2">
            {template.defaultFaqs.map((faq) => (
              <Faq key={faq.question} q={faq.question} a={faq.answer} />
            ))}
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
                Join the free webinar and walk away with a clearer plan for your next step.
              </p>
            </div>
            <div className="lg:col-span-4 lg:flex lg:justify-end">
              <a
                href="#register"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 lg:w-auto"
              >
                {data.button_text || template.defaultCTA}
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
            <div className="truncate text-xs text-slate-600">
              {formatInTimeZone(w.starts_at, w.timezone)}
            </div>
          </div>
          <a
            href="#register"
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            {data.button_text || template.defaultCTA}
          </a>
        </div>
      </div>
      <div className="h-20 md:hidden" />
    </div>
  );
}

function enforcePresenterSubdomain({
  slug,
  domainPrefix,
}: {
  slug: string;
  domainPrefix: string | null;
}) {
  const headerStore = headers();
  const requestHost = (
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    ""
  )
    .split(",")[0]
    .trim()
    .toLowerCase();
  const hostname = requestHost.split(":")[0];

  if (!hostname || isLocalHost(hostname) || hostname.endsWith(".vercel.app")) {
    return;
  }

  const baseDomains = Array.from(
    new Set([WEBINAR_BASE_DOMAIN, "realestatewebinar.io", "realestatewebinar.com"].map((domain) => domain.toLowerCase())),
  );
  const matchedBaseDomain = baseDomains.find(
    (domain) => hostname === domain || hostname === `www.${domain}` || hostname.endsWith(`.${domain}`),
  );

  if (!matchedBaseDomain) {
    return;
  }

  const normalizedPrefix = domainPrefix?.toLowerCase() ?? "";
  const expectedHost = normalizedPrefix ? `${normalizedPrefix}.${matchedBaseDomain}` : null;

  if (!expectedHost) {
    notFound();
  }

  if (hostname === matchedBaseDomain || hostname === `www.${matchedBaseDomain}`) {
    redirect(`https://${expectedHost}/w/${slug}`);
  }

  if (hostname !== expectedHost) {
    notFound();
  }
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function InfoPill({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      {children ? (
        <div className="mt-1">{children}</div>
      ) : (
        <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
      )}
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

function PresenterSection({
  presenter,
  presenterName,
}: {
  presenter: PublicPresenter | null;
  presenterName: string;
}) {
  const highlights = [
    presenter?.years_experience != null
      ? { label: "Years experience", value: `${presenter.years_experience}+` }
      : null,
    presenter?.families_helped != null
      ? { label: "Families helped", value: `${presenter.families_helped}+` }
      : null,
    presenter?.total_loan_volume ? { label: "Loan volume", value: presenter.total_loan_volume } : null,
    presenter?.specialty_focus ? { label: "Focus", value: presenter.specialty_focus } : null,
    presenter?.license_states ? { label: "Licensed in", value: presenter.license_states } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Meet Your Presenter
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Learn from the person guiding this session.
          </p>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {presenter?.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={presenter.profile_image_url}
                  alt={presenterName}
                  className="h-24 w-24 rounded-3xl border border-slate-200 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-emerald-50 text-2xl font-semibold text-emerald-800 ring-1 ring-emerald-100">
                  {initials(presenterName)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-xl font-semibold text-slate-900">{presenterName}</div>
                {presenter?.short_bio ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{presenter.short_bio}</p>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    Join a practical, education-first webinar built to help you understand your next step.
                  </p>
                )}

                {highlights.length > 0 ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {highlights.map((item) => (
                      <ProofCard key={item.label} title={item.value} body={item.label} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({
  testimonials,
}: {
  testimonials: PublicTestimonial[];
}) {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Trusted by Buyers Like You
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Past clients shared what it felt like to get clearer guidance.
          </p>
        </div>

        <div
          className={[
            "mt-8 grid gap-4",
            testimonials.length === 1
              ? "max-w-xl"
              : testimonials.length === 2
                ? "lg:grid-cols-2"
                : "lg:grid-cols-3",
          ].join(" ")}
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <div className="text-sm font-semibold text-amber-500">
                {"★".repeat(testimonial.rating)}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                “{testimonial.review_text}”
              </p>
              <div className="mt-5">
                <div className="text-sm font-semibold text-slate-900">
                  {testimonial.reviewer_name}
                </div>
                {testimonial.reviewer_context ? (
                  <div className="text-xs text-slate-500">{testimonial.reviewer_context}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}


function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group self-start rounded-2xl border border-slate-200 bg-slate-50 p-5">
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
