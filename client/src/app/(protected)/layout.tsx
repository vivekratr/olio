import { ProtectedRoute } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
