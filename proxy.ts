import { NextResponse, type NextRequest } from "next/server";

function configuredHttpsOrigin(value: string | undefined) {
  const text = value?.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

function contentSecurityPolicy(nonce: string) {
  const devScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const syllabusOrigin = configuredHttpsOrigin(process.env.NEXT_PUBLIC_SYLLABUS_URL);
  const lineScriptSources = ["https://static.line-scdn.net", "https://liffsdk.line-scdn.net"];
  const lineConnectSources = [
    "https://api.line.me",
    "https://access.line.me",
    "https://liff.line.me",
    "https://liff-subwindow.line.me",
    "https://liff-shortcut.line.me",
    "https://liffsdk.line-scdn.net",
    "https://uts-front.line-apps.com",
  ];
  const lineFrameSources = ["https://access.line.me", "https://liff.line.me", "https://liff-subwindow.line.me"];
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${lineScriptSources.join(" ")}${devScriptPolicy}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${lineConnectSources.join(" ")}`,
    ["frame-src 'self'", ...lineFrameSources, syllabusOrigin].filter(Boolean).join(" "),
    "frame-ancestors 'self' https://liff.line.me https://*.line.me",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
    },
  ],
};
