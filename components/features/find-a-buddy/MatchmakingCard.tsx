"use client";

import { Clock3, MapPin, Shield, Users } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface MatchmakingCardProps {
  title: string;
  subtitle?: string;
  hostName: string;
  hostLevel?: string;
  sportLabel: string;
  sportEmoji: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  cityLabel: string;
  currentPlayers: number;
  maxPlayers: number;
  participantNames?: string[];
  matchScore?: number | null;
  modeLabel?: string;
  genderPreferenceLabel?: string;
  priceLabel?: string;
  description?: string;
  statusLabel?: string;
  featured?: boolean;
  actionLabel: string;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onAction?: () => void;
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

function getMatchScoreStyles(score?: number | null): string {
  if (!score) {
    return "bg-slate-100 text-slate-600";
  }

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

export function MatchmakingCard({
  title,
  subtitle,
  hostName,
  hostLevel,
  sportLabel,
  sportEmoji,
  dateLabel,
  timeLabel,
  locationLabel,
  cityLabel,
  currentPlayers,
  maxPlayers,
  participantNames = [],
  matchScore,
  modeLabel,
  genderPreferenceLabel,
  priceLabel,
  description,
  statusLabel,
  featured = false,
  actionLabel,
  actionDisabled = false,
  actionLoading = false,
  onAction,
}: MatchmakingCardProps) {
  const { language } = useLanguage();
  const spotsLeft = Math.max(maxPlayers - currentPlayers, 0);
  const progress = maxPlayers > 0 ? Math.min((currentPlayers / maxPlayers) * 100, 100) : 0;

  return (
    <article
      className={`rounded-[28px] border bg-white p-6 shadow-lg transition ${
        featured
          ? "border-emerald-200 shadow-emerald-100/70"
          : "border-slate-200 shadow-slate-200/50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
            {sportEmoji}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{subtitle || sportLabel}</p>
          </div>
        </div>

        {typeof matchScore === "number" && (
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${getMatchScoreStyles(matchScore)}`}>
            {matchScore}% {language === "ro" ? "compatibilitate" : "match"}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-sm font-bold text-white">
          {getInitials(hostName)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{hostName}</p>
          <p className="truncate text-sm text-slate-500">{hostLevel || sportLabel}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {statusLabel && (
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            {statusLabel}
          </span>
        )}
        {modeLabel && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {modeLabel}
          </span>
        )}
        {genderPreferenceLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <Shield className="h-3.5 w-3.5" />
            {genderPreferenceLabel}
          </span>
        )}
        {priceLabel && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            {priceLabel}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3">
          <Clock3 className="h-4 w-4 text-emerald-600" />
          <span>
            {dateLabel} • {timeLabel}
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3">
          <MapPin className="h-4 w-4 text-sky-600" />
          <span className="truncate">
            {locationLabel}, {cityLabel}
          </span>
        </div>
      </div>

      {description && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>
      )}

      <div className="mt-5 rounded-3xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600">
            <Users className="h-4 w-4 text-emerald-600" />
            <span>
              {currentPlayers}/{maxPlayers} {language === "ro" ? "participanți" : "participants"}
            </span>
          </div>
          <span className="text-sm font-medium text-slate-700">
            {spotsLeft} {language === "ro" ? "locuri libere" : "spots left"}
          </span>
        </div>

        <div className="mt-3 h-2 rounded-full bg-white">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {participantNames.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {participantNames.slice(0, 4).map((name) => (
              <span
                key={`${name}-${currentPlayers}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {name}
              </span>
            ))}
            {participantNames.length > 4 && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                +{participantNames.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled || actionLoading || !onAction}
        className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          actionDisabled || !onAction
            ? "cursor-not-allowed bg-slate-200 text-slate-500"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {actionLoading ? (language === "ro" ? "Se procesează..." : "Working...") : actionLabel}
      </button>
    </article>
  );
}
