"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function LogoutButton() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <span className="text-sm text-[#535768]">{user.email}</span>
      ) : null}
      <Button
        variant="outline"
        onClick={() => {
          logout();
          router.replace("/login");
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
