import { Suspense } from "react";

import { GuestRoute } from "@/hooks/useAuth";
import { LoginPage } from "@/pages/LoginPage";

export default function LoginRoute() {
  return (
    <GuestRoute>
      <Suspense>
        <LoginPage />
      </Suspense>
    </GuestRoute>
  );
}
