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
    { href: "/dev/evolution", label: "Evolution", icon: "📊" },
    { href: "/dev/forum", label: "Forum", icon: "💬" },
    { href: "/dev/competition", label: "Competitions", icon: "🏆" },
    { href: "/dev/find_a_buddy", label: "Find Buddy", icon: "🤝" },
    { href: "/dev/sleep-analysis", label: "Sleep", icon: "😴" },
  ];

  const handleSignOut = async () => {
    const { auth: firebaseAuth } = await import("@/lib/firebase");
    const auth = firebaseAuth!;
    await signOut(auth);
  };

  // Full navbar for app pages
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white bg-white border-b border-zinc-200 border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/dev/main" className="text-xl font-bold text-emerald-600 text-emerald-600">
            ETHOS
          </Link>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-1">
            {appNavItems.map((item) => {
              const isEvolutionRoute =
                item.href === "/dev/evolution" &&
                (pathname.startsWith("/dev/evolution") || pathname.startsWith("/dev/stats"));
              const isActive = isEvolutionRoute || pathname === item.href;

              return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-100 bg-emerald-100 text-emerald-700 text-emerald-700"
                    : "text-zinc-600 text-slate-600 hover:bg-zinc-100 hover:bg-slate-200"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dev/profile"
                className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold hover:ring-2 hover:ring-emerald-500 transition-all"
              >
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden md:block px-3 py-2 text-sm text-zinc-600 text-slate-600 hover:text-red-600 font-medium transition-colors"
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
      <div className="md:hidden flex justify-around py-2 bg-white bg-white border-t border-zinc-200 border-slate-200 overflow-x-auto">
        {appNavItems.map((item) => {
          const isEvolutionRoute =
            item.href === "/dev/evolution" &&
            (pathname.startsWith("/dev/evolution") || pathname.startsWith("/dev/stats"));
          const isActive = isEvolutionRoute || pathname === item.href;

          return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-xs py-1 px-2 ${
              isActive
                ? "text-emerald-600 text-emerald-600"
                : "text-zinc-500 text-slate-500"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
          </Link>
          );
        })}
      </div>
    </nav>
  );
}
