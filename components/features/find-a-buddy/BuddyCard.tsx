/**
 * BuddyCard - Card showing potential workout partners
 */

"use client";

import { Star, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface BuddyCardProps {
  name: string;
  avatar: string;
  sports: string[];
  level: string;
  rating: number;
  matchScore: number;
  available: boolean;
  onMessage?: () => void;
}

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
    pilates: "🧘‍♀️",
  };
  return emojis[sportName.toLowerCase()] || "🏃";
};

export function BuddyCard({
  name,
  avatar,
  sports,
  level,
  rating,
  matchScore,
  available,
  onMessage,
}: BuddyCardProps) {
  const { language } = useLanguage();

  // Determine match score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-amber-500";
    return "bg-slate-400";
  };

  return (
    <div className="group bg-white rounded-3xl p-5 border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
      {/* Match Score Badge */}
      <div className="flex justify-end mb-2">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-bold ${getScoreColor(matchScore)}`}>
          <span>{matchScore}%</span>
          <span className="text-[10px] opacity-80">{language === "ro" ? "match" : "match"}</span>
        </div>
      </div>

      {/* Avatar */}
      <div className="relative mb-4">
        <img 
          src={avatar} 
          alt={name}
          className="w-20 h-20 rounded-2xl object-cover mx-auto"
        />
        {/* Available Indicator */}
        {available && (
          <div className="absolute bottom-0 right-1/2 translate-x-6 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Name & Level */}
      <div className="text-center mb-3">
        <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
        <p className="text-slate-500 text-sm">{level}</p>
      </div>

      {/* Rating */}
      <div className="flex items-center justify-center gap-1 mb-3">
        <Star className="w-4 h-4 text-amber-500 fill-current" />
        <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
        <span className="text-slate-400 text-sm">({language === "ro" ? "recenzii" : "reviews"})</span>
      </div>

      {/* Sports */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {sports.slice(0, 3).map((sport, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
          >
            {getSportEmoji(sport)} {sport}
          </span>
        ))}
      </div>

      {/* Availability Status */}
      <div className="text-center mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
          available 
            ? "bg-emerald-100 text-emerald-700" 
            : "bg-slate-100 text-slate-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${available ? "bg-emerald-500" : "bg-slate-400"}`} />
          {available 
            ? (language === "ro" ? "Disponibil" : "Available")
            : (language === "ro" ? "Indisponibil" : "Unavailable")
          }
        </span>
      </div>

      {/* Message Button */}
      <button
        onClick={onMessage}
        disabled={!available}
        className={`w-full py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          available
            ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
      >
        <MessageCircle className="w-4 h-4" />
        {language === "ro" ? "Mesaj" : "Message"}
      </button>
    </div>
  );
}
