"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Apple,
  BarChart,
  BookOpen,
  Dumbbell,
  Globe,
  Home,
  List,
  MoonIcon,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavigation = [
  { name: "Dashboard", href: "/dev/main", icon: Home },
  { name: "Train", href: "/dev/train", icon: Dumbbell },
  { name: "Nutrition", href: "/dev/nutrition", icon: Apple },
  { name: "Find Buddy", href: "/dev/find_a_buddy", icon: Users },
  { name: "Forum", href: "/dev/forum", icon: BookOpen },
  { name: "Exercises", href: "/dev/exercises", icon: List },
  { name: "Stats", href: "/dev/stats", icon: BarChart },
  { name: "Sleep", href: "/dev/sleep-analysis", icon: MoonIcon },
  { name: "Profile", href: "/dev/profile", icon: User },
];

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/38 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm p-4 transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="ethos-panel flex h-full flex-col overflow-hidden rounded-[34px]">
          <div className="border-b border-slate-200/80 p-4">
            <div className="flex items-start justify-between gap-3 rounded-[26px] bg-gradient-to-br from-[#12211f] via-[#17332f] to-[#f0743e] p-4 text-white">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Ethos</p>
                <h2 className="ethos-display mt-2 text-3xl font-semibold">Move with intention</h2>
                <p className="mt-2 text-sm leading-6 text-white/76">
                  {language === "ro"
                    ? "Navigație rapidă între training, nutriție, buddy și recovery."
                    : "Quick access across training, nutrition, buddy, and recovery."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="ethos-scroll flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {mainNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "ethos-sidebar-link",
                        isActive ? "ethos-sidebar-link-active" : "bg-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-2xl",
                          isActive ? "bg-white/70 text-slate-900" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-semibold">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-slate-200/80 p-4">
            <div className="rounded-[24px] bg-slate-100/80 p-3">
              <button
                type="button"
                onClick={() => setShowLangMenu((current) => !current)}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium text-slate-700"
              >
                <span className="flex items-center gap-3">
                  <Globe className="h-4 w-4" />
                  {language === "en" ? "English" : "Română"}
                </span>
                <span className={cn("transition-transform", showLangMenu && "rotate-180")}>⌄</span>
              </button>

              {showLangMenu && (
                <div className="mt-2 space-y-1 rounded-2xl bg-white p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("en");
                      setShowLangMenu(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm",
                      language === "en" ? "bg-emerald-50 font-semibold text-emerald-700" : "hover:bg-slate-50"
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
                      language === "ro" ? "bg-emerald-50 font-semibold text-emerald-700" : "hover:bg-slate-50"
                    )}
                  >
                    <span>🇷🇴</span>
                    Română
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5" />
              Ethos mobile shell
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
