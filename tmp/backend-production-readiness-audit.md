# Backend Production Readiness Audit

- Date: 2026-05-10
- Base branch: `develop`
- Base commit inspected: `e98d109 Fix LIFF session and profile reliability (#2)`
- Repo: `Hugmeid/hugmeid-web`

## Source of Truth

- Running code and files in this repo are treated as the implementation truth.
- Design intent was checked against:
  - `/Users/yuyoshimuta/Documents/dev/Hugmeid/システム設計書/システム設計書.md`
  - `/Users/yuyoshimuta/Documents/dev/Hugmeid/システム設計書/BG実装設計.md`
  - `/Users/yuyoshimuta/Documents/dev/Hugmeid/システム設計書/API契約_DTO設計.md`
  - `/Users/yuyoshimuta/Documents/dev/Hugmeid/システム設計書/Supabase_dev適用状況.md`

## Current Backend Surface

Implemented Route Handlers:

- `GET /api/health`
- `POST /api/auth/line/session`
- `DELETE /api/auth/line/session`
- `GET /api/me`
- `PUT /api/me/profile`
- `GET /api/profile/options`
- `GET /api/jobs`
- `GET /api/jobs/[slugOrId]`
- `GET /api/timetable`

Implemented server helpers:

- `lib/auth/line.ts`: LINE ID token verification.
- `lib/auth/session.ts`: signed httpOnly Hugmeid session cookie containing `userId` and expiry only.
- `lib/users.ts`: LINE UID upsert, session user lookup, profile options, and profile update through server-only service-role REST.
- `lib/jobs.ts`: public active job list/detail DTO mapping through anon REST.
- `lib/timetable.ts`: public active shared class timetable DTO mapping through anon REST.
- `lib/supabase/rest.ts`: anon REST and service-role REST fetch helpers.

Tests currently present:

- Auth/session: `tests/line-auth.test.ts`, `tests/line-session.test.ts`, `tests/session.test.ts`.
- Profile: `tests/profile-validation.test.ts`, `tests/profile-save.test.ts`, `tests/profile-options-response.test.ts`.
- Public data helpers: `tests/api-query.test.ts`, `tests/timetable-core.test.ts`.

## Confirmed Security Boundaries

- Raw `line_uid` is server-side only in current DTO mapping; API responses expose `lineUidMasked`.
- Session cookie payload is `{ userId, exp }`, not raw LINE identifiers.
- Session cookies are `httpOnly`, `sameSite: "lax"`, `secure` in production, path `/`, with a max age.
- `SUPABASE_SERVICE_ROLE_KEY` is only referenced by `lib/supabase/rest.ts` and consumed by server-side user/profile helpers.
- `HUGMEID_DEV_MOCK_AUTH` is disabled in production by code guard.
- Deactivated users cannot receive a new login session and cannot be fetched/updated through current session profile APIs.

## Remaining Production-Readiness Gaps

### Job bookmarks

- Missing `GET /api/me/bookmarks`.
- Missing `POST /api/me/bookmarks/jobs/[jobId]`.
- Missing `DELETE /api/me/bookmarks/jobs/[jobId]`.
- UI save state still uses `components/SavedItemsContext.tsx` and localStorage for both `job` and `campaign`.
- `JobListItemDto.isSaved` is always false because jobs are fetched without session bookmark state.

### Personal timetable

- Missing `GET /api/me/timetable`.
- Missing add/remove/upsert APIs for `user_timetable_entries`.
- `/school` still reads the shared public `/api/timetable` and presents shared seed data as the timetable.

### Class detail APIs

- Missing route handlers for `syllabus_class_resources`.
- Missing route handlers for `syllabus_class_tasks`.
- Missing personal memo/tag/task-status APIs.
- Missing personal notification settings API/state for `user_notification_settings`.
- Same-university/shared edit rules are present in design SQL but not enforced by app Route Handlers yet.

### Migrations and Supabase artifacts

- This repo currently contains only `supabase/migrations/20260505000000_update_liff_profile_rpc.sql`.
- The main Phase 1 schema and verification SQL live under the design-doc workspace:
  - `システム設計書/supabase/migrations/20260415000000_init_schema_phase1.sql`
  - `システム設計書/supabase/migrations/20260426000000_add_web_job_fields.sql`
  - `システム設計書/supabase/migrations/20260426001000_restrict_public_jobs_rls.sql`
  - `システム設計書/supabase/migrations/20260426002000_fix_function_search_path.sql`
  - `システム設計書/supabase/verify_jobs_rls.sql`
- Before production cutover, migrations should be mirrored or otherwise made available from the deployable repo path.

### Dependency security

- `npm audit --audit-level=moderate` currently fails.
- Reported packages:
  - `next@14.2.35`: high severity advisories in the audit report.
  - transitive `postcss <8.5.10` under `next`: moderate severity advisory.
- `npm audit fix --force` would install `next@16.2.6`, a breaking upgrade, so this needs a dedicated compatibility slice rather than an automatic forced fix.

## Validation Run

- `npm install`: passed; installed 185 packages.
- `npm run test`: passed, 30 tests.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm audit --audit-level=moderate`: failed due to Next.js/PostCSS advisories listed above.

## Recommended Next Slice Order

1. Implement the job bookmark backend API and tests.
2. Integrate logged-in job saves with the bookmark API while keeping campaign saves outside DB sync.
3. Implement session-backed personal timetable APIs and tests.
4. Move `/school` toward session-backed "my timetable" while preserving shared browsing.
5. Add class detail APIs and personal class notification settings only where the schema and UI contract are ready.
6. Run a dedicated route-handler security hardening pass.
7. Mirror/verify Supabase migrations and RLS scripts from design docs into the deployable path if that is the chosen operational source.
8. Resolve dependency audit and production deployment checklist in their own focused slices.
