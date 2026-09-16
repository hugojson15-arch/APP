"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/drills", label: "Övningar" },
  { href: "/drills/scouting", label: "Scouting" },
  { href: "/drills/videos", label: "Videor" },
] as const;

export default function CoachTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-lg bg-black/5 p-1 text-sm dark:bg-white/5">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 rounded-md py-1.5 text-center font-medium transition ${
              active ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
