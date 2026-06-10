import { normalizeEmailAddress, normalizeExternalHttpsUrl, normalizeSiteUrl } from "@/lib/security/url";

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "HagNavi",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "6万人の医学生で創る縁",
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) || "https://hagnavi.example",
  lineLoginUrl: normalizeExternalHttpsUrl(process.env.NEXT_PUBLIC_LINE_LOGIN_URL) || "",
  defaultApplyUrl: normalizeExternalHttpsUrl(process.env.NEXT_PUBLIC_DEFAULT_APPLY_URL) || "",
  syllabusUrl: normalizeExternalHttpsUrl(process.env.NEXT_PUBLIC_SYLLABUS_URL) || "",
  contactEmail: normalizeEmailAddress(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
};
