# LO Command Center

LO Command Center is a Next.js app for loan officers running webinar funnels. It provides webinar landing pages, public registration, reminder templates/events, a lightweight lead pipeline, presenter credibility content, and post-webinar follow-up automations.

## Main Workflows

- Create a webinar and public landing page at `/webinars/new`.
- Share the public page at `/w/[slug]`.
- Capture registrants into `leads`.
- Manage reminder copy and scheduled reminder events per webinar.
- Review leads on `/dashboard`, `/webinars/[id]`, and `/pipeline`.
- Drag prospects through the pipeline stages.
- Trigger mocked post-webinar email/SMS follow-up sequences.
- Collect presenter bio, highlights, and testimonials during signup for reuse on public landing pages.

## Tech Stack

- Next.js App Router
- React client/server components
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, RLS, and service-role server access
- Zod for form/action validation

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is used only on the server for public registration and public landing page reads that intentionally bypass anonymous table exposure.
- `NEXT_PUBLIC_SITE_URL` is used for Supabase email confirmation redirects.
- Reminder sending is mocked. No SendGrid/Twilio credentials are currently used.

## Database

SQL migrations live in `supabase/migrations/`.

Apply them to a linked Supabase project with your normal Supabase workflow, for example `supabase db push` after project setup.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Domain model](docs/DOMAIN_MODEL.md)
- [Server actions](docs/SERVER_ACTIONS.md)
- [Supabase](docs/SUPABASE.md)
- [Roadmap](docs/ROADMAP.md)
- [Refactor plan](docs/REFACTOR_PLAN.md)

## Current Limitations

- Email/SMS sends are mocked by writing `reminder_events` rows or updating mock provider messages.
- The lead `status` field currently mixes attendance and sales progression. Moving a lead to `booked_call` removes it from the `attended` count. See `docs/ROADMAP.md` and `docs/DOMAIN_MODEL.md`.
- Profile image upload is not implemented; signup accepts a hosted image URL.
