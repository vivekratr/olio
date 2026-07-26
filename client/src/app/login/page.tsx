import { Suspense } from "react";

import { GuestRoute } from "@/hooks/useAuth";
import { LoginPage } from "@/views/LoginPage";

export default function LoginRoute() {
  return (
    <GuestRoute>
      <Suspense>
        <LoginPage />
      </Suspense>
    </GuestRoute>
  );
}
