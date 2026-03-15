"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "firebase/auth";
import { signOut } from "firebase/auth";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const isDevPage = pathname.startsWith("/dev") || pathname.startsWith("/train") || pathname.startsWith("/community") || pathname.startsWith("/progress") || pathname.startsWith("/profile");

  // Only show navbar on dev pages
  if (!isDevPage) {
    return null;
  }

  const appNavItems = [
    { href: "/dev/main", label: "Dashboard", icon: "🏠" },
    { href: "/dev/profile", label: "Profile", icon: "👤" },
    { href: "/dev/exercises", label: "Exercises", icon: "🏋️" },
    { href: "/train/workout", label: "Workout", icon: "💪" },
    { href: "/dev/stats", label: "Stats", icon: "📊" },
    { href: "/dev/forum", label: "Forum", icon: "💬" },
    { href: "/dev/competition", label: "Competitions", icon: "🏆" },
    { href: "/dev/find_a_buddy", label: "Find Buddy", icon: "🤝" },
    { href: "/dev/how_to", label: "How To", icon: "📖" },
    { href: "/dev/sleep-analysis", label: "Sleep", icon: "😴" },
  ];

  const handleSignOut = async () => {
    const { auth: firebaseAuth } = await import("@/lib/firebase");
    const auth = firebaseAuth!;
    await signOut(auth);
  };

  // Full navbar for app pages
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/dev/main" className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            ETHOS
          </Link>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-1">
            {appNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dev/profile"
                className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:ring-2 hover:ring-emerald-500 transition-all"
              >
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden md:block px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile bottom navigation - all 9 items */}
      <div className="md:hidden flex justify-around py-2 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 overflow-x-auto">
        {appNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-xs py-1 px-2 ${
              pathname === item.href
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
