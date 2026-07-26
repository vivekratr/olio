"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  steps?: string[];
  hint?: string;
  variant?: "default" | "search";
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="mx-auto h-10 w-10 text-[#535768]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg
      aria-hidden
      className="mx-auto h-10 w-10 text-[#6161ff]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  steps,
  hint,
  variant = "default",
}: EmptyStateProps) {
  const isSearch = variant === "search";

  return (
    <div className="rounded-[24px] border border-[#d0d4e4] bg-white p-10 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
      <div className="mx-auto max-w-lg text-center">
        {isSearch ? <SearchIcon /> : <EmptyIcon />}

        <p className="mt-4 text-xl font-medium text-[#333333]">{title}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#535768]">
          {description}
        </p>

        {steps && steps.length > 0 ? (
          <ol className="mt-6 space-y-2 text-left">
            {steps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-[12px] bg-[#f5f6f8] px-4 py-3 text-sm text-[#535768]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e7ecff] text-xs font-medium text-[#6161ff]">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {action || secondaryAction ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {action}
            {secondaryAction}
          </div>
        ) : null}

        {hint ? (
          <p className="mt-6 text-xs text-[#535768]">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
