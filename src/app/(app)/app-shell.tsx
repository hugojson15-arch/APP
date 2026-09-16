"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import type { Profile, Team } from "@/lib/database.types";
import NotificationSetup from "@/components/notification-setup";

const NAV = [
  { href: "/calendar", label: "Kalender", icon: CalendarIcon },
  { href: "/chat", label: "Chatt", icon: ChatIcon },
  { href: "/drills", label: "Övningar", icon: DrillIcon },
  { href: "/members", label: "Laget", icon: PeopleIcon },
] as const;

export default function AppShell({
  profile,
  team,
  children,
}: {
  profile: Pick<Profile, "id" | "name" | "email" | "role" | "team_id">;
  team: Pick<Team, "id" | "name" | "primary_color" | "secondary_color" | "logo_url" | "invite_code">;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = profile.role === "admin";

  const links = isAdmin ? [...NAV, { href: "/settings", label: "Inställningar", icon: SettingsIcon }] : NAV;

  return (
    <div className="flex min-h-screen flex-col">
      <NotificationSetup />
      <header
        className="btn-secondary flex items-center justify-between px-4 py-3 shadow-sm"
        style={{ background: "var(--color-secondary)", color: "var(--color-secondary-text)" }}
      >
        <div className="flex items-center gap-3">
          {team.logo_url ? (
            <Image
              src={team.logo_url}
              alt={team.name}
              width={36}
              height={36}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: "var(--color-primary)", color: "var(--color-primary-text)" }}
            >
              {team.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="font-semibold">{team.name}</span>
        </div>
        <form action={signOut}>
          <button className="text-sm opacity-80 hover:opacity-100" type="submit">
            Logga ut
          </button>
        </form>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-56 shrink-0 border-r border-[var(--border)] p-4 sm:block">
          <ul className="space-y-1">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    pathname.startsWith(item.href)
                      ? "chip-primary"
                      : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-[var(--border)] bg-[var(--surface)] sm:hidden">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              pathname.startsWith(item.href) ? "text-[var(--color-primary)]" : "text-[var(--muted)]"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  );
}

function DrillIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 15c2-4 4-6 5-6s2 3 5 3M17 8l2 1-1 2" />
    </svg>
  );
}

function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 20l1-5.5A8.38 8.38 0 0 1 3.5 11 8.5 8.5 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
    </svg>
  );
}

function PeopleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
