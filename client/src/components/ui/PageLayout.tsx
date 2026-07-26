import type { ReactNode } from "react";

interface PageLayoutProps {
  eyebrow?: string;
  title?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

export function PageLayout({
  eyebrow,
  title,
  headerAction,
  children,
}: PageLayoutProps) {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 py-12">
      {eyebrow || title || headerAction ? (
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-sm font-medium text-[#535768]">{eyebrow}</p>
            ) : null}
            {title ? (
              <h1 className="mt-2 text-4xl font-light tracking-[-0.02em] text-[#333333]">
                {title}
              </h1>
            ) : null}
          </div>
          {headerAction}
        </header>
      ) : null}
      {children}
    </section>
  );
}
