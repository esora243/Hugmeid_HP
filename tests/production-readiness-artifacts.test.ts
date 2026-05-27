import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const envExample = () => readFileSync(join(process.cwd(), ".env.example"), "utf8");
const deploymentChecklist = () =>
  readFileSync(join(process.cwd(), "docs/production-deployment-checklist.md"), "utf8");
const nextConfig = () => readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");
const proxy = () => readFileSync(join(process.cwd(), "proxy.ts"), "utf8");
const gcloudIgnore = () => readFileSync(join(process.cwd(), ".gcloudignore"), "utf8");
const globalsCss = () => readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const siteConfig = () => readFileSync(join(process.cwd(), "lib/site.ts"), "utf8");
const appShell = () => readFileSync(join(process.cwd(), "components/AppShell.tsx"), "utf8");
const appToaster = () => readFileSync(join(process.cwd(), "components/AppToaster.tsx"), "utf8");
const appBrowserChrome = () => readFileSync(join(process.cwd(), "components/AppBrowserChrome.tsx"), "utf8");
const authContext = () => readFileSync(join(process.cwd(), "components/AuthContext.tsx"), "utf8");
const loginModal = () => readFileSync(join(process.cwd(), "components/LoginModal.tsx"), "utf8");
const loginModalHost = () => readFileSync(join(process.cwd(), "components/LoginModalHost.tsx"), "utf8");
const schoolWorkspace = () => readFileSync(join(process.cwd(), "app/school/SchoolWorkspaceClient.tsx"), "utf8");
const schoolTimetableTab = () => readFileSync(join(process.cwd(), "app/school/SchoolTimetableTab.tsx"), "utf8");
const schoolArticleDetail = () => readFileSync(join(process.cwd(), "app/school/articles/[id]/page.tsx"), "utf8");
const connectPage = () => readFileSync(join(process.cwd(), "app/connect/page.tsx"), "utf8");
const connectPageClient = () => readFileSync(join(process.cwd(), "app/connect/ConnectPageClient.tsx"), "utf8");
const contactPanel = () => readFileSync(join(process.cwd(), "app/connect/ContactPanel.tsx"), "utf8");
const faqPanel = () => readFileSync(join(process.cwd(), "app/connect/FaqPanel.tsx"), "utf8");
const jobDetail = () => readFileSync(join(process.cwd(), "app/jobs/[id]/JobDetailPageClient.tsx"), "utf8");
const campaignDetail = () => readFileSync(join(process.cwd(), "app/campaign/[id]/CampaignDetailPageClient.tsx"), "utf8");
const profilePage = () => readFileSync(join(process.cwd(), "app/profile/ProfilePageClient.tsx"), "utf8");
const registerClient = () => readFileSync(join(process.cwd(), "app/register/RegisterPageClient.tsx"), "utf8");
const profileEditClient = () => readFileSync(join(process.cwd(), "app/profile/edit/ProfileEditPageClient.tsx"), "utf8");
const profileOptionsRoute = () => readFileSync(join(process.cwd(), "app/api/profile/options/route.ts"), "utf8");
const jobsRoute = () => readFileSync(join(process.cwd(), "app/api/jobs/route.ts"), "utf8");
const jobDetailRoute = () => readFileSync(join(process.cwd(), "app/api/jobs/[slugOrId]/route.ts"), "utf8");
const timetableRoute = () => readFileSync(join(process.cwd(), "app/api/timetable/route.ts"), "utf8");
const jsonRouteHelper = () => readFileSync(join(process.cwd(), "lib/next-json-route.ts"), "utf8");

function readProjectTextFiles(root: string, ignoredDirectories = new Set([".git", ".next", ".test-dist", "node_modules", "tmp"])) {
  const files: Array<{ path: string; text: string }> = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...readProjectTextFiles(path, ignoredDirectories));
      continue;
    }
    if (!entry.isFile()) continue;
    if (statSync(path).size > 512_000) continue;
    if (!/\.(?:css|js|json|md|mjs|sql|ts|tsx|txt|yml|yaml)$/.test(entry.name) && entry.name !== ".env.example") continue;
    files.push({ path, text: readFileSync(path, "utf8") });
  }

  return files;
}

test(".env.example covers production runtime environment variables without secrets", () => {
  const env = envExample();

  for (const variable of [
    "NEXT_PUBLIC_APP_NAME",
    "NEXT_PUBLIC_APP_DESCRIPTION",
    "NEXT_PUBLIC_SITE_URL",
    "IMAGE_ALLOWED_REMOTE_HOSTS",
    "HugNavi_DEPLOY_ENV",
    "HugNavi_DATABASE_ENV",
    "CLOUD_SQL_CONNECTION_NAME",
    "PGHOST",
    "PGPORT",
    "PGDATABASE",
    "PGUSER",
    "PGPASSWORD",
    "NEXT_PUBLIC_LIFF_ID",
    "NEXT_PUBLIC_LINE_LOGIN_URL",
    "LINE_CHANNEL_ID",
    "LINE_CHANNEL_SECRET",
    "LINE_CHANNEL_ACCESS_TOKEN",
    "SESSION_SECRET",
    "NEXT_PUBLIC_DEFAULT_APPLY_URL",
    "NEXT_PUBLIC_SYLLABUS_URL",
    "NEXT_PUBLIC_CONTACT_EMAIL",
  ]) {
    assert.match(env, new RegExp(`^${variable}=`, "m"));
  }

  assert.match(env, /^PGPASSWORD=$/m);
  assert.doesNotMatch(env, /line_channel_secret_[A-Za-z0-9]/i);
  assert.doesNotMatch(env, /SESSION_SECRET=.{20,}/);
});

test("production artifacts do not keep a mock authentication path", () => {
  const forbidden = [
    "HugNavi_DEV_MOCK_AUTH",
    "__HugNavi_DEV_MOCK_ID_TOKEN__",
    "dev-line-uid",
    "allowDevMock",
    "canUseDevMockAuth",
  ];

  for (const file of readProjectTextFiles(process.cwd())) {
    for (const marker of forbidden) {
      if (file.path.endsWith("tests/production-readiness-artifacts.test.ts")) continue;
      assert.doesNotMatch(file.text, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${marker} remained in ${file.path}`);
    }
  }
});

test("Cloud Run source deploy excludes local secrets and build artifacts", () => {
  const ignore = gcloudIgnore();

  for (const required of [".env", ".env.*", "node_modules/", ".next/", ".test-dist/", "tmp/"]) {
    assert.match(ignore, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(ignore, /!\.env\.example/);
});

test("GCP deployment artifacts do not keep Vercel deployment config", () => {
  assert.equal(existsSync(join(process.cwd(), "vercel.json")), false);
  assert.doesNotMatch(siteConfig(), /vercel/i);
});

test("Next.js config applies browser security headers and constrained images", () => {
  const config = nextConfig();
  const cspProxy = proxy();

  for (const required of [
    "Referrer-Policy",
    "X-Content-Type-Options",
    "Permissions-Policy",
    "Cross-Origin-Opener-Policy",
    "Cache-Control",
    "no-store",
    "/api/me/:path*",
    "/api/auth/:path*",
    "IMAGE_ALLOWED_REMOTE_HOSTS",
    "remotePatterns: imageRemotePatterns",
  ]) {
    assert.match(config, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const required of ["object-src 'none'", "frame-ancestors", "style-src", "font-src", "connect-src"]) {
    assert.match(cspProxy, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const required of ["static.line-scdn.net", "liffsdk.line-scdn.net", "liff-subwindow.line.me", "uts-front.line-apps.com"]) {
    assert.match(cspProxy, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(config, /hostname:\s*"\\*\\*"/);
  assert.match(cspProxy, /Content-Security-Policy/);
  assert.match(cspProxy, /nonce-/);
  assert.match(cspProxy, /strict-dynamic/);
  assert.doesNotMatch(cspProxy.match(/script-src[^\n]+/)?.[0] ?? "", /unsafe-inline/);
});

test("public API cache headers are success-only", () => {
  assert.match(jsonRouteHelper(), /publicCachedJsonRoute/);
  assert.match(jsonRouteHelper(), /"Cache-Control": "no-store"/);
  assert.match(jsonRouteHelper(), /status >= 200 && status < 300/);

  for (const source of [jobsRoute(), jobDetailRoute(), timetableRoute()]) {
    assert.match(source, /publicCachedJsonRoute/);
    assert.match(source, /public, max-age=30, stale-while-revalidate=300/);
  }

  assert.match(jobsRoute(), /invalid_query[\s\S]*"Cache-Control": "no-store"/);
  assert.match(profileOptionsRoute(), /public, max-age=300, stale-while-revalidate=3600/);
  assert.match(profileOptionsRoute(), /"Cache-Control": "no-store"/);
  assert.doesNotMatch(nextConfig(), /source: "\/api\/profile\/options"[\s\S]*public, max-age=300/);
});

test("toast host is mounted at the app shell for public routes", () => {
  assert.match(appShell(), /import \{ AppToaster \} from "@\/components\/AppToaster"/);
  assert.match(appShell(), /<AppToaster \/>/);
  assert.match(appToaster(), /import \{ Toaster \} from "sonner"/);
  assert.match(appToaster(), /<Toaster position="top-center" \/>/);
  assert.doesNotMatch(loginModalHost(), /\bToaster\b/);
});

test("LIFF login failures remain visible instead of looking like a dead button", () => {
  assert.match(authContext(), /setError\(message\)/);
  assert.match(authContext(), /LINEログイン画面を開いています/);
  assert.match(loginModal(), /AuthProvider owns the user-facing error message/);
  assert.match(loginModalHost(), /result === "authenticated"/);
  assert.doesNotMatch(loginModalHost(), /await login\(\);\s*toast\.success/);
});

test("visible controls do not keep no-op placeholder buttons", () => {
  assert.doesNotMatch(appBrowserChrome(), /aria-label="最小化"/);
  assert.doesNotMatch(appBrowserChrome(), /aria-label="メニュー"/);
  assert.doesNotMatch(schoolWorkspace(), /<Menu size=\{16\}/);
  assert.doesNotMatch(schoolWorkspace(), /<Clock size=\{16\}/);
  assert.doesNotMatch(schoolTimetableTab(), /<button className="p-1"><Chevron/);

  for (const source of [schoolArticleDetail(), jobDetail(), campaignDetail()]) {
    assert.match(source, /const handleShare = async \(\) =>/);
    assert.match(source, /navigator\.clipboard\.writeText\(window\.location\.href\)/);
  }

  assert.match(profilePage(), /router\.push\("\/connect"\)/);
  assert.match(profilePage(), /通知設定は現在準備中です/);
});

test("detail CTAs stay above the non-LIFF browser chrome", () => {
  assert.match(globalsCss(), /--HugNavi-nav-top:\s*52px/);
  assert.match(globalsCss(), /--HugNavi-browser-bottom:\s*64px/);
  assert.match(appBrowserChrome(), /const chromeOffsets =/);
  assert.match(appBrowserChrome(), /"--HugNavi-browser-bottom"/);

  for (const source of [jobDetail(), campaignDetail()]) {
    assert.match(source, /pb-\[calc\(7rem\+var\(--HugNavi-browser-bottom\)\)\]/);
    assert.match(source, /bottom-\[var\(--HugNavi-browser-bottom\)\]/);
    assert.doesNotMatch(source, /HugNavi-browser-bottom,64px/);
  }
});

test("connect page keeps runtime contact email at the server boundary", () => {
  const clientSources = [connectPageClient(), contactPanel(), faqPanel()].join("\n");

  assert.match(connectPage(), /<ConnectPageClient contactEmail=\{siteConfig\.contactEmail\} \/>/);
  assert.match(connectPageClient(), /type ConnectPageClientProps = \{\s*contactEmail: string;\s*\}/);
  assert.match(contactPanel(), /mailto:\$\{contactEmail\}/);
  assert.doesNotMatch(clientSources, /@\/lib\/site|siteConfig/);
});

test("profile option failures stay visible and local development has a safe fallback", () => {
  assert.match(profileOptionsRoute(), /createDefaultProfileOptions/);
  assert.match(profileOptionsRoute(), /database_config_missing/);
  assert.match(profileOptionsRoute(), /error\.deployEnv === "local"/);

  for (const source of [registerClient(), profileEditClient()]) {
    assert.match(source, /optionsLoading/);
    assert.match(source, /optionsError/);
    assert.match(source, /プロフィール選択肢を読み込めませんでした/);
    assert.match(source, /再読み込み/);
  }
});

test("production deployment checklist documents release gates and boundary requirements", () => {
  const checklist = deploymentChecklist();

  for (const required of [
    "npm run test",
    "npm run typecheck",
    "npm run lint",
    "npm run build",
    "npm audit --audit-level=moderate",
    "Do not deploy while any of these are failing.",
    "A failing audit blocks production deployment",
    "any future failure as a production deployment blocker",
    "cloudsql/migrations/",
    "cloudsql/seeds/",
    "LIFF ID token -> /api/auth/line/session -> HugNavi session cookie",
    "Do not expose raw `line_uid`",
    "database passwords out of browser code",
    "app_environment",
    "Missing `SESSION_SECRET` prevents session creation",
    "develop -> staging",
    "main -> production",
    "separate LINE Login channels/LIFF apps",
    "HugNavi-web-staging",
    "HugNavi-web-production",
  ]) {
    assert.match(checklist, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(checklist, /LINE\/LIFF credentials may remain shared/);
});
