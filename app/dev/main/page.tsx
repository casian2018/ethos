/**
 * Dashboard - Ethos Main Hub
 * 
 * Features:
 * - Bento Box Grid Layout
 * - 3 Main Widgets: Next Workout, Quick Stats, Community
 * - FAB Quick Action Menu
 * - Theme-synced charts
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

// Types
interface UserProfile {
  city?: string;
  age?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  fitnessLevel?: string;
  goals?: string[];
  medicalConditions?: string[];
  preferredSports?: string[];
}

interface AvailabilitySlot {
  id: string;
  hostId: string;
  hostName: string;
  sportType: string;
  city: string;
  dateTime: Timestamp;
  duration: number;
  location: {
    name: string;
    isPaid: boolean;
  };
  status: string;
  buddyId: string | null;
}

interface ForumPost {
  id: string;
  title: string;
  category: string;
  sport: string;
  authorName: string;
  createdAt: Timestamp;
}

interface HealthStat {
  id: string;
  date: string;
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
}

interface SleepRecord {
  id: string;
  date: string;
  sleepHours: number;
  sleepQuality: string;
  bedtime: string;
  wakeTime: string;
  chronotype: string;
}

// Sport emoji map
const sportEmojis: Record<string, string> = {
  gym: "🏋️",
  running: "🏃",
  swimming: "🏊",
  football: "⚽",
  tennis: "🎾",
  yoga: "🧘",
  cycling: "🚴",
  basketball: "🏀",
  hiking: "🥾",
  boxing: "🥊",
};

// Helper function to format workout date
const formatWorkoutDate = (dateTime: Timestamp | null, lang: string) => {
  if (!dateTime) return "";
  try {
    const date = dateTime.toDate();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'en-US', options);
  } catch {
    return "";
  }
};

export default function MainPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Widget Data
  const [nextWorkout, setNextWorkout] = useState<AvailabilitySlot | null>(null);
  const [recentPosts, setRecentPosts] = useState<ForumPost[]>([]);
  const [todayStats, setTodayStats] = useState<{ steps: number; sleep: number }>({ steps: 0, sleep: 0 });
  
  // FAB Menu State
  const [fabOpen, setFabOpen] = useState(false);

  // Fetch next workout
  const fetchNextWorkout = async (uid: string) => {
    try {
      const slotsQuery = query(
        collection(db, "availability_slots"),
        where("buddyId", "==", uid),
        where("status", "==", "matched"),
        orderBy("dateTime", "asc"),
        limit(1)
      );
      
      const slotsSnapshot = await getDocs(slotsQuery);
      if (!slotsSnapshot.empty) {
        const slotData = slotsSnapshot.docs[0].data() as AvailabilitySlot;
        setNextWorkout({ ...slotData, id: slotsSnapshot.docs[0].id });
      }
    } catch (err) {
      console.error("Error fetching next workout:", err);
    }
  };

  // Fetch recent posts
  const fetchRecentPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, "forum_posts"),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumPost[];
      setRecentPosts(posts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  // Fetch today's stats
  const fetchTodayStats = async (uid: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const healthQuery = query(
        collection(db, "users", uid, "health_stats"),
        where("date", "==", today),
        limit(1)
      );
      const healthSnapshot = await getDocs(healthQuery);
      
      const sleepQuery = query(
        collection(db, "users", uid, "sleep_records"),
        where("date", "==", today),
        limit(1)
      );
      const sleepSnapshot = await getDocs(sleepQuery);
      
      let steps = 0;
      let sleep = 0;
      
      if (!healthSnapshot.empty) {
        const stat = healthSnapshot.docs[0].data() as HealthStat;
        steps = stat.steps || 0;
      }
      
      if (!sleepSnapshot.empty) {
        const sleepData = sleepSnapshot.docs[0].data() as SleepRecord;
        sleep = sleepData.sleepHours || 0;
      }
      
      setTodayStats({ steps, sleep });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUserId(currentUser.uid);

      try {
        // Fetch user profile
        const profileDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        }

        // Fetch next confirmed workout (where user is buddy)
        await fetchNextWorkout(currentUser.uid);

        // Fetch recent forum posts
        await fetchRecentPosts();

        // Fetch today's stats
        await fetchTodayStats(currentUser.uid);

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900">
            {language === "ro" ? "Bine ai venit" : "Welcome back"} 👋
          </h1>
          <p className="text-slate-500 text-sm">
            {language === "ro" ? "Iată ce ai pentru azi" : "Here's your day at a glance"}
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]">
          
          {/* Widget 1: Next Workout (Takes 2 columns on md+) */}
          <div className="md:col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>🏋️</span>
                {language === "ro" ? "Următorul Antrenament" : "Next Workout"}
              </h2>
              <Link href="/dev/find_a_buddy/feed" className="text-white/80 text-sm hover:text-white">
                {language === "ro" ? "Vezi toate" : "See all"} →
              </Link>
            </div>
            
            {nextWorkout ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{sportEmojis[nextWorkout.sportType] || "🏋️"}</span>
                  <div>
                    <p className="text-2xl font-bold capitalize">{nextWorkout.sportType}</p>
                    <p className="text-emerald-100">{nextWorkout.location.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    📅 {formatWorkoutDate(nextWorkout.dateTime, language)}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    ⏱️ {nextWorkout.duration} min
                  </span>
                </div>
                <p className="text-sm text-emerald-100">
                  🎯 {language === "ro" ? "Antrenor" : "Host"}: {nextWorkout.hostName}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <p className="text-emerald-100 mb-4 text-center">
                  {language === "ro" 
                    ? "Nu ai niciun antrenament programat"
                    : "No workouts scheduled"}
                </p>
                <Link 
                  href="/dev/find_a_buddy" 
                  className="bg-white text-emerald-600 px-6 py-2.5 rounded-full font-medium hover:bg-emerald-50 transition-colors"
                >
                  {language === "ro" ? "Găsește un partener" : "Find a partner"}
                </Link>
              </div>
            )}
          </div>

          {/* Widget 2: Quick Stats */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span>📊</span>
              {language === "ro" ? "Statistici" : "Quick Stats"}
            </h2>
            
            {/* Steps Chart (Simple CSS Bar) */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">👟 {language === "ro" ? "Pași" : "Steps"}</span>
                <span className="font-semibold text-slate-900">{todayStats.steps.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayStats.steps / 10000) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Goal: 10,000</p>
            </div>
            
            {/* Sleep Chart (Simple CSS Bar) */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">😴 {language === "ro" ? "Somn" : "Sleep"}</span>
                <span className="font-semibold text-slate-900">{todayStats.sleep}h</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayStats.sleep / 8) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Goal: 8h</p>
            </div>
            
            {/* Mini Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <Link href="/dev/stats" className="text-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <p className="text-xs text-slate-500">{language === "ro" ? "Vezi toate" : "See all"}</p>
                <p className="text-emerald-600 font-medium">→</p>
              </Link>
              <Link href="/dev/sleep-analysis" className="text-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <p className="text-xs text-slate-500">{language === "ro" ? "Analiză somn" : "Sleep analysis"}</p>
                <p className="text-purple-600 font-medium">→</p>
              </Link>
            </div>
          </div>

          {/* Widget 3: Community (Takes 2 columns) */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span>💬</span>
                {language === "ro" ? "Comunitate" : "Community"}
              </h2>
              <Link href="/dev/forum" className="text-emerald-600 text-sm hover:text-emerald-700">
                {language === "ro" ? "Vezi toate" : "See all"} →
              </Link>
            </div>
            
            {recentPosts.length > 0 ? (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <Link 
                    key={post.id} 
                    href={`/dev/forum/${post.id}`}
                    className="block p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{sportEmojis[post.sport] || "💬"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{post.title}</p>
                        <p className="text-sm text-slate-500">
                          {post.category} • {post.authorName}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">
                  {language === "ro" 
                    ? "Nicio postare recentă"
                    : "No recent posts"}
                </p>
                <Link 
                  href="/dev/forum" 
                  className="text-emerald-600 font-medium hover:text-emerald-700"
                >
                  {language === "ro" ? "Vezi forumul" : "Check the forum"}
                </Link>
              </div>
            )}
          </div>

          {/* Widget 4: Quick Actions Preview */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚡</span>
              {language === "ro" ? "Acțiuni Rapide" : "Quick Actions"}
            </h2>
            
            <div className="space-y-3">
              <Link 
                href="/dev/workout" 
                className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-medium">{language === "ro" ? "Generează Workout" : "Generate Workout"}</p>
                  <p className="text-xs text-slate-300">AI-powered</p>
                </div>
              </Link>
              
              <Link 
                href="/dev/find_a_buddy" 
                className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-2xl">🤝</span>
                <div>
                  <p className="font-medium">{language === "ro" ? "Postează Disponibilitate" : "Post Availability"}</p>
                  <p className="text-xs text-slate-300">{language === "ro" ? "Găsește parteneri" : "Find partners"}</p>
                </div>
              </Link>
              
              <Link 
                href="/dev/sleep-analysis" 
                className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-2xl">🌙</span>
                <div>
                  <p className="font-medium">{language === "ro" ? "Log Somn" : "Log Sleep"}</p>
                  <p className="text-xs text-slate-300">{language === "ro" ? "Track recovery" : "Track recovery"}</p>
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* Medical Warning (if applicable) */}
        {profile?.medicalConditions && profile.medicalConditions.length > 0 && !profile.medicalConditions.includes("none") && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-amber-900">
                  {language === "ro" ? "Atenționare Medicală" : "Medical Warning"}
                </p>
                <p className="text-sm text-amber-700">
                  {language === "ro" 
                    ? `Antrenamentele tale sunt adaptate pentru: ${profile.medicalConditions.join(", ")}`
                    : `Your workouts are adapted for: ${profile.medicalConditions.join(", ")}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB Quick Action Menu */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* FAB Menu Options */}
        {fabOpen && (
          <div className="absolute bottom-16 right-0 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Link
              href="/dev/find_a_buddy"
              className="flex items-center gap-3 bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-xl shadow-lg hover:bg-slate-50 transition-colors"
              onClick={() => setFabOpen(false)}
            >
              <span className="text-xl">🤝</span>
              <span className="font-medium text-sm whitespace-nowrap">
                {language === "ro" ? "Postează Disponibilitate" : "Post Availability"}
              </span>
            </Link>
            
            <Link
              href="/dev/workout"
              className="flex items-center gap-3 bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-xl shadow-lg hover:bg-slate-50 transition-colors"
              onClick={() => setFabOpen(false)}
            >
              <span className="text-xl">✨</span>
              <span className="font-medium text-sm whitespace-nowrap">
                {language === "ro" ? "Generează Workout" : "Generate Workout"}
              </span>
            </Link>
            
            <Link
              href="/dev/sleep-analysis"
              className="flex items-center gap-3 bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-xl shadow-lg hover:bg-slate-50 transition-colors"
              onClick={() => setFabOpen(false)}
            >
              <span className="text-xl">🌙</span>
              <span className="font-medium text-sm whitespace-nowrap">
                {language === "ro" ? "Log Somn" : "Log Sleep"}
              </span>
            </Link>
          </div>
        )}
        
        {/* FAB Button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          {fabOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
