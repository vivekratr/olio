"use client";

import type { ReactNode } from "react";

export function DialogCloseButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label="Close dialog"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-full p-1 text-[#535768] transition hover:bg-[#f5f6f8] hover:text-[#333333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6161ff] disabled:opacity-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  );
}

export function DialogHeader({
  title,
  titleId,
  onClose,
  disabled,
  children,
}: {
  title: ReactNode;
  titleId?: string;
  onClose: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="text-xl font-medium">
          {title}
        </h2>
        {children}
      </div>
      <DialogCloseButton onClick={onClose} disabled={disabled} />
    </div>
  );
}
