/**
 * Find a Buddy - Advanced Matchmaking System
 * 
 * Features:
 * - Add Availability Form (Sport, City, Time, Location, Gender)
 * - Coach Mark Tooltip explaining how it works
 * - Feed navigation
 * 
 * Route: /dev/find_a_buddy
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import AddAvailabilityForm from "@/components/features/find-a-buddy/AddAvailabilityForm";

const auth = firebaseAuth!;
const db = firebaseDb!;

export default function FindBuddyPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCoachMark, setShowCoachMark] = useState(true);

  // Hide coach mark after first interaction
  useEffect(() => {
    const hasSeenCoachMark = localStorage.getItem("ethos_coachmark_fab");
    if (hasSeenCoachMark) {
      setShowCoachMark(false);
    }
  }, []);

  const handleCloseCoachMark = () => {
    setShowCoachMark(false);
    localStorage.setItem("ethos_coachmark_fab", "true");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const handleFormSuccess = () => {
    setShowForm(false);
    router.push("/dev/find_a_buddy/feed");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {language === "ro" ? "Găsește un Partener" : "Find a Buddy"}
          </h1>
          <p className="text-slate-500 mt-2">
            {language === "ro" 
              ? "Antrenează-te cu persoane care au același program ca tine"
              : "Train with people who have the same schedule as you"}
          </p>
        </div>

        {/* Coach Mark Tooltip */}
        {showCoachMark && (
          <div className="relative mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-6 text-white shadow-lg animate-pulse">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎯</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">
                    {language === "ro" ? "Cum funcționează?" : "How it works?"}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {language === "ro" 
                      ? "Postează ora la care ești liber și noi îți găsim partenerul perfect de antrenament!"
                      : "Post the time you're available and we'll find you the perfect workout partner!"}
                  </p>
                </div>
                <button 
                  onClick={handleCloseCoachMark}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Animated arrow */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-blue-500 rotate-45"></div>
              </div>
            </div>
          </div>
        )}

        {/* Main Action Button */}
        {!showForm ? (
          <div className="text-center">
            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-emerald-200 flex items-center gap-3 mx-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {language === "ro" ? "Adaugă Disponibilitate" : "Add Availability"}
            </button>
            
            <p className="text-slate-500 text-sm mt-3">
              {language === "ro" 
                ? "Alege sportul, orașul, ora și locația"
                : "Choose sport, city, time and location"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {language === "ro" ? "Crează un slot de disponibilitate" : "Create availability slot"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <AddAvailabilityForm 
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Browse Feed Button */}
        <div className="mt-8 text-center">
          <Link
            href="/dev/find_a_buddy/feed"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {language === "ro" ? "Vezi disponibilitățile altora" : "Browse others' availability"}
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
            <div className="text-2xl font-bold text-emerald-500">🏃</div>
            <div className="text-sm text-slate-600 mt-1">
              {language === "ro" ? "Sport" : "Sports"}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
            <div className="text-2xl font-bold text-blue-500">🏙️</div>
            <div className="text-sm text-slate-600 mt-1">
              {language === "ro" ? "10+ Orașe" : "10+ Cities"}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
            <div className="text-2xl font-bold text-purple-500">🤝</div>
            <div className="text-sm text-slate-600 mt-1">
              {language === "ro" ? "Match" : "Match"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
