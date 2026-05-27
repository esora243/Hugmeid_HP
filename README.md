# HugNavi Web

HugNavi Web is a Next.js App Router application for the Phase 1 LIFF-based medical-student platform.

## Current Backend Contract

- LINE authentication uses a LIFF ID token posted to a Next.js Route Handler.
- The server verifies the token, resolves the HugNavi user, and issues a signed httpOnly HugNavi session cookie.
- Browser code must not receive raw `line_uid`, LINE tokens, or database credentials.
- Personal data APIs are scoped by the HugNavi session `userId`.
- Private Cloud SQL tables are accessed from Route Handlers after session checks.
- Public jobs prefer slug URLs. UUID lookup remains compatibility-only.
- Campaign saves remain local-only in Phase 1.

## Local Development

1. Use Node.js 20.9.0 or newer.
2. Copy `.env.example` to `.env.local`.
3. Fill Cloud SQL, LINE, and session values for the environment you are testing.
4. Install dependencies and run the app:

```sh
npm install
npm run dev
```

## Verification Commands

Run these before opening a production-readiness PR:

```sh
npm run test
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

`npm audit --audit-level=moderate` is intentionally listed as a release gate. A failing audit blocks production deployment until a focused remediation PR lands and the command passes.

## Deployment

Use [docs/production-deployment-checklist.md](docs/production-deployment-checklist.md) for the Cloud Run, Cloud SQL, LINE, and cutover checklist.

Apply Cloud SQL migrations from `cloudsql/migrations/` and lookup seeds from `cloudsql/seeds/`.
