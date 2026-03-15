/**
 * MatchmakingCard - Modern session card for Find a Buddy
 */

"use client";

import { useState } from "react";
import { Star, MapPin, Clock, Users } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface Host {
  name: string;
  avatar: string;
  rating: number;
}

interface MatchmakingCardProps {
  title: string;
  host: Host;
  sport: string;
  time: string;
  date: string;
  location: string;
  currentPlayers: number;
  maxPlayers: number;
  imageUrl?: string;
  featured?: boolean;
  onJoin?: () => void;
  slotId?: string;
}

export function MatchmakingCard({
  title,
  host,
  sport,
  time,
  date,
  location,
  currentPlayers,
  maxPlayers,
  imageUrl,
  featured = false,
  onJoin,
  slotId,
}: MatchmakingCardProps) {
  const { language } = useLanguage();
  const [isJoining, setIsJoining] = useState(false);
  const spotsLeft = maxPlayers - currentPlayers;
  
  // Sport emoji mapping
  const getSportEmoji = (sportName: string) => {
    const emojis: Record<string, string> = {
      gym: "🏋️",
      running: "🏃",
      swimming: "🏊",
      football: "⚽",
      tennis: "🎾",
      basketball: "🏀",
      cycling: "🚴",
      yoga: "🧘",
      hiking: "🥾",
      boxing: "🥊",
      volleyball: "🏐",
    };
    return emojis[sportName.toLowerCase()] || "🏃";
  };

  const handleJoin = async () => {
    if (onJoin && slotId) {
      setIsJoining(true);
      try {
        await onJoin();
      } finally {
        setIsJoining(false);
      }
    }
  };

  return (
    <div className={`group relative overflow-hidden rounded-3xl transition-all duration-300 hover:shadow-2xl ${featured ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10' : 'bg-white'}`}>
      {/* Background Image */}
      {imageUrl && (
        <div className="absolute inset-0">
          <img 
            src={imageUrl} 
            alt={sport}
            className="w-full h-full object-cover opacity-10 group-hover:opacity-15 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>
      )}

      <div className="relative p-6">
        {/* Featured Badge */}
        {featured && (
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full mb-4">
            <span className="animate-pulse">🔥</span>
            {language === "ro" ? "Popular" : "Popular"}
          </div>
        )}

        {/* Sport & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl">{getSportEmoji(sport)}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-slate-500 text-sm">{sport}</p>
          </div>
        </div>

        {/* Host Info */}
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={host.avatar} 
            alt={host.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="font-medium text-slate-900">{host.name}</p>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-medium">{host.rating}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            <span>{time}</span>
            <span className="text-slate-400">•</span>
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
            <MapPin className="w-4 h-4" />
            <span className="truncate max-w-[120px]">{location}</span>
          </div>
        </div>

        {/* Players & Join */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(Math.min(currentPlayers, 4))].map((_, i) => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {currentPlayers > 4 && (
                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 text-xs font-medium">
                  +{currentPlayers - 4}
                </div>
              )}
            </div>
            <div className="text-sm">
              <span className="font-medium text-slate-900">{currentPlayers}</span>
              <span className="text-slate-500">/{maxPlayers}</span>
            </div>
          </div>

          <button
            onClick={handleJoin}
            disabled={isJoining || spotsLeft <= 0}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
              spotsLeft <= 0
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25"
            }`}
          >
            {isJoining ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            ) : spotsLeft <= 0 ? (
              language === "ro" ? "Full" : "Full"
            ) : (
              language === "ro" ? "Alătură-te" : "Join"
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-slate-100 rounded-full h-1.5">
          <div 
            className="bg-emerald-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(currentPlayers / maxPlayers) * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {spotsLeft} {language === "ro" ? "locuri rămase" : "spots left"}
        </p>
      </div>
    </div>
  );
}
