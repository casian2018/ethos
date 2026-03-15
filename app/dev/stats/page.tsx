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
  Timestamp
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";

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

export default function StatsDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [healthStats, setHealthStats] = useState<HealthStat[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{ steps: number; calories: number; activeMinutes: number }>({
    steps: 0,
    calories: 0,
    activeMinutes: 0
  });
  const [streak, setStreak] = useState(0);
  const [_userId, setUserId] = useState<string>("");

  async function loadStats(uid: string) {
    // Load health stats - query without orderBy to avoid index requirement
    const statsQuery = query(
      collection(db, "health_stats"),
      where("userId", "==", uid),
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
    let currentStreak = 0;
    
    stats.forEach((stat) => {
      const statDate = new Date(stat.date);
      if (statDate >= weekAgo) {
        weeklySteps += stat.steps;
        weeklyCalories += stat.calories;
        weeklyActiveMinutes += stat.activeMinutes;
      }
    });

    // Calculate streak
    const sortedByDate = [...stats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (let i = 0; i < sortedByDate.length; i++) {
      const stat = sortedByDate[i];
      if (stat.steps > 0 || stat.activeMinutes > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    setWeeklyStats({
      steps: weeklySteps,
      calories: weeklyCalories,
      activeMinutes: weeklyActiveMinutes
    });
    setStreak(currentStreak);
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
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      steps: dayStat?.steps || 0,
      calories: dayStat?.calories || 0,
      activeMinutes: dayStat?.activeMinutes || 0
    };
  });

  const maxSteps = Math.max(...weeklyChartData.map(d => d.steps), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Activity Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your fitness progress</p>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 dark:bg-zinc-900">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Today</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {(todayStats?.steps || 0).toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500">steps</p>
          </div>

          <div className="card p-4 dark:bg-zinc-900">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Calories</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {todayStats?.calories || 0}
            </p>
            <p className="text-xs text-zinc-500">kcal today</p>
          </div>

          <div className="card p-4 dark:bg-zinc-900">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Active</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {todayStats?.activeMinutes || 0}
            </p>
            <p className="text-xs text-zinc-500">minutes today</p>
          </div>

          <div className="card p-4 dark:bg-zinc-900">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Streak</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {streak}
            </p>
            <p className="text-xs text-zinc-500">days in a row</p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="card p-6 mb-8 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Weekly Activity</h2>
          
          <div className="h-48 flex items-end justify-between gap-2">
            {weeklyChartData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-emerald-500 dark:bg-emerald-600 rounded-t-lg transition-all"
                  style={{ height: `${(day.steps / maxSteps) * 100}%`, minHeight: day.steps > 0 ? "8px" : "0" }}
                />
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{day.day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {weeklyStats.steps.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500">weekly steps</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {weeklyStats.calories.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500">weekly calories</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {weeklyStats.activeMinutes}
              </p>
              <p className="text-sm text-zinc-500">weekly minutes</p>
            </div>
          </div>
        </div>

        {/* Import Stats Button */}
        <div className="card p-6 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Import More Data</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Upload screenshots from Apple Health or Samsung Health
              </p>
            </div>
            <button
              onClick={() => router.push("/stats/import")}
              className="btn-primary"
            >
              Import Stats
            </button>
          </div>
        </div>

        {/* Recent History */}
        {healthStats.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {healthStats.slice(0, 10).map((stat) => (
                <div key={stat.id} className="card p-4 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{stat.date}</p>
                      <div className="flex gap-4 mt-1 text-sm text-zinc-500">
                        <span>{stat.steps.toLocaleString()} steps</span>
                        <span>{stat.calories} kcal</span>
                        <span>{stat.activeMinutes} min</span>
                        <span>{stat.distance} km</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {healthStats.length === 0 && (
          <div className="card p-12 text-center mt-8 dark:bg-zinc-900">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No activity data yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">Import your health data to see your stats</p>
            <button
              onClick={() => router.push("/stats/import")}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Health Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
