"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

function HomeIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

function AudienceIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: <HomeIcon /> },
  { href: "/contacts", label: "Contacts", icon: <UsersIcon /> },
  { href: "/tags", label: "Tags", icon: <TagIcon /> },
  { href: "/audiences", label: "Audiences", icon: <AudienceIcon /> },
  { href: "/campaigns", label: "Campaigns", icon: <MailIcon /> },
];

function NavLink({ item, compact = false }: { item: NavItem; compact?: boolean }) {
  const pathname = usePathname();
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-[#e7ecff] text-[#6161ff]"
          : "text-[#535768] hover:bg-[#f5f6f8] hover:text-[#333333]"
      } ${compact ? "shrink-0 whitespace-nowrap" : ""}`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[#d0d4e4] bg-white lg:flex">
        <div className="border-b border-[#d0d4e4] px-5 py-6">
          <Link href="/" className="text-xl font-medium text-[#333333]">
            Olio
          </Link>
          <p className="mt-1 text-xs text-[#535768]">Email marketing</p>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="border-t border-[#d0d4e4] px-4 py-4">
          {user ? (
            <p className="truncate text-xs text-[#535768]" title={user.email}>
              {user.email}
            </p>
          ) : null}
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={logout}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[#d0d4e4] bg-white lg:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-medium text-[#333333]">
              Olio
            </Link>
            <Button
              variant="outline"
              className="px-4 py-2 text-sm"
              onClick={logout}
            >
              Sign out
            </Button>
          </div>
          <nav
            aria-label="Main"
            className="flex gap-1 overflow-x-auto px-3 pb-3"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} compact />
            ))}
          </nav>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
