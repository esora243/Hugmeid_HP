import { SavedItemsBoundary } from "@/components/SavedItemsBoundary";
import { SavedPageClient } from "@/app/saved/SavedPageClient";

export default function SavedPage() {
  return (
    <SavedItemsBoundary>
      <SavedPageClient />
    </SavedItemsBoundary>
  );
}
