import { CampaignEditorPage } from "@/views/CampaignEditorPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCampaignRoute({ params }: PageProps) {
  const { id } = await params;
  return <CampaignEditorPage campaignId={id} />;
}
