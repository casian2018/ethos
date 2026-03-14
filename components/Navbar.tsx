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

  const navItems = [
    { href: "/dev/profile", label: "Profile", icon: "👤" },
    { href: "/dev/workout", label: "Workout", icon: "💪" },
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          ETHOS
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dev/profile"
                className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-sm font-medium"
              >
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400"
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

      {/* Bottom navigation for mobile */}
      <div className="md:hidden flex justify-around py-2 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-xs ${
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
