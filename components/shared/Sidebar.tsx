"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Apple,
  BarChart,
  BookOpen,
  CalendarDays,
  Dumbbell,
  Globe,
  Home,
  List,
  LogOut,
  Moon,
  Sparkles,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const mainNavigation = [
  { name: "Dashboard", href: "/dev/main", icon: Home, emoji: "🏠" },
  { name: "Train", href: "/dev/train", icon: Dumbbell, emoji: "💪" },
  { name: "Nutrition", href: "/dev/nutrition", icon: Apple, emoji: "🥗" },
  { name: "Find Buddy", href: "/dev/find_a_buddy", icon: Users, emoji: "🤝" },
  { name: "Forum", href: "/dev/forum", icon: BookOpen, emoji: "💬" },
  { name: "Exercises", href: "/dev/exercises", icon: List, emoji: "🏋️" },
  { name: "Evolution", href: "/dev/evolution", icon: BarChart, emoji: "📈" },
  { name: "Sleep", href: "/dev/sleep-analysis", icon: Moon, emoji: "😴" },
  { name: "Profile", href: "/dev/profile", icon: User, emoji: "🧬" },
];

const extraNavigation = [
  { name: "Events", href: "/dev/events", icon: CalendarDays, emoji: "📅" },
  { name: "Competition", href: "/dev/competition", icon: Trophy, emoji: "🏆" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        router.push("/auth");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[22rem] p-5 lg:block">
      <div className="ethos-panel flex h-full flex-col overflow-hidden rounded-[36px] p-4">
        <Link
          href="/dev/main"
          className="ethos-card-lift rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-[#12211f] via-[#17332f] to-[#f0743e] px-5 py-5 text-white shadow-[0_20px_50px_rgba(17,31,30,0.18)]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/12 backdrop-blur">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Ethos</p>
              <h1 className="ethos-display text-3xl font-semibold leading-none">Train with presence ✨</h1>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/76">
            {language === "ro"
              ? "Antrenament, nutriție, recovery și comunitate într-un spațiu care nu arată ca orice alt fitness app."
              : "Training, nutrition, recovery, and community in a space that does not look like every other fitness app."}
          </p>
        </Link>

        <div className="mt-4 rounded-[28px] border border-slate-200/70 bg-white/72 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {language === "ro" ? "Spațiul tău" : "Your space"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {language === "ro" ? "Navigație rapidă între modulele esențiale și vibe control." : "Fast access to your core modules and vibe control."}
              </p>
            </div>
            <span className="ethos-chip bg-emerald-50 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {language === "ro" ? "Live" : "Live"}
            </span>
          </div>
        </div>

        <nav className="ethos-scroll mt-4 flex-1 overflow-y-auto pr-1">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {language === "ro" ? "Rutina ta" : "Your routine"}
          </p>
          <ul className="mt-3 space-y-2">
            {mainNavigation.map((item) => {
              const isEvolutionRoute =
                item.href === "/dev/evolution" &&
                (pathname.startsWith("/dev/evolution") || pathname.startsWith("/dev/stats"));
              const isActive = isEvolutionRoute || pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "ethos-sidebar-link ethos-card-lift border border-transparent",
                      isActive ? "ethos-sidebar-link-active" : "bg-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent",
                        isActive
                          ? "bg-white/70 text-slate-900 shadow-sm"
                          : "bg-slate-100/80 text-slate-600"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        <span className="mr-2">{item.emoji}</span>
                        {item.name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isActive ? "bg-gradient-to-r from-orange-500 to-emerald-500" : "bg-transparent"
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {language === "ro" ? "Explorează" : "Explore"}
          </p>
          <ul className="mt-3 space-y-2">
            {extraNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "ethos-sidebar-link ethos-card-lift border border-transparent",
                      isActive ? "ethos-sidebar-link-active" : "bg-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent",
                        isActive
                          ? "bg-white/70 text-slate-900 shadow-sm"
                          : "bg-slate-100/80 text-slate-600"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        <span className="mr-2">{item.emoji}</span>
                        {item.name}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-4 space-y-3 rounded-[28px] border border-slate-200/70 bg-white/76 p-4">
          <ThemeToggle className="w-full justify-start" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu((current) => !current)}
              className="flex w-full items-center justify-between rounded-2xl bg-slate-100/80 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <span className="flex items-center gap-3">
                <Globe className="h-4 w-4" />
                {language === "en" ? "English" : "Română"}
              </span>
              <span className={cn("transition-transform", showLangMenu && "rotate-180")}>⌄</span>
            </button>

            {showLangMenu && (
              <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("en");
                    setShowLangMenu(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm",
                    language === "en" ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>🇬🇧</span>
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("ro");
                    setShowLangMenu(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm",
                    language === "ro" ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>🇷🇴</span>
                  Română
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            {language === "en" ? "Logout" : "Deconectare"}
          </button>
        </div>
      </div>
    </aside>
  );
}
