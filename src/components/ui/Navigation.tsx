"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, BarChart3, Clock, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  activeColor: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ホーム", icon: Home, activeColor: "text-primary-light" },
  { href: "/training", label: "練習", icon: Mic, activeColor: "text-pink" },
  { href: "/vocal-range", label: "音域", icon: BarChart3, activeColor: "text-cyan" },
  { href: "/history", label: "履歴", icon: Clock, activeColor: "text-accent-bright" },
  { href: "/settings", label: "設定", icon: Settings, activeColor: "text-yellow" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(({ href, label, icon: Icon, activeColor }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-semibold transition-all duration-200 ${
                isActive ? activeColor : "text-muted hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-current opacity-80" />
              )}
              <Icon
                className={`h-5 w-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
