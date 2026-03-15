"use client";

import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface BuddyCardProps {
  name: string;
  sports: string[];
  level: string;
  city: string;
  matchScore: number;
  availableSlots: number;
  nextAvailableLabel?: string;
  goalTags?: string[];
  onView?: () => void;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "ET";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function getScoreStyles(score: number): string {
  if (score >= 90) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (score >= 80) {
    return "bg-sky-100 text-sky-700";
  }
  if (score >= 70) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-slate-100 text-slate-600";
}

export function BuddyCard({
  name,
  sports,
  level,
  city,
  matchScore,
  availableSlots,
  nextAvailableLabel,
  goalTags = [],
  onView,
}: BuddyCardProps) {
  const { language } = useLanguage();

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-sm font-bold text-white">
            {getInitials(name)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{name}</h3>
            <p className="text-sm text-slate-500">{level}</p>
          </div>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${getScoreStyles(matchScore)}`}>
          {matchScore}% {language === "ro" ? "match" : "match"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {sports.slice(0, 3).map((sport) => (
          <span
            key={sport}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
          >
            {sport}
          </span>
        ))}
      </div>

      {goalTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {goalTags.slice(0, 2).map((goal) => (
            <span
              key={goal}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
            >
              {goal}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4 text-sky-600" />
          <span>{city}</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-emerald-600" />
          <span>
            {availableSlots} {language === "ro" ? "sloturi disponibile" : "slots available"}
            {nextAvailableLabel ? ` • ${nextAvailableLabel}` : ""}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        {language === "ro" ? "Vezi sloturile" : "View slots"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  );
}
