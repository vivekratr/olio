import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLoading?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLoading = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-[24px] border border-[#fcd0f8] bg-[#eddff7] p-8 text-center"
    >
      <p className="text-lg font-medium text-[#333333]">{title}</p>
      <p className="mt-2 text-sm text-[#535768]">{message}</p>
      {onRetry ? (
        <div className="mt-6">
          <Button
            variant="outline"
            loading={retryLoading}
            onClick={onRetry}
          >
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
