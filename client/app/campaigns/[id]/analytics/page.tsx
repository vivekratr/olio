import { CampaignAnalyticsPage } from "@/views/campaigns/CampaignAnalyticsPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignAnalyticsRoute({ params }: PageProps) {
  const { id } = await params;

  return <CampaignAnalyticsPage campaignId={id} />;
}
