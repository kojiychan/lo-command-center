# Architecture

LO Command Center is a Next.js App Router application backed by Supabase. The app is organized around webinar funnels, public registration, reminder workflows, and lead follow-up.

## App Structure

- `src/app/` contains App Router routes and server actions.
- `src/components/` contains client UI components.
- `src/domain/` centralizes domain enums, labels, zod schemas, and derived types.
- `src/server/auth/` contains current-user and ownership helpers.
- `src/server/queries/` contains server-side read/query functions used by route components.
- `src/server/services/` contains mutation workflows used by server actions.
- `src/lib/` contains formatting, timezone, slug, reminder scheduling/defaults, and Supabase client helpers.
- `src/types/database.ts` contains hand-maintained database row types.
- `supabase/migrations/` contains the database schema history.

## Route Groups

- `src/app/(auth)/login` and `src/app/(auth)/signup` are public auth pages.
- `src/app/(app)/dashboard` is the authenticated summary view.
- `src/app/(app)/webinars` lists webinars.
- `src/app/(app)/webinars/new` creates webinars.
- `src/app/(app)/webinars/[id]` manages a webinar workspace.
- `src/app/(app)/pipeline` shows the cross-webinar lead pipeline.
- `src/app/(app)/settings` manages account/reminder defaults.
- `src/app/w/[slug]` is the public webinar landing page.
- `src/app/auth/callback/route.ts` handles Supabase auth callbacks.

## Server and Client Boundaries

Route components are mostly server components. They authenticate, call query modules, and render client components.

Client components own interactive UI:

- `src/components/auth/*`
- `src/components/public/*`
- `src/components/webinars/new-webinar-form.tsx`
- `src/components/webinars/pipeline-board.tsx`
- `src/components/webinars/workspace/*`

Server actions live in `src/app/actions/` and are called from forms or client event handlers. They should parse/validate input, call services, then revalidate or redirect.

## Supabase Client Usage

- `src/lib/supabase/server.ts` creates an SSR Supabase client using cookies.
- `src/lib/supabase/client.ts` creates the browser client.
- `src/lib/supabase/admin.ts` creates the service-role client for trusted server-only workflows.
- `src/lib/supabase/middleware.ts` refreshes sessions and protects authenticated app routes.

## Major Features

- Auth and signup onboarding: `src/components/auth/signup-form.tsx`, `src/app/actions/auth.ts`.
- Webinar creation: `src/components/webinars/new-webinar-form.tsx`, `src/app/actions/webinars.ts`, `src/server/services/webinars.ts`.
- Webinar workspace: `src/components/webinars/workspace/`.
- Pipeline board: `src/components/webinars/pipeline-board.tsx`.
- Public landing pages: `src/app/w/[slug]/page.tsx`, `src/server/public-webinar.ts`.
- Reminders: `src/lib/reminder-defaults.ts`, `src/lib/reminder-schedule.ts`, `src/server/services/reminders.ts`.
- Follow-up automations: `src/server/services/leads.ts`, `src/components/webinars/workspace/follow-up-tab.tsx`.

## Current Incomplete Areas

- Email/SMS sending is mocked. Rows are written to `reminder_events`, but no external provider is called.
- Uploads are not implemented. Profile and hero images are URL fields.
- Supabase types are hand-maintained in `src/types/database.ts`; there is no generated type workflow yet.
