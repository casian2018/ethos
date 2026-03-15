/**
 * Train Hub - Modern Redesigned Training Page
 * 
 * Features:
 * - Modern card-based UI
 * - AI & User workout creation
 * - Quick stats
 * - Recent activity
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const auth = firebaseAuth;
const db = firebaseDb;

interface SessionData {
  workoutName?: string;
  name?: string;
  workoutType?: string;
  type?: string;
  duration?: number;
  status?: string;
  date?: string;
  createdAt?: { toDate: () => Date };
}

interface RecentWorkout {
  id: string;
  name: string;
  type: string;
  duration: number;
  status: "active" | "completed";
  date: string;
}

export default function TrainPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, thisWeek: 0, totalMinutes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        // Fetch recent workout sessions
        try {
          if (db) {
            // Query from workout_sessions (not workouts) to get actual sessions
            const sessionsRef = collection(db, "workout_sessions");
            const q = query(
              sessionsRef, 
              where("userId", "==", user.uid),
              // Get both active and completed sessions
              limit(5)
            );
            const snapshot = await getDocs(q);
            const workouts = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.workoutName || data.name || "Workout",
                type: data.workoutType || data.type || "strength",
                duration: data.duration || 30,
                status: data.status || "active",
                date: data.date || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              } as RecentWorkout;
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecentWorkouts(workouts);
            
            // Calculate stats from workout_sessions
            const allSessionsQuery = query(sessionsRef, where("userId", "==", user.uid));
            const allSnap = await getDocs(allSessionsQuery);
            const allWorkouts: SessionData[] = allSnap.docs.map(doc => doc.data() as SessionData);
            
            const total = allWorkouts.length;
            const completed = allWorkouts.filter((w) => w.status === "completed").length;
            
            // This week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const thisWeek = allWorkouts.filter((w) => {
              const date = w.date || w.createdAt?.toDate?.();
              return date && new Date(date) > oneWeekAgo;
            }).length;
            
            setStats({ totalWorkouts: completed, thisWeek, totalMinutes: total * 45 });
          }
        } catch (err) {
          console.error("Error fetching workouts:", err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getTypeEmoji = (type: string) => {
    const types: Record<string, string> = {
      strength: "💪",
      cardio: "🏃",
      hiit: "⚡",
      yoga: "🧘",
      stretching: "🤸"
    };
    return types[type] || "🏋️";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="ethos-panel mb-8 rounded-[32px] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
          {language === "ro" ? "Vibe de antrenament" : "Training vibe"}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          💪 {language === "ro" ? "Antrenamente" : "Train"}
        </h1>
        <p className="text-slate-500 mt-2">
          {language === "ro" 
            ? "Transformă-ți corpul cu antrenamente inteligente, energie bună și flow clar." 
            : "Transform your body with smart workouts, good energy, and a clearer flow."}
        </p>
      </header>

      {/* Stats Cards */}
      {!loading && stats.totalWorkouts > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
            <div className="text-3xl font-bold">{stats.totalWorkouts}</div>
            <div className="text-emerald-100 text-sm">
              {language === "ro" ? "Total antrenamente" : "Total workouts"}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
            <div className="text-3xl font-bold">{stats.thisWeek}</div>
            <div className="text-blue-100 text-sm">
              {language === "ro" ? "Această săptămână" : "This week"}
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
            <div className="text-3xl font-bold">{Math.round(stats.totalMinutes / 60)}h</div>
            <div className="text-amber-100 text-sm">
              {language === "ro" ? "Minute totale" : "Total minutes"}
            </div>
          </div>
        </div>
      )}

      {/* Main Action Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* AI Generator Card */}
        <Link
          href="/dev/train/workout"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-600/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-3xl mb-4">
              ✨
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {language === "ro" ? "Generator AI" : "AI Generator"}
            </h2>
            <p className="text-slate-300 mb-6">
              {language === "ro"
                ? "Antrenamente personalizate bazate pe obiectivele tale"
                : "Personalized workouts based on your goals"}
            </p>
            <div className="inline-flex items-center gap-2 bg-emerald-500 px-4 py-2 rounded-full font-medium text-sm">
              {language === "ro" ? "Generează acum" : "Generate now"} 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </Link>

        {/* Create Your Own Card */}
        <Link
          href="/dev/train/workout/create"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50 p-8 border border-slate-200 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-3xl mb-4">
              ✏️
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {language === "ro" ? "Creează Tu" : "Create Your Own"}
            </h2>
            <p className="text-slate-500 mb-6">
              {language === "ro"
                ? "Design antrenamentul perfect pentru tine"
                : "Design the perfect workout for you"}
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full font-medium text-sm text-white">
              {language === "ro" ? "Începe crearea" : "Start creating"} 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link 
          href="/dev/exercises" 
          className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
            📖
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {language === "ro" ? "Ghid Exerciții" : "Exercise Guides"}
            </h3>
            <p className="text-sm text-slate-500">
              {language === "ro" ? "Biblioteca de exerciții" : "Exercise library"}
            </p>
          </div>
        </Link>
        
        <Link 
          href="/dev/train/history" 
          className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
            📊
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {language === "ro" ? "Istoricul" : "History"}
            </h3>
            <p className="text-sm text-slate-500">
              {language === "ro" ? "Vezi progresul" : "View progress"}
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {language === "ro" ? "Antrenamente Recente" : "Recent Workouts"}
          </h3>
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <Link 
                key={workout.id}
                href={`/dev/train/session/${workout.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-[#D4896F] hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                  {getTypeEmoji(workout.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{workout.name}</h4>
                  <p className="text-sm text-slate-500">
                    {workout.duration} min • {workout.type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workout.status === "completed" 
                      ? "bg-emerald-100 text-emerald-600" 
                      : "bg-blue-100 text-blue-600"
                  }`}>
                    {workout.status === "completed" 
                      ? (language === "ro" ? "Terminat" : "Done") 
                      : (language === "ro" ? "Activ" : "Active")}
                  </span>
                  <div className="text-slate-400">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {loading === false && recentWorkouts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            🏋️
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {language === "ro" ? "Începe primul antrenament!" : "Start your first workout!"}
          </h3>
          <p className="text-slate-500">
            {language === "ro" 
              ? "Alege o opțiune de mai sus pentru a începe" 
              : "Choose an option above to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
