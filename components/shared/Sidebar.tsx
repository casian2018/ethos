/**
 * Sidebar - Modern Ethos Navigation
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Dumbbell, 
  List,
  Users,
  BookOpen,
  Moon,
  BarChart,
  User, 
  Globe,
  LogOut,
  Sparkles,
  Apple,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const mainNavigation = [
  { name: "Dashboard", href: "/dev/main", icon: Home },
  { name: "Train", href: "/dev/train", icon: Dumbbell },
  { name: "Nutrition", href: "/dev/nutrition", icon: Apple },
  { name: "Find Buddy", href: "/dev/find_a_buddy", icon: Users },
  { name: "Forum", href: "/dev/forum", icon: BookOpen },
  { name: "Exercises", href: "/dev/exercises", icon: List },
  { name: "Stats", href: "/dev/stats", icon: BarChart },
  { name: "Sleep", href: "/dev/sleep-analysis", icon: Moon },
  { name: "Profile", href: "/dev/profile", icon: User },
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
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col bg-white border-r border-slate-200 lg:flex">
      <div className="flex grow flex-col overflow-y-auto">
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center px-6 border-b border-slate-100">
          <Link href="/dev/main" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4896F] to-[#e09a85] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Ethos</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-1 flex-col p-4">
          <ul role="list" className="space-y-1.5">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#D4896F]/10 text-[#D4896F]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4896F]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* Language Toggle */}
          <div className="relative z-50">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center justify-between w-full rounded-xl px-4 py-2.5 hover:bg-slate-100 transition-colors"
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

            {/* Language Dropdown */}
            {showLangMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-100 rounded-xl shadow-lg z-[100] overflow-hidden">
                <button
                  onClick={() => {
                    setLanguage("en");
                    setShowLangMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors",
                    language === "en" && "bg-[#D4896F]/10 text-[#D4896F] font-medium"
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
                    "flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors",
                    language === "ro" && "bg-[#D4896F]/10 text-[#D4896F] font-medium"
                  )}
                >
                  <span className="text-lg">🇷🇴</span>
                  <span>Română</span>
                </button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">
              {language === "en" ? "Logout" : "Deconectare"}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
