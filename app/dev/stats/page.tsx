"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  limit, 
  getDocs,
  doc,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { 
  getAdaptiveTargets, 
  isTargetMet, 
  calculateStreak, 
  checkAchievements,
  calculateProgress,
  formatNumber,
  Achievement 
} from "@/lib/healthUtils";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface HealthStat {
  id: string;
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
  date: string;
  createdAt: Timestamp;
}

interface UserProfile {
  id: string;
  medicalConditions: string[];
  city?: string;
  fitnessLevel?: string;
}

export default function StatsDashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [healthStats, setHealthStats] = useState<HealthStat[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<{ steps: number; calories: number; activeMinutes: number }>({
    steps: 0,
    calories: 0,
    activeMinutes: 0
  });
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [targets, setTargets] = useState({ steps: 10000, calories: 500, activeMinutes: 30 });
  const [_userId, setUserId] = useState<string>("");

  async function loadStats(uid: string) {
    // Load user profile for medical conditions
    try {
      const profileDoc = await getDoc(doc(db, "users", uid));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as UserProfile;
        setUserProfile(profileData);
        
        // Get adaptive targets based on medical conditions
        const medicalConditions = profileData.medicalConditions || [];
        const adaptiveTargets = getAdaptiveTargets(medicalConditions);
        setTargets(adaptiveTargets);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }

    // Load health stats
    const statsQuery = query(
      collection(db, "users", uid, "health_stats"),
      limit(30)
    );
    
    const snapshot = await getDocs(statsQuery);
    const stats: HealthStat[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      stats.push({
        id: doc.id,
        steps: data.steps || 0,
        calories: data.calories || 0,
        distance: data.distance || 0,
        activeMinutes: data.activeMinutes || 0,
        date: data.date || "",
        createdAt: data.createdAt,
      });
    });
    setHealthStats(stats);

    // Calculate weekly stats (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let weeklySteps = 0;
    let weeklyCalories = 0;
    let weeklyActiveMinutes = 0;
    
    stats.forEach((stat) => {
      const statDate = new Date(stat.date);
      if (statDate >= weekAgo) {
        weeklySteps += stat.steps;
        weeklyCalories += stat.calories;
        weeklyActiveMinutes += stat.activeMinutes;
      }
    });

    // Calculate streak
    const currentStreak = calculateStreak(stats.map(s => ({ date: s.date, steps: s.steps, activeMinutes: s.activeMinutes })));
    
    // Check achievements
    const unlockedAchievements = checkAchievements(stats.map(s => ({ steps: s.steps, calories: s.calories, activeMinutes: s.activeMinutes, date: s.date })));

    setWeeklyStats({
      steps: weeklySteps,
      calories: weeklyCalories,
      activeMinutes: weeklyActiveMinutes
    });
    setStreak(currentStreak);
    setAchievements(unlockedAchievements);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.uid);
      await loadStats(user.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Get today's stats
  const todayStats = healthStats.find(stat => stat.date === new Date().toISOString().split("T")[0]);

  // Get weekly data for chart (last 7 days)
  const weeklyChartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    const dayStat = healthStats.find(stat => stat.date === dateStr);
    return {
      day: date.toLocaleDateString(language === "ro" ? "ro-RO" : "en-US", { weekday: "short" }),
      steps: dayStat?.steps || 0,
      calories: dayStat?.calories || 0,
      activeMinutes: dayStat?.activeMinutes || 0
    };
  });

  const maxSteps = Math.max(...weeklyChartData.map(d => d.steps), 1);

  // Color helper based on target
  const getStepColor = (steps: number) => isTargetMet(steps, targets.steps) ? "text-emerald-600" : "text-red-500";
  const getCalorieColor = (calories: number) => isTargetMet(calories, targets.calories) ? "text-emerald-600" : "text-red-500";
  const getActiveColor = (minutes: number) => isTargetMet(minutes, targets.activeMinutes) ? "text-emerald-600" : "text-red-500";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {language === "ro" ? "Dashboard Activitate" : "Activity Dashboard"}
          </h1>
          <p className="text-slate-500 mt-1">
            {language === "ro" ? "Urmărește-ți progresul fitness" : "Track your fitness progress"}
          </p>
          
          {/* Adaptive Target Notice */}
          {userProfile?.medicalConditions && userProfile.medicalConditions.length > 0 && !userProfile.medicalConditions.includes("none") && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm text-amber-800">
                ⚠️ {language === "ro" 
                  ? `Target-uri adaptate pentru condițiile tale medicale. Pași zilnic: ${targets.steps.toLocaleString()}`
                  : `Adaptive targets for your medical conditions. Daily steps: ${targets.steps.toLocaleString()}`}
              </p>
            </div>
          )}
        </div>

        {/* Today's Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Steps Card */}
          <div className={`card p-4 bg-white border-l-4 ${isTargetMet(todayStats?.steps || 0, targets.steps) ? "border-emerald-500" : "border-red-500"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTargetMet(todayStats?.steps || 0, targets.steps) ? "bg-emerald-100" : "bg-red-100"}`}>
                <span className="text-xl">👟</span>
              </div>
              <span className="text-sm text-slate-500">{language === "ro" ? "Pași" : "Steps"}</span>
            </div>
            <p className={`text-2xl font-bold ${getStepColor(todayStats?.steps || 0)}`}>
              {formatNumber(todayStats?.steps || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === "ro" ? "Target:" : "Target:"} {targets.steps.toLocaleString()}
            </p>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${isTargetMet(todayStats?.steps || 0, targets.steps) ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${calculateProgress(todayStats?.steps || 0, targets.steps)}%` }}
              />
            </div>
          </div>

          {/* Calories Card */}
          <div className={`card p-4 bg-white border-l-4 ${isTargetMet(todayStats?.calories || 0, targets.calories) ? "border-emerald-500" : "border-red-500"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTargetMet(todayStats?.calories || 0, targets.calories) ? "bg-emerald-100" : "bg-red-100"}`}>
                <span className="text-xl">🔥</span>
              </div>
              <span className="text-sm text-slate-500">{language === "ro" ? "Calorii" : "Calories"}</span>
            </div>
            <p className={`text-2xl font-bold ${getCalorieColor(todayStats?.calories || 0)}`}>
              {todayStats?.calories || 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === "ro" ? "Target:" : "Target:"} {targets.calories} kcal
            </p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${isTargetMet(todayStats?.calories || 0, targets.calories) ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${calculateProgress(todayStats?.calories || 0, targets.calories)}%` }}
              />
            </div>
          </div>

          {/* Active Minutes Card */}
          <div className={`card p-4 bg-white border-l-4 ${isTargetMet(todayStats?.activeMinutes || 0, targets.activeMinutes) ? "border-emerald-500" : "border-red-500"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTargetMet(todayStats?.activeMinutes || 0, targets.activeMinutes) ? "bg-emerald-100" : "bg-red-100"}`}>
                <span className="text-xl">⏱️</span>
              </div>
              <span className="text-sm text-slate-500">{language === "ro" ? "Activ" : "Active"}</span>
            </div>
            <p className={`text-2xl font-bold ${getActiveColor(todayStats?.activeMinutes || 0)}`}>
              {todayStats?.activeMinutes || 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === "ro" ? "Target:" : "Target:"} {targets.activeMinutes} min
            </p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${isTargetMet(todayStats?.activeMinutes || 0, targets.activeMinutes) ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${calculateProgress(todayStats?.activeMinutes || 0, targets.activeMinutes)}%` }}
              />
            </div>
          </div>

          {/* Streak Card */}
          <div className="card p-4 bg-white border-l-4 border-amber-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <span className="text-xl">🔥</span>
              </div>
              <span className="text-sm text-slate-500">{language === "ro" ? "Streak" : "Streak"}</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {streak}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === "ro" ? "zile consecutive" : "days in a row"}
            </p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="card p-6 mb-8 bg-white">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            {language === "ro" ? "Activitate Săptămânală" : "Weekly Activity"}
          </h2>
          
          <div className="h-48 flex items-end justify-between gap-2">
            {weeklyChartData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t-lg transition-all ${isTargetMet(day.steps, targets.steps) ? "bg-emerald-500" : "bg-red-400"}`}
                  style={{ height: `${(day.steps / maxSteps) * 100}%`, minHeight: day.steps > 0 ? "8px" : "0" }}
                />
                <span className="text-xs text-slate-500 mt-2">{day.day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-600">
                {weeklyStats.steps.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">{language === "ro" ? "pași săpt." : "weekly steps"}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-orange-600">
                {weeklyStats.calories.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">{language === "ro" ? "calorii săpt." : "weekly calories"}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-purple-600">
                {weeklyStats.activeMinutes}
              </p>
              <p className="text-sm text-slate-500">{language === "ro" ? "min active săpt." : "weekly active min"}</p>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <div className="card p-6 mb-8 bg-white">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span>🏆</span>
              {language === "ro" ? "Realizări" : "Achievements"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{achievement.emoji}</span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {language === "ro" ? achievement.titleRo : achievement.titleEn}
                      </p>
                      <p className="text-xs text-slate-500">
                        {language === "ro" ? achievement.descRo : achievement.descEn}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
