import { LogoutButton } from "@/components/LogoutButton";
import { PageLayout } from "@/components/ui/PageLayout";

export default function Home() {
  return (
    <PageLayout
      eyebrow="Email marketing"
      title="Welcome to Olio"
      headerAction={<LogoutButton />}
    >
      <div className="rounded-[24px] border border-[#d0d4e4] bg-white p-10 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
        <p className="text-lg text-[#535768]">
          Manage contacts, audiences, and campaigns from one place. Open a
          campaign&apos;s analytics page to watch delivery metrics update in
          real time.
        </p>
      </div>
    </PageLayout>
  );
}
