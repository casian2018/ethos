"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import MobileMenu from "./MobileMenu";
import { cn } from "@/lib/utils";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const getPageTitle = () => {
    const segment = pathname.split("/").pop();
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Dashboard";
  };

  return (
    <>
      <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-card-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-x-4">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-text-primary sm:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </div>
        <div className="flex items-center gap-x-4">
          <Link href="/dev/profile">
            <img
              className="h-8 w-8 rounded-full bg-gray-50"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt=""
            />
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/30 backdrop-blur-sm sm:hidden",
          mobileMenuOpen ? "block" : "hidden"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out sm:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-r border-card-border bg-card px-4">
            <Link href="/dev/main" className="text-2xl font-bold text-primary">
              Ethos
            </Link>
            <button
              type="button"
              className="-m-2.5 p-2.5 text-text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-card">
            <MobileMenu />
          </div>
        </div>
      </div>
    </>
  );
}
