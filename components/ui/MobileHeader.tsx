"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

function getPageMeta(pathname: string): { title: string; emoji: string } {
  if (pathname === "/dev/main") return { title: "Dashboard", emoji: "🏠" };
  if (pathname.startsWith("/dev/train")) return { title: "Train", emoji: "💪" };
  if (pathname.startsWith("/dev/nutrition")) return { title: "Nutrition", emoji: "🥗" };
  if (pathname.startsWith("/dev/find_a_buddy")) return { title: "Find Buddy", emoji: "🤝" };
  if (pathname.startsWith("/dev/forum")) return { title: "Forum", emoji: "💬" };
  if (pathname.startsWith("/dev/exercises")) return { title: "Exercises", emoji: "🏋️" };
  if (pathname.startsWith("/dev/evolution") || pathname.startsWith("/dev/stats")) {
    return { title: "Evolution", emoji: "📈" };
  }
  if (pathname.startsWith("/dev/sleep-analysis")) return { title: "Sleep", emoji: "😴" };
  if (pathname.startsWith("/dev/profile")) return { title: "Profile", emoji: "🧬" };
  if (pathname.startsWith("/dev/events")) return { title: "Events", emoji: "📅" };
  if (pathname.startsWith("/dev/competition")) return { title: "Competition", emoji: "🏆" };
  return { title: "Ethos", emoji: "✨" };
}

export function MobileHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pageMeta = getPageMeta(pathname);

  return (
    <>
      <header className="lg:hidden">
        <div className="sticky top-0 z-30 px-4 pt-4">
          <div className="ethos-panel flex items-center justify-between rounded-[28px] px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ethos</p>
                <h1 className="ethos-display text-2xl font-semibold text-slate-900">
                  <span className="mr-2">{pageMeta.emoji}</span>
                  {pageMeta.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle compact />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <Link
                href="/dev/profile"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-emerald-500 text-white"
                aria-label="Profile"
              >
                <User className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 px-1 pb-1">
            <span className="ethos-kicker border-transparent bg-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Friendly fitness OS 🌈
            </span>
          </div>
        </div>

        <div className="h-[7.3rem]" />
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
