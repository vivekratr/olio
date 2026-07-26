import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-[#d0d4e4] bg-white p-10 text-center shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
      <p className="text-xl font-medium text-[#333333]">{title}</p>
      <p className="mt-3 text-sm text-[#535768]">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
