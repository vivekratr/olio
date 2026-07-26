"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-[#bcfe90] bg-[#e7ecff] text-[#2a5c4e]",
  error: "border-[#fcd0f8] bg-[#eddff7] text-[#333333]",
  info: "border-[#d0d4e4] bg-white text-[#333333]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-6 bottom-6 z-50 flex w-full max-w-sm flex-col gap-3"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`toast-enter rounded-[16px] border px-4 py-3 text-sm font-medium shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] ${variantStyles[item.variant]}`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
