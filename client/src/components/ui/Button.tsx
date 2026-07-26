import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#6161ff] text-white hover:bg-[#5050e0] hover:shadow-[0_4px_14px_rgba(97,97,255,0.32)] active:shadow-[0_2px_6px_rgba(97,97,255,0.24)] disabled:bg-[#6161ff]/60 disabled:shadow-none",
  outline:
    "border border-[#535768] bg-transparent text-[#333333] hover:border-[#333333] hover:bg-[#f5f6f8] hover:shadow-[0_2px_10px_rgba(51,51,51,0.08)] active:shadow-none disabled:opacity-60",
  destructive:
    "bg-[#e44258] text-white hover:bg-[#c93649] hover:shadow-[0_4px_14px_rgba(228,66,88,0.28)] active:shadow-[0_2px_6px_rgba(228,66,88,0.22)] disabled:bg-[#e44258]/60 disabled:shadow-none",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading}
      className={`btn-interactive inline-flex items-center justify-center gap-2 rounded-full px-6 py-[13px] text-base font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  );
}
