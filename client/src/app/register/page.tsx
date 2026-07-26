import { GuestRoute } from "@/hooks/useAuth";
import { RegisterPage } from "@/views/RegisterPage";

export default function RegisterRoute() {
  return (
    <GuestRoute>
      <RegisterPage />
    </GuestRoute>
  );
}
