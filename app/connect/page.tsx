import { ConnectPageClient } from "./ConnectPageClient";
import { siteConfig } from "@/lib/site";

export default function ConnectPage() {
  return <ConnectPageClient contactEmail={siteConfig.contactEmail} />;
}
