# LIFF Security Reliability Follow-ups

Date: 2026-05-05
Branch: `codex/liff-security-reliability-fixes`

## P3 Dependency Audit

`npm audit --omit=dev` still reports the known production advisories in `next@14.2.35` and Next's bundled `postcss`:

- High severity Next.js advisories, including Image Optimizer and Server Components DoS classes.
- Moderate PostCSS stringify XSS advisory through `next/node_modules/postcss`.

`npm audit fix --force` would install `next@16.2.4`, which is a breaking framework upgrade. This branch intentionally does not mix that dependency upgrade into the LIFF auth/profile reliability fixes. Track and execute the Next/PostCSS security upgrade as a separate branch/PR with focused compatibility validation.
