/**
 * Train Hub - Main training page with AI and user-created workouts
 * 
 * Features:
 * - AI Workout Generator
 * - Create Your Own Workout
 * - Exercise Guides
 * - Workout History
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/contexts/LanguageContext";

type CreateMode = "ai" | "user" | null;

export default function TrainPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [createMode, setCreateMode] = useState<CreateMode>(null);

  const handleModeSelect = (mode: CreateMode) => {
    setCreateMode(mode);
    if (mode === "ai") {
      router.push("/train/workout");
    } else if (mode === "user") {
      router.push("/train/workout/create");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 text-slate-900">
          {language === "ro" ? "Antrenamente" : "Train"}
        </h1>
        <p className="text-zinc-600 text-slate-500 mt-1">
          {language === "ro" 
            ? "Generează sau creează antrenamente personalizate" 
            : "Generate or create personalized workouts"}
        </p>
      </header>

      {/* Choose Create Mode */}
      {!createMode ? (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* AI Workout Generator */}
          <button
            onClick={() => handleModeSelect("ai")}
            className="card-hover p-8 text-left group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-xl font-semibold text-zinc-900 text-slate-900 mb-2">
                {language === "ro" ? "Generator AI" : "AI Generator"}
              </h2>
              <p className="text-zinc-600 text-slate-500 mb-4">
                {language === "ro"
                  ? "Primești un antrenament personalizat bazat pe obiectivele tale"
                  : "Get a personalized workout based on your goals"}
              </p>
              <span className="inline-flex items-center gap-2 text-emerald-600 font-medium">
                {language === "ro" ? "Generează acum" : "Generate now"} →
              </span>
            </div>
          </button>

          {/* Create Your Own */}
          <button
            onClick={() => handleModeSelect("user")}
            className="card-hover p-8 text-left group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-5xl mb-4">✏️</div>
              <h2 className="text-xl font-semibold text-zinc-900 text-slate-900 mb-2">
                {language === "ro" ? "Creează Tu" : "Create Your Own"}
              </h2>
              <p className="text-zinc-600 text-slate-500 mb-4">
                {language === "ro"
                  ? "Creează propriul antrenament de la zero"
                  : "Create your own workout from scratch"}
              </p>
              <span className="inline-flex items-center gap-2 text-amber-600 font-medium">
                {language === "ro" ? "Începe crearea" : "Start creating"} →
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={() => setCreateMode(null)}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-2"
          >
            ← {language === "ro" ? "Înapoi la opțiuni" : "Back to options"}
          </button>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/train/exercises" className="card-hover p-6 text-center">
          <span className="text-3xl block mb-2">📖</span>
          <span className="font-medium text-zinc-900 text-slate-900">
            {language === "ro" ? "Ghid Exerciții" : "Exercise Guides"}
          </span>
        </Link>
        
        <Link href="/train/history" className="card-hover p-6 text-center">
          <span className="text-3xl block mb-2">📊</span>
          <span className="font-medium text-zinc-900 text-slate-900">
            {language === "ro" ? "Istoricul Antrenamentelor" : "Workout History"}
          </span>
        </Link>
      </div>

      {/* Recent Workouts Preview */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4">
          {language === "ro" ? "Antrenamente Recente" : "Recent Workouts"}
        </h3>
        <div className="card p-6 text-center text-zinc-500 text-slate-500">
          <p>{language === "ro" ? "Încă nu ai antrenamente. Începe unul acum!" : "No workouts yet. Start one now!"}</p>
        </div>
      </div>
    </div>
  );
}
