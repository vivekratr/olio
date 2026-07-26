"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

const selectClassName =
  "w-full min-h-11 appearance-none rounded-[16px] border border-[#d0d4e4] bg-white py-3 pl-4 pr-11 text-base text-[#333333] shadow-[0_1px_2px_rgba(51,51,51,0.04)] outline-none transition-[border-color,box-shadow,color] duration-150 motion-reduce:transition-none hover:border-[#b8bdd4] focus-visible:border-[#6161ff] focus-visible:ring-[3px] focus-visible:ring-[#6161ff]/15 aria-invalid:border-[#e44258] aria-invalid:ring-[3px] aria-invalid:ring-[#e44258]/12 disabled:cursor-not-allowed disabled:bg-[#f5f6f8] disabled:text-[#808080] disabled:shadow-none";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = "", disabled, children, ...props }, ref) {
  return (
    <div className="group relative">
      <select
        ref={ref}
        disabled={disabled}
        className={`cursor-pointer ${selectClassName} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className={`pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#535768] transition-colors duration-150 motion-reduce:transition-none group-focus-within:text-[#6161ff] group-has-[:disabled]:opacity-40 group-has-[[aria-invalid=true]]:text-[#e44258]`}
      />
    </div>
  );
});

Select.displayName = "Select";
