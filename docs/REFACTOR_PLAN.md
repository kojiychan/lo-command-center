# Refactor Plan

This plan documents the intended structure for keeping the app maintainable as the MVP grows.

## 1. Centralize Domain Enums and Schemas

Status: partially implemented.

Current modules:

- `src/domain/leads.ts`
- `src/domain/reminders.ts`
- `src/domain/webinars.ts`

Keep these modules as the source of truth for:

- typed arrays
- zod schemas
- label maps
- derived TypeScript types

Avoid re-declaring reminder keys or lead statuses inside actions/components.

## 2. Extract Auth and Ownership Helpers

Status: partially implemented.

Current modules:

- `src/server/auth/current-user.ts`
- `src/server/auth/ownership.ts`

Use:

- `getCurrentUser()` for nullable user checks.
- `requireUser()` when throwing is appropriate.
- `assertWebinarOwner()` for webinar-scoped mutations.
- `assertLeadOwner()` for lead-scoped mutations.

## 3. Add Server Query Modules

Status: partially implemented.

Current modules:

- `src/server/queries/dashboard.ts`
- `src/server/queries/webinars.ts`
- `src/server/queries/pipeline.ts`

Recommended next query modules:

- `src/server/queries/settings.ts`
- `src/server/queries/public-webinar.ts` if public landing data grows beyond `src/server/public-webinar.ts`.

Route components should stay focused on auth, query orchestration, and rendering.

## 4. Add Service Modules for Mutations

Status: partially implemented.

Current modules:

- `src/server/services/leads.ts`
- `src/server/services/reminders.ts`
- `src/server/services/templates.ts`
- `src/server/services/webinars.ts`

Recommended next service modules:

- `src/server/services/auth-onboarding.ts` for signup profile/testimonial persistence.
- `src/server/services/registration.ts` for public webinar registration.

Server actions should parse form data, call services, and handle revalidation/redirects.

## 5. Split Large Client Components

Status: partially implemented.

Current webinar workspace modules:

- `src/components/webinars/workspace/webinar-workspace.tsx`
- `src/components/webinars/workspace/overview-tab.tsx`
- `src/components/webinars/workspace/leads-tab.tsx`
- `src/components/webinars/workspace/reminders-tab.tsx`
- `src/components/webinars/workspace/follow-up-tab.tsx`
- `src/components/webinars/workspace/types.ts`

Keep `src/components/webinars/webinar-workspace.tsx` as a compatibility re-export unless all imports move.

Recommended next splits:

- Extract shared pipeline card/column pieces used by both webinar and global pipeline boards.
- Extract public landing page sections from `src/app/w/[slug]/page.tsx` if that file keeps growing.

## 6. Improve Type Safety

Status: ongoing.

Good next steps:

- Replace remaining broad casts with local row types.
- Add generated Supabase types once schema churn slows.
- Make service return shapes consistent.
- Add tests around ownership and reminder-template key validation.

## Suggested Implementation Order

1. Keep domain modules current whenever adding a new enum/key.
2. Move repeated Supabase reads into query modules.
3. Move multi-step mutations into service modules.
4. Split UI only after behavior is covered by type/build checks.
5. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

## Known Refactor Boundary

Do not split `leads.status` into attendance and pipeline fields as a casual refactor. That is a product/data migration and should be planned separately.
