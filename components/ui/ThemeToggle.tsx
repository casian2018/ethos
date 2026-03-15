"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { language, theme, toggleTheme } = useLanguage();
  const isDark = theme === "dark";
  const nextLabel =
    language === "ro"
      ? isDark
        ? "Treci pe mod luminos"
        : "Treci pe mod întunecat"
      : isDark
        ? "Switch to light mode"
        : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl border border-[rgb(var(--border)/0.82)] bg-[rgb(var(--card)/0.84)] px-3 py-2 text-sm font-semibold text-foreground shadow-[0_12px_28px_rgba(16,33,31,0.08)] backdrop-blur hover:-translate-y-0.5 hover:bg-[rgb(var(--card)/0.96)]",
        compact && "h-10 w-10 justify-center rounded-2xl p-0",
        className
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_12px_24px_rgba(16,33,31,0.16)]",
          isDark ? "from-slate-700 via-slate-800 to-slate-950" : "from-amber-400 via-orange-500 to-rose-500",
          compact && "h-10 w-10 rounded-2xl"
        )}
      >
        {isDark ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      </span>

      {!compact && (
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {language === "ro" ? "Mood" : "Mood"}
          </span>
          <span>{isDark ? "Night mode 🌙" : "Day mode ☀️"}</span>
        </span>
      )}
    </button>
  );
}
