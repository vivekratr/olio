import { GuestRoute } from "@/hooks/useAuth";
import { RegisterPage } from "@/pages/RegisterPage";

export default function RegisterRoute() {
  return (
    <GuestRoute>
      <RegisterPage />
    </GuestRoute>
  );
}
