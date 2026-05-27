# Production Deployment Checklist

This checklist is for the HugNavi Phase 1 Cloud Run staging and production rollout. It documents the required configuration and verification steps only; it does not authorize an actual deployment by itself.

## Required Environment

Configure these values in Cloud Run and in local `.env.local` only when needed for verification. Do not commit real values.

| Variable | Scope | Required for production | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Browser | Yes | Display name. |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Browser | Yes | Metadata description. |
| `NEXT_PUBLIC_SITE_URL` | Browser | Yes | Must be the production HTTPS origin. |
| `IMAGE_ALLOWED_REMOTE_HOSTS` | Build/server | Yes | Comma-separated allowlist of HTTPS image asset hostnames, for example a Google Cloud Storage or Cloud CDN hostname. |
| `HugNavi_DEPLOY_ENV` | Server only | Yes | Must be `staging` on the staging Cloud Run service and `production` on the production service. |
| `HugNavi_DATABASE_ENV` | Server only | Yes | Must match `HugNavi_DEPLOY_ENV` and the Cloud SQL `app_environment.database_environment` sentinel; mismatches fail closed before database access. |
| `CLOUD_SQL_CONNECTION_NAME` | Server only | Yes | Cloud SQL instance connection name, for example `project:region:instance`. |
| `PGHOST` | Server only | Yes | Cloud Run Unix socket directory, `/cloudsql/<connection-name>`. |
| `PGPORT` | Server only | Yes | PostgreSQL port, normally `5432`. |
| `PGDATABASE` | Server only | Yes | Application database name. |
| `PGUSER` | Server only | Yes | Application database user. |
| `PGPASSWORD` | Server only | Yes | Store in Secret Manager, never commit. |
| `PGPOOL_MAX` | Server only | Optional | Per-instance PostgreSQL pool size. |
| `NEXT_PUBLIC_LIFF_ID` | Browser | Yes | LIFF app ID for the production LINE channel. |
| `NEXT_PUBLIC_LINE_LOGIN_URL` | Browser | Optional | External LINE Login URL for non-LIFF entry points, if used. |
| `LINE_CHANNEL_ID` | Server only | Yes | Used to verify LIFF ID tokens. |
| `LINE_CHANNEL_SECRET` | Server only | Required by LINE operations | Keep server-only even where current Phase 1 routes do not consume it yet. |
| `LINE_CHANNEL_ACCESS_TOKEN` | Server only | Required before push jobs | Future push/batch delivery token. |
| `SESSION_SECRET` | Server only | Yes | Use a high-entropy production-only secret. Rotating it invalidates existing HugNavi sessions. |
| `NEXT_PUBLIC_DEFAULT_APPLY_URL` | Browser | Optional | Fallback apply URL while per-job URLs are incomplete. |
| `NEXT_PUBLIC_SYLLABUS_URL` | Browser | Optional | External syllabus link. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Browser | Yes | Public support contact. |

## Cloud Run

- Deploy from the repository root with Cloud Build.
- Use Node.js 20.9.0 or newer.
- Use `develop -> staging` and `main -> production`.
- Configure a `HugNavi-web-staging` Cloud Run service with `HugNavi_DEPLOY_ENV=staging` and `HugNavi_DATABASE_ENV=staging`.
- Configure a `HugNavi-web-production` Cloud Run service with `HugNavi_DEPLOY_ENV=production` and `HugNavi_DATABASE_ENV=production`.
- Configure all required environment variables and secrets on each Cloud Run service.
- Attach the Cloud SQL instance with `--add-cloudsql-instances`.
- Staging and production must use separate Cloud SQL database credentials, separate Cloud Run services, and separate LINE Login channels/LIFF apps.
- Confirm `NEXT_PUBLIC_SITE_URL` matches the deployed origin for the target environment exactly.

## Cloud SQL

- Apply migrations in `cloudsql/migrations/` in filename order.
- Apply required lookup seeds in `cloudsql/seeds/`.
- Use separate staging and production Cloud SQL databases or instances.
- Use separate least-privilege Cloud SQL application users and password secrets for staging and production runtime traffic.
- Set the `app_environment` row to the target database environment after migrations: `update app_environment set value = 'staging' where key = 'database_environment';` for staging and `value = 'production'` for production.
- Keep the `rate_limit_buckets` table in the target Cloud SQL database so authenticated mutation limits are shared across Cloud Run instances.
- Keep database passwords out of browser code, logs, documentation, and client bundles.
- Keep the Cloud Run runtime service account scoped to the target Cloud SQL instance where possible.

## LINE

- Configure the LIFF app with the target deployed URL.
- Set `NEXT_PUBLIC_LIFF_ID` to the LIFF app ID for the target environment.
- Set `LINE_CHANNEL_ID` to the channel that issues the LIFF ID tokens.
- Keep channel secrets and access tokens server-only.
- Do not share LINE Login channels, LIFF app IDs, channel secrets, or access tokens between staging and production.
- Confirm the Route Handler session flow is `LIFF ID token -> /api/auth/line/session -> HugNavi session cookie`.
- Do not expose raw `line_uid` in cookies, API responses, logs, or client state.

## Failure Modes

- Missing Cloud SQL config in local development keeps `/api/health` available with `db: "not_configured"` so local app boot can be distinguished from database setup.
- Missing Cloud SQL config in staging or production returns `db: "config_error"`.
- Missing or invalid `HugNavi_DEPLOY_ENV`, missing or invalid `HugNavi_DATABASE_ENV`, a staging/production label mismatch, or a Cloud SQL `app_environment` sentinel mismatch returns `db: "config_error"` before application data access.
- Public API routes that require Cloud SQL return generic service-unavailable responses when database config is missing.
- Missing `LINE_CHANNEL_ID` makes LINE ID token verification unavailable and returns a generic auth service error.
- Missing `SESSION_SECRET` prevents session creation and returns a generic session service error.

## Release Gate

Run and record the result of:

```sh
npm run test
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=moderate
```

Do not deploy while any of these are failing. A failing audit blocks production deployment, and any failing release-gate command must be fixed by a focused remediation PR before production deployment.

### Audit Remediation Status

As of the release-candidate stabilization update, `npm audit --audit-level=moderate` passes after upgrading Next.js and pinning the PostCSS override used by the dependency tree. Keep the audit command in the release record, and treat any future failure as a production deployment blocker until a focused remediation PR lands and the audit gate passes.

## Cutover Steps

1. Confirm the latest `develop` commit is the intended staging release candidate.
2. Confirm all Phase 1 production-readiness PRs are merged and CI is green.
3. Apply Cloud SQL migrations and required lookup seeds to the staging database in order.
4. Set staging Cloud SQL `app_environment.database_environment` to `staging`.
5. Deploy `develop` to `HugNavi-web-staging` with staging database credentials and staging LINE/LIFF credentials.
6. Confirm staging `/api/health` returns `db: "ok"` and `environment.deploy: "staging"`.
7. Smoke test staging LIFF login, `/api/me`, bookmarks, timetable, and class detail personal APIs.
8. Promote the verified commit to `main`.
9. Apply Cloud SQL migrations and required lookup seeds to the production database in order.
10. Set production Cloud SQL `app_environment.database_environment` to `production`.
11. Deploy `main` to `HugNavi-web-production` with production database credentials and production LINE/LIFF credentials.
12. Smoke test production `/api/health`, LIFF login, `/api/me`, bookmarks, timetable, and class detail personal APIs.
13. Confirm no raw LINE identifiers, service keys, LINE tokens, or internal error details are visible in API responses.
14. Monitor Cloud Run and Cloud SQL logs for authentication, SQL, and server-only secret boundary errors.
