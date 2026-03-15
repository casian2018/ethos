"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, User } from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";

// Page title mapping based on pathname
const getPageTitle = (pathname: string): string => {
  if (pathname === "/" || pathname === "/dev/main") return "Dashboard";
  if (pathname.startsWith("/train")) return "Train";
  if (pathname.startsWith("/community")) return "Community";
  if (pathname.startsWith("/progress")) return "Progress";
  if (pathname.startsWith("/profile")) return "Profile";
  return "Ethos";
};

export function MobileHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-card/95 backdrop-blur-sm border-b border-card-border">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left - Hamburger & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <Link
              href="/dev/profile"
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="lg:hidden h-14" />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
