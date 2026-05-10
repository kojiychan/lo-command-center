import Link from "next/link";

const features = [
  {
    title: "High-converting webinar landing pages",
    body: "Launch clean registration pages with clear CTAs, event details, presenter credibility, and social proof.",
  },
  {
    title: "Automated email and SMS reminders",
    body: "Send confirmations, day-before nudges, morning-of reminders, countdown messages, and start-now alerts.",
  },
  {
    title: "Lead pipeline by webinar",
    body: "Track prospects from signup through attended, no-show, booked call, and closed stages.",
  },
  {
    title: "Presenter bio, reviews, and custom branding",
    body: "Reuse your profile, photo, testimonials, company, and webinar domain across every funnel.",
  },
  {
    title: "Ready-made webinar templates",
    body: "Start with first-time buyer, investor, and self-employed borrower templates built for mortgage education.",
  },
  {
    title: "Registration and attendance tracking",
    body: "See who signed up, where they came from, and what happened after the event.",
  },
];

const steps = [
  "Choose a webinar template",
  "Customize presenter info and event details",
  "Share your registration link",
  "Automated reminders go out",
  "Track who signed up, showed up, booked, and applied",
];

const useCases = [
  "First-time homebuyer webinars",
  "Investor webinars",
  "Self-employed borrower webinars",
  "Down payment assistance webinars",
  "Realtor co-hosted events",
];

const faqs = [
  {
    q: "Can I use my own branding?",
    a: "Yes. Add your presenter profile, company, reviews, image, and webinar domain prefix so every page feels like yours.",
  },
  {
    q: "Does it send reminders?",
    a: "Yes. The platform supports email and SMS reminder templates for confirmation, countdown, and follow-up sequences.",
  },
  {
    q: "Can I track who signed up?",
    a: "Yes. Each webinar has registrant tracking, page views, lead stages, and follow-up status.",
  },
  {
    q: "Can I use this for Facebook ads?",
    a: "Yes. Send ad traffic to a focused webinar page, capture registrations, and track follow-up in one place.",
  },
  {
    q: "Is this for loan officers, realtors, or both?",
    a: "It is built first for loan officers, but real estate professionals can use it for buyer education and co-hosted events.",
  },
];

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <div className="text-lg font-semibold tracking-tight text-slate-950">
              RealEstateWebinar.io
            </div>
            <div className="text-xs font-medium text-slate-500">
              Webinar funnels for real estate pros
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-950">Features</a>
            <a href="#how-it-works" className="hover:text-slate-950">How It Works</a>
            <a href="#pricing" className="hover:text-slate-950">Pricing</a>
            <a href="#faq" className="hover:text-slate-950">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-20">
          <div className="lg:col-span-6">
            <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              Built for mortgage and real estate webinar funnels
            </div>
            <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Launch high-converting real estate webinars in minutes
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-slate-600">
              Create webinar landing pages, collect registrations, send automated reminders, and track every lead from signup to booked appointment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Get Started
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                View Demo / See How It Works
              </a>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm">
              <Metric value="3" label="MVP templates" />
              <Metric value="SMS" label="Reminder-ready" />
              <Metric value="1" label="Pipeline view" />
            </div>
          </div>

          <div className="lg:col-span-6">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide text-rose-600">The problem</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Social media attention rarely turns into booked appointments by itself.
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Most agents and loan officers struggle to turn ads, posts, and event interest into real conversations. Event pages, reminders, follow-up, and lead tracking are usually disconnected.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">The solution</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            One simple system for webinar funnels.
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            RealEstateWebinar.io brings landing pages, registration forms, automated SMS/email reminders, lead tracking, no-show follow-up, and appointment visibility into one workflow.
          </p>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Features"
            title="Everything needed to move from audience to appointment"
            body="Give every webinar a focused funnel, then keep leads moving with reminders and clear pipeline stages."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="h-1.5 w-12 rounded-full bg-emerald-500" />
                <h3 className="mt-5 text-base font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionIntro
          eyebrow="How it works"
          title="Build the funnel once, then let the system do the nudging"
          body="Start with a proven template, personalize it, and share a registration link anywhere you promote your event."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="mt-5 text-sm font-semibold leading-6 text-slate-950">{step}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Use cases"
            title="Run the webinars your market already wants"
            body="Create education-first events for buyer segments, agent partners, and ad campaigns."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            {useCases.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:grid lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-7">
            <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Pricing</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Start with the core webinar funnel.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Pricing can grow with your team, campaigns, SMS volume, and dedicated phone number needs.
            </p>
          </div>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 lg:col-span-5 lg:mt-0">
            <div className="text-sm font-semibold text-slate-500">MVP access</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">Launch ready</div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Landing pages, registration, reminders, pipeline, presenter profile, and webinar templates.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Turn every webinar into a follow-up machine.
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                Build the page, capture the lead, send the reminders, and know exactly who needs the next touch.
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
              >
                Start Building Your First Webinar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionIntro
          eyebrow="FAQ"
          title="Questions before you launch"
          body="A quick read for teams thinking about buyer webinars, ad traffic, and follow-up."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-950">
                <span className="flex items-center justify-between gap-4">
                  <span>{faq.q}</span>
                  <span className="text-slate-400 transition group-open:rotate-180">⌄</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="font-semibold text-slate-700">RealEstateWebinar.io</div>
          <div>Webinar funnels built for mortgage and real estate professionals.</div>
        </div>
      </footer>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-lg font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</div>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-slate-600">{body}</p>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-100 p-3 shadow-2xl shadow-slate-900/10">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="text-sm font-semibold text-slate-950">First-Time Homebuyer Workshop</div>
            <div className="text-xs text-slate-500">Registration funnel preview</div>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Live webinar
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Webinar page</div>
            <h3 className="mt-3 text-xl font-semibold leading-7 text-slate-950">
              Learn how to buy your first home with less money out of pocket
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>✓ Down payment assistance basics</li>
              <li>✓ Loan options and approval steps</li>
              <li>✓ Live Q&A with your presenter</li>
            </ul>
            <div className="mt-5 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white">
              Reserve My Spot
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <PreviewPanel title="Registrants" value="128" sub="32 new this week" />
            <PreviewPanel title="SMS / email reminders" value="Queued" sub="10 min + starting now" />
            <PreviewPanel title="Lead pipeline" value="24 booked" sub="Attended → booked call" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {["Registered", "Attended", "No-show", "Booked"].map((stage, index) => (
            <div key={stage} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-xs font-semibold text-slate-500">{stage}</div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${[88, 62, 26, 38][index]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}
