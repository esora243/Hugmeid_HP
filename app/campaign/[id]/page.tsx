import { SavedItemsBoundary } from "@/components/SavedItemsBoundary";
import { CampaignDetailPageClient } from "@/app/campaign/[id]/CampaignDetailPageClient";

type CampaignDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params;

  return (
    <SavedItemsBoundary>
      <CampaignDetailPageClient campaignId={id} />
    </SavedItemsBoundary>
  );
}
