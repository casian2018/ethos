"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Dumbbell, 
  Trophy,
  CalendarDays,
  List,
  Rss,
  Users,
  BookOpen,
  Moon as MoonIcon,
  BarChart,
  User, 
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useState } from "react";

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

export default function Sidebar() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex grow flex-col overflow-y-auto">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200">
          <Link href="/dev/main" className="text-2xl font-bold text-emerald-500">
            Ethos
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-1 flex-col p-4">
          <ul role="list" className="space-y-1">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-emerald-50 text-emerald-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - Language Only */}
        <div className="border-t border-slate-200 p-4 space-y-3">
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
      </div>
    </aside>
  );
}
