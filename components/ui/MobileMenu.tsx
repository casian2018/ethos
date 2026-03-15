"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Dumbbell, 
  BarChart, 
  User, 
  Languages,
  X,
  Trophy,
  CalendarDays,
  List,
  Rss,
  Users,
  BookOpen,
  Moon as MoonIcon,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavigation = [
  { name: "Dashboard", href: "/dev/main", icon: Home },
  { name: "Train", href: "/dev/workout", icon: Dumbbell },
  { name: "Competition", href: "/dev/competition", icon: Trophy },
  { name: "Events", href: "/dev/events", icon: CalendarDays },
  { name: "Exercises", href: "/dev/exercises", icon: List },
  { name: "Find Buddy", href: "/dev/find_a_buddy", icon: Users },
  { name: "Forum", href: "/dev/forum", icon: BookOpen },
  { name: "Stats", href: "/dev/stats", icon: BarChart },
  { name: "Sleep", href: "/dev/sleep-analysis", icon: MoonIcon },
  { name: "Profile", href: "/dev/profile", icon: User },
];

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Close menu on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <Link href="/dev/main" className="text-2xl font-bold text-emerald-500">
            Ethos
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-full overflow-y-auto">
          <div className="flex-1 p-4">
            <ul role="list" className="space-y-1">
              {mainNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer - Language Only */}
          <div className="p-4 border-t border-slate-200 space-y-3">
            {/* Language Toggle */}
            <div className="relative z-50">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center justify-between w-full rounded-lg px-3 py-2.5 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {language === "en" ? "English" : "Română"}
                  </span>
                </div>
                <svg 
                  className={cn(
                    "h-4 w-4 text-slate-500 transition-transform",
                    showLangMenu && "rotate-180"
                  )} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Language Dropdown - Solid Background */}
              {showLangMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] overflow-hidden">
                  <button
                    onClick={() => {
                      setLanguage("en");
                      setShowLangMenu(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-slate-100 transition-colors",
                      language === "en" && "bg-emerald-50 text-emerald-600 font-medium"
                    )}
                  >
                    <span className="text-lg">🇬🇧</span>
                    <span>English</span>
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("ro");
                      setShowLangMenu(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-slate-100 transition-colors",
                      language === "ro" && "bg-emerald-50 text-emerald-600 font-medium"
                    )}
                  >
                    <span className="text-lg">🇷🇴</span>
                    <span>Română</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
