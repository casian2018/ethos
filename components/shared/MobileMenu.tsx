"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, BarChart, BookOpen, CalendarDays, Dumbbell, Home, Settings, Trophy, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navigation = [
  { name: "Dashboard", href: "/dev/main", icon: Home, emoji: "🏠" },
  { name: "Train", href: "/dev/train", icon: Dumbbell, emoji: "💪" },
  { name: "Nutrition", href: "/dev/nutrition", icon: Apple, emoji: "🥗" },
  { name: "Find Buddy", href: "/dev/find_a_buddy", icon: Users, emoji: "🤝" },
  { name: "Forum", href: "/dev/forum", icon: BookOpen, emoji: "💬" },
  { name: "Stats", href: "/dev/stats", icon: BarChart, emoji: "📈" },
  { name: "Events", href: "/dev/events", icon: CalendarDays, emoji: "📅" },
  { name: "Competition", href: "/dev/competition", icon: Trophy, emoji: "🏆" },
  { name: "Profile", href: "/dev/profile", icon: User, emoji: "🧬" },
];

export default function MobileMenu() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 py-4">
      <div className="flex h-16 shrink-0 items-center">
        <Link href="/dev/main" className="text-2xl font-bold text-primary">
          Ethos ✨
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-text-secondary hover:bg-background hover:text-text-primary"
                      )}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      <span>{item.emoji}</span>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="mt-auto">
            <ThemeToggle className="w-full justify-start" />
            <Link
              href="/dev/profile/setup"
              className="group -mx-2 mt-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-text-secondary hover:bg-background hover:text-text-primary"
            >
              <Settings className="h-6 w-6 shrink-0" aria-hidden="true" />
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
