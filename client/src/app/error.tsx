"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4">
      <div className="w-full max-w-md rounded-[24px] border border-[#d0d4e4] bg-white p-8 text-center shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
        <p className="text-lg font-medium text-[#333333]">
          This page couldn&apos;t load
        </p>
        <p className="mt-2 text-sm text-[#535768]">
          Something crashed while rendering. Reload to try again, or go back.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()}>Reload</Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
