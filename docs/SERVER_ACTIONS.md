# Server Actions

Server actions live in `src/app/actions/`. They are intentionally thin: parse input, call a service or trusted server helper, then revalidate or redirect.

## Action Files

### `src/app/actions/auth.ts`

Owns:

- `signInWithPassword`
- `signUp`
- `signOut`

Current behavior:

- Signup creates the Supabase auth user.
- Signup saves presenter bio/highlights to `profiles`.
- Signup saves exactly three testimonials.
- Sign-in ensures default reminder templates exist.

### `src/app/actions/webinars.ts`

Owns:

- `createWebinar`

Current behavior:

- Parses the webinar creation form with `webinarFormSchema`.
- Calls `createWebinarForUser` in `src/server/services/webinars.ts`.
- Revalidates `/webinars` and `/dashboard`.
- Redirects to `/webinars/[id]`.

### `src/app/actions/leads.ts`

Owns:

- `updateLeadStatus`
- `updateLeadFollowUp`
- `addLeadNote`
- `mockSendFollowUp`
- `runPostWebinarSequence`

Current behavior:

- Parses status/sequence values from `src/domain/leads.ts`.
- Calls lead services in `src/server/services/leads.ts`.
- Revalidates webinar, dashboard, and pipeline views where relevant.

### `src/app/actions/templates.ts`

Owns:

- `updateUserReminderTemplate`
- `updateWebinarReminderTemplate`

Current behavior:

- Parses template keys using `reminderTemplateKeySchema`.
- Calls template services in `src/server/services/templates.ts`.
- This fixes older drift where validation only allowed pre-automation keys.

### `src/app/actions/reminders.ts`

Compatibility wrapper around reminder services:

- `ensureDefaultReminderTemplates`
- `copyDefaultTemplatesToWebinar`

The implementation lives in `src/server/services/reminders.ts`.

### `src/app/actions/register.ts`

Owns:

- `registerForWebinar`

Current behavior:

- Uses the service-role Supabase client because public users are not authenticated.
- Looks up the page by slug.
- Creates a lead.
- Creates scheduled reminder events from webinar templates.
- Returns the webinar join URL after successful registration.

This action has not yet been split into a service module.

## Current Patterns

- Domain values and zod schemas should come from `src/domain/*`.
- Auth should use `getCurrentUser()` or `requireUser()` from `src/server/auth/current-user.ts`.
- Ownership checks should use `assertWebinarOwner()` or `assertLeadOwner()` from `src/server/auth/ownership.ts`.
- Mutations should live in `src/server/services/*` when they are more than trivial.
- Pages should call `src/server/queries/*` for reusable reads.

## Recommended Future Structure

- Move public registration workflow from `src/app/actions/register.ts` into a dedicated service.
- Standardize server action return shapes across actions.
- Add integration-level tests around ownership checks and lead automation actions.
- Consider generated Supabase types once the schema stabilizes.
