"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Dumbbell, 
  BarChart, 
  User, 
  Settings, 
  Sun, 
  Moon, 
  Languages,
  Trophy,
  CalendarDays,
  List,
  Rss,
  Users,
  BookOpen,
  Moon as MoonIcon,
  Activity
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
  { name: "Feed", href: "/dev/feed", icon: Rss },
  { name: "Find Buddy", href: "/dev/find_a_buddy", icon: Users },
  { name: "Forum", href: "/dev/forum", icon: BookOpen },
  { name: "How To", href: "/dev/how_to", icon: BookOpen },
  { name: "Stats", href: "/dev/stats", icon: BarChart },
  { name: "Sleep", href: "/dev/sleep-analysis", icon: MoonIcon },
  { name: "Profile", href: "/dev/profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, language, setLanguage, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleLanguage = () => {
    setShowLangMenu(!showLangMenu);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-card-border bg-card transition-all duration-300 lg:flex">
      <div className="flex grow flex-col overflow-y-auto scrollbar-thin">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-card-border">
          <Link href="/dev/main" className="text-2xl font-bold text-primary">
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
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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

        {/* Footer - Theme & Language */}
        <div className="border-t border-card-border p-4 space-y-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full rounded-lg px-3 py-2.5 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {theme === "light" ? (t("darkMode") || "Dark Mode") : (t("lightMode") || "Light Mode")}
              </span>
            </div>
            <div className="w-10 h-6 bg-secondary rounded-full relative">
              <div
                className={cn(
                  "absolute top-1 w-4 h-4 bg-primary rounded-full transition-all duration-300",
                  theme === "dark" ? "left-5" : "left-1"
                )}
              />
            </div>
          </button>

          {/* Language Toggle */}
          <div className="relative">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-between w-full rounded-lg px-3 py-2.5 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {language === "en" ? "English" : "Română"}
                </span>
              </div>
            </button>

            {/* Language Dropdown */}
            {showLangMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-card-border rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    setLanguage("en");
                    setShowLangMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-secondary transition-colors",
                    language === "en" && "bg-primary/10 text-primary"
                  )}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => {
                    setLanguage("ro");
                    setShowLangMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-secondary transition-colors",
                    language === "ro" && "bg-primary/10 text-primary"
                  )}
                >
                  🇷🇴 Română
                </button>
              </div>
            )}
          </div>

          {/* Settings */}
          <Link
            href="/dev/profile/setup"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary transition-colors"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{t("settings") || "Settings"}</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
