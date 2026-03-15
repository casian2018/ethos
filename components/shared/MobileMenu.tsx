"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Users, BarChart, User, Settings, Sun, Moon, Languages } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dev/main", icon: Home },
  { name: "Train", href: "/train", icon: Dumbbell },
  { name: "Community", href: "/community", icon: Users },
  { name: "Progress", href: "/dev/stats", icon: BarChart },
  { name: "Profile", href: "/dev/profile", icon: User },
];

export default function MobileMenu() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 py-4">
      <div className="flex h-16 shrink-0 items-center">
        <Link href="/dev/main" className="text-2xl font-bold text-primary">
          Ethos
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-text-secondary hover:bg-background hover:text-text-primary"
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            <div className="flex items-center gap-x-4">
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="rounded-full p-2 hover:bg-background"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
              <button className="rounded-full p-2 hover:bg-background">
                <Languages className="h-5 w-5" />
              </button>
            </div>
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
