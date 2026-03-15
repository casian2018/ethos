"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
  Achievement,
  calculateProgress,
  calculateStreak,
  checkAchievements,
  formatNumber,
  getAdaptiveTargets,
  isTargetMet,
} from "@/lib/healthUtils";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface RawHealthStat {
  id: string;
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
  date: string;
  createdAt?: Timestamp;
  source?: string;
}

interface DailyHealthStat extends RawHealthStat {
  entries: number;
}

interface UserProfile {
  medicalConditions: string[];
  city?: string;
  fitnessLevel?: string;
}

function getDateKey(offsetDays = 0): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

function getTimestampValue(timestamp?: Timestamp): number {
  return timestamp?.toMillis?.() ?? 0;
}

function formatDayLabel(dateKey: string, language: string): string {
  return new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString(language === "ro" ? "ro-RO" : "en-US", {
    weekday: "short",
  });
}

function aggregateDailyStats(stats: RawHealthStat[]): DailyHealthStat[] {
  const byDate = new Map<string, DailyHealthStat>();

  stats.forEach((entry) => {
    if (!entry.date) return;

    const existing = byDate.get(entry.date);
    if (!existing) {
      byDate.set(entry.date, {
        ...entry,
        entries: 1,
      });
      return;
    }

    const incomingTime = getTimestampValue(entry.createdAt);
    const existingTime = getTimestampValue(existing.createdAt);
    const shouldReplaceMeta = incomingTime >= existingTime;

    byDate.set(entry.date, {
      ...existing,
      steps: Math.max(existing.steps, entry.steps),
      calories: Math.max(existing.calories, entry.calories),
      distance: Math.max(existing.distance, entry.distance),
      activeMinutes: Math.max(existing.activeMinutes, entry.activeMinutes),
      createdAt: shouldReplaceMeta ? entry.createdAt ?? existing.createdAt : existing.createdAt,
      source: shouldReplaceMeta ? entry.source ?? existing.source : existing.source,
      entries: existing.entries + 1,
    });
  });

  return Array.from(byDate.values()).sort(
    (left, right) => right.date.localeCompare(left.date) || getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt)
  );
}

function sumStats(stats: Array<Pick<DailyHealthStat, "steps" | "calories" | "distance" | "activeMinutes">>) {
  return {
    steps: stats.reduce((sum, entry) => sum + entry.steps, 0),
    calories: stats.reduce((sum, entry) => sum + entry.calories, 0),
    distance: Number(stats.reduce((sum, entry) => sum + entry.distance, 0).toFixed(1)),
    activeMinutes: stats.reduce((sum, entry) => sum + entry.activeMinutes, 0),
  };
}

function getPercentChange(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export default function EvolutionPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [healthStats, setHealthStats] = useState<DailyHealthStat[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [targets, setTargets] = useState({ steps: 10000, calories: 500, activeMinutes: 30 });

  async function loadEvolution(uid: string) {
    try {
      const [profileDoc, statsSnapshot] = await Promise.all([
        getDoc(doc(db, "users", uid)),
        getDocs(query(collection(db, "health_stats"), where("userId", "==", uid))),
      ]);

      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as UserProfile;
        setUserProfile(profileData);
        setTargets(getAdaptiveTargets(profileData.medicalConditions || []));
      } else {
        setUserProfile(null);
        setTargets(getAdaptiveTargets([]));
      }

      const importedStats = statsSnapshot.docs.map((snapshot) => {
        const data = snapshot.data();

        return {
          id: snapshot.id,
          steps: data.steps || 0,
          calories: data.calories || 0,
          distance: data.distance || 0,
          activeMinutes: data.activeMinutes || 0,
          date: data.date || "",
          createdAt: data.createdAt,
          source: data.source || "Imported",
        } satisfies RawHealthStat;
      });

      setHealthStats(aggregateDailyStats(importedStats));
    } catch (error) {
      console.error("Error loading evolution data:", error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      try {
        await loadEvolution(user.uid);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const todayKey = getDateKey();
  const todayStats = healthStats.find((stat) => stat.date === todayKey);
  const last7DayKeys = Array.from({ length: 7 }, (_, index) => getDateKey(-index));
  const previous7DayKeys = Array.from({ length: 7 }, (_, index) => getDateKey(-(index + 7)));
  const last7DaySet = new Set(last7DayKeys);
  const previous7DaySet = new Set(previous7DayKeys);
  const currentWeekStats = healthStats.filter((stat) => last7DaySet.has(stat.date));
  const previousWeekStats = healthStats.filter((stat) => previous7DaySet.has(stat.date));
  const weeklyStats = sumStats(currentWeekStats);
  const previousWeeklyStats = sumStats(previousWeekStats);
  const weeklyStepChange = getPercentChange(weeklyStats.steps, previousWeeklyStats.steps);
  const averageDailySteps = Math.round(weeklyStats.steps / 7);
  const consistencyDays = currentWeekStats.filter(
    (stat) => isTargetMet(stat.steps, targets.steps) || isTargetMet(stat.activeMinutes, targets.activeMinutes)
  ).length;
  const streak = calculateStreak(healthStats.map((stat) => ({ date: stat.date, steps: stat.steps, activeMinutes: stat.activeMinutes })));
  const achievements = checkAchievements(
    healthStats.map((stat) => ({
      steps: stat.steps,
      calories: stat.calories,
      activeMinutes: stat.activeMinutes,
      date: stat.date,
    }))
  );
  const bestDay = healthStats.length > 0
    ? healthStats.reduce((best, stat) => (stat.steps > best.steps ? stat : best), healthStats[0])
    : null;
  const statsByDate = new Map(healthStats.map((stat) => [stat.date, stat]));
  const weeklyChartData = Array.from({ length: 7 }, (_, index) => {
    const dateKey = getDateKey(-(6 - index));
    const dayStat = statsByDate.get(dateKey);

    return {
      day: formatDayLabel(dateKey, language),
      steps: dayStat?.steps || 0,
      calories: dayStat?.calories || 0,
      activeMinutes: dayStat?.activeMinutes || 0,
    };
  });
  const maxSteps = Math.max(...weeklyChartData.map((entry) => entry.steps), targets.steps, 1);

  const getStepColor = (steps: number) => (isTargetMet(steps, targets.steps) ? "text-emerald-600" : "text-red-500");
  const getCalorieColor = (calories: number) =>
    isTargetMet(calories, targets.calories) ? "text-emerald-600" : "text-red-500";
  const getActiveColor = (minutes: number) =>
    isTargetMet(minutes, targets.activeMinutes) ? "text-emerald-600" : "text-red-500";

  const trendCopy =
    previousWeeklyStats.steps === 0
      ? weeklyStats.steps > 0
        ? language === "ro"
          ? "Prima săptămână cu date urmărite"
          : "First tracked week"
        : language === "ro"
          ? "Nicio activitate importată încă"
          : "No imported activity yet"
      : weeklyStepChange === 0
        ? language === "ro"
          ? "Același ritm ca săptămâna trecută"
          : "Same pace as last week"
        : language === "ro"
          ? `${Math.abs(weeklyStepChange)}% ${weeklyStepChange > 0 ? "peste" : "sub"} ultimele 7 zile`
          : `${Math.abs(weeklyStepChange)}% ${weeklyStepChange > 0 ? "above" : "below"} the previous 7 days`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
              {language === "ro" ? "Mișcare urmărită" : "Tracked movement"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{t("stats.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t("stats.subtitle")}</p>
          </div>

          <Link
            href="/dev/evolution/import"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {language === "ro" ? "Importă date" : "Import data"}
          </Link>
        </div>

        {userProfile?.medicalConditions &&
          userProfile.medicalConditions.length > 0 &&
          !userProfile.medicalConditions.includes("none") && (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                {language === "ro"
                  ? `Target-uri adaptate pentru condițiile tale medicale. Pași zilnici: ${targets.steps.toLocaleString()}`
                  : `Adaptive targets for your medical conditions. Daily steps: ${targets.steps.toLocaleString()}`}
              </p>
            </div>
          )}

        {healthStats.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-3xl">📈</div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-900">
              {language === "ro" ? "Evoluția apare după primul import" : "Evolution starts after your first import"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              {language === "ro"
                ? "Încarcă un screenshot din Apple Health sau Samsung Health, iar Ethos îți construiește automat istoricul zilnic, trendul și streak-ul."
                : "Upload a screenshot from Apple Health or Samsung Health and Ethos will build your daily history, trend line, and streak automatically."}
            </p>
            <Link
              href="/dev/evolution/import"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {language === "ro" ? "Importă primul screenshot" : "Import your first screenshot"}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <div
                className={`rounded-[28px] border-l-4 bg-white p-4 shadow-sm ${isTargetMet(todayStats?.steps || 0, targets.steps) ? "border-emerald-500" : "border-red-500"}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${isTargetMet(todayStats?.steps || 0, targets.steps) ? "bg-emerald-100" : "bg-red-100"}`}
                  >
                    <span className="text-xl">👟</span>
                  </div>
                  <span className="text-sm text-slate-500">{t("stats.steps")}</span>
                </div>
                <p className={`text-2xl font-bold ${getStepColor(todayStats?.steps || 0)}`}>
                  {formatNumber(todayStats?.steps || 0)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {t("stats.target")}: {targets.steps.toLocaleString()}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${isTargetMet(todayStats?.steps || 0, targets.steps) ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${calculateProgress(todayStats?.steps || 0, targets.steps)}%` }}
                  />
                </div>
              </div>

              <div
                className={`rounded-[28px] border-l-4 bg-white p-4 shadow-sm ${isTargetMet(todayStats?.calories || 0, targets.calories) ? "border-emerald-500" : "border-red-500"}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${isTargetMet(todayStats?.calories || 0, targets.calories) ? "bg-emerald-100" : "bg-red-100"}`}
                  >
                    <span className="text-xl">🔥</span>
                  </div>
                  <span className="text-sm text-slate-500">{t("stats.calories")}</span>
                </div>
                <p className={`text-2xl font-bold ${getCalorieColor(todayStats?.calories || 0)}`}>
                  {todayStats?.calories || 0}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {t("stats.target")}: {targets.calories} kcal
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${isTargetMet(todayStats?.calories || 0, targets.calories) ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${calculateProgress(todayStats?.calories || 0, targets.calories)}%` }}
                  />
                </div>
              </div>

              <div
                className={`rounded-[28px] border-l-4 bg-white p-4 shadow-sm ${isTargetMet(todayStats?.activeMinutes || 0, targets.activeMinutes) ? "border-emerald-500" : "border-red-500"}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${isTargetMet(todayStats?.activeMinutes || 0, targets.activeMinutes) ? "bg-emerald-100" : "bg-red-100"}`}
                  >
                    <span className="text-xl">⏱️</span>
                  </div>
                  <span className="text-sm text-slate-500">{t("stats.active")}</span>
                </div>
                <p className={`text-2xl font-bold ${getActiveColor(todayStats?.activeMinutes || 0)}`}>
                  {todayStats?.activeMinutes || 0}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {t("stats.target")}: {targets.activeMinutes} min
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${isTargetMet(todayStats?.activeMinutes || 0, targets.activeMinutes) ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${calculateProgress(todayStats?.activeMinutes || 0, targets.activeMinutes)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-[28px] border-l-4 border-amber-500 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                    <span className="text-xl">🔥</span>
                  </div>
                  <span className="text-sm text-slate-500">{t("stats.streak")}</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">{streak}</p>
                <p className="mt-1 text-xs text-slate-400">{t("stats.daysInRow")}</p>
              </div>
            </div>

            <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {language === "ro" ? "Pulse evoluție" : "Evolution pulse"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {language === "ro"
                      ? "Datele sunt consolidate pe zi, astfel încât importurile multiple din aceeași zi să nu îți dubleze progresul."
                      : "Daily imports are consolidated so multiple uploads on the same date do not inflate your progress."}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {healthStats.length} {language === "ro" ? "zile urmărite" : "tracked days"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {language === "ro" ? "Direcție 7 zile" : "7-day direction"}
                  </p>
                  <p className={`mt-3 text-3xl font-semibold ${weeklyStepChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {previousWeeklyStats.steps === 0 && weeklyStats.steps === 0 ? "0%" : `${weeklyStepChange > 0 ? "+" : ""}${weeklyStepChange}%`}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{trendCopy}</p>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {language === "ro" ? "Media zilnică" : "Daily average"}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(averageDailySteps)}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {language === "ro" ? "pași pe zi în ultimele 7 zile" : "steps per day across the last 7 days"}
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {language === "ro" ? "Consistență" : "Consistency"}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{consistencyDays}/7</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {language === "ro"
                      ? "zile care au atins targetul de pași sau minute active"
                      : "days that hit either your steps or active-minutes target"}
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {language === "ro" ? "Cea mai bună zi" : "Best day"}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {bestDay ? formatNumber(bestDay.steps) : "0"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {bestDay
                      ? language === "ro"
                        ? `${bestDay.date} • ${bestDay.distance.toFixed(1)} km`
                        : `${bestDay.date} • ${bestDay.distance.toFixed(1)} km`
                      : language === "ro"
                        ? "Fără zi de referință încă"
                        : "No reference day yet"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-6 text-lg font-semibold text-slate-900">
                {language === "ro" ? "Evoluție 7 zile" : "7-day evolution"}
              </h2>

              <div className="flex h-52 items-end justify-between gap-2">
                {weeklyChartData.map((day) => (
                  <div key={day.day} className="flex flex-1 flex-col items-center">
                    <div
                      className={`w-full rounded-t-2xl transition-all ${isTargetMet(day.steps, targets.steps) ? "bg-emerald-500" : "bg-red-400"}`}
                      style={{ height: `${(day.steps / maxSteps) * 100}%`, minHeight: day.steps > 0 ? "12px" : "0" }}
                    />
                    <span className="mt-2 text-xs text-slate-500">{day.day}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-600">{weeklyStats.steps.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">{t("stats.weeklySteps")}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-600">{weeklyStats.calories.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">{t("stats.weeklyCalories")}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-600">{weeklyStats.activeMinutes}</p>
                  <p className="text-sm text-slate-500">{t("stats.weeklyActiveMin")}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-sky-600">{weeklyStats.distance.toFixed(1)} km</p>
                  <p className="text-sm text-slate-500">{language === "ro" ? "distanță / 7 zile" : "distance / 7 days"}</p>
                </div>
              </div>
            </div>

            {achievements.length > 0 && (
              <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <span>🏆</span>
                  {t("stats.achievements")}
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {achievements.map((achievement: Achievement) => (
                    <div
                      key={achievement.id}
                      className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{achievement.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
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
          </>
        )}
      </div>
    </div>
  );
}
