"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  Activity,
  Apple,
  ArrowRight,
  Clock3,
  MapPin,
  MessageCircle,
  MoonStar,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { isFutureSlot, normalizeFindBuddySlot, type FindBuddySlot } from "@/lib/findBuddy";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface UserProfile {
  displayName?: string;
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

const sportEmojis: Record<string, string> = {
  gym: "🏋️",
  running: "🏃",
  swimming: "🏊",
  football: "⚽",
  tennis: "🎾",
  yoga: "🧘",
  cycling: "🚴",
  basketball: "🏀",
  volleyball: "🏐",
};

function formatWorkoutDate(dateTime: Date | Timestamp | null, lang: string): string {
  if (!dateTime) {
    return "";
  }

  try {
    const date = dateTime instanceof Date ? dateTime : dateTime.toDate();
    return date.toLocaleDateString(lang === "ro" ? "ro-RO" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function MainPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nextWorkout, setNextWorkout] = useState<FindBuddySlot | null>(null);
  const [recentPosts, setRecentPosts] = useState<ForumPost[]>([]);
  const [todayStats, setTodayStats] = useState({ steps: 0, sleep: 0 });
  const [fabOpen, setFabOpen] = useState(false);

  const fetchNextWorkout = async (uid: string) => {
    try {
      const slotsSnapshot = await getDocs(query(collection(db, "availability_slots"), orderBy("dateTime", "asc")));
      const nextSlot =
        slotsSnapshot.docs
          .map((slotDoc) => normalizeFindBuddySlot(slotDoc.id, slotDoc.data() as Record<string, unknown>))
          .filter((slot) => isFutureSlot(slot))
          .filter((slot) => slot.hostId === uid || slot.participants.includes(uid))
          .sort((left, right) => left.dateTime.getTime() - right.dateTime.getTime())[0] || null;

      setNextWorkout(nextSlot);
    } catch (error) {
      console.error("Error fetching next workout:", error);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const postsSnapshot = await getDocs(
        query(collection(db, "forum_posts"), orderBy("createdAt", "desc"), limit(3))
      );

      setRecentPosts(
        postsSnapshot.docs.map((postDoc) => ({
          id: postDoc.id,
          ...postDoc.data(),
        })) as ForumPost[]
      );
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchTodayStats = async (uid: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const healthSnapshot = await getDocs(
        query(collection(db, "users", uid, "health_stats"), where("date", "==", today), limit(1))
      );
      const sleepSnapshot = await getDocs(
        query(collection(db, "users", uid, "sleep_records"), where("date", "==", today), limit(1))
      );

      const steps = healthSnapshot.empty ? 0 : ((healthSnapshot.docs[0]?.data() as HealthStat).steps || 0);
      const sleep = sleepSnapshot.empty ? 0 : ((sleepSnapshot.docs[0]?.data() as SleepRecord).sleepHours || 0);

      setTodayStats({ steps, sleep });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }

      try {
        const profileDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        }

        await Promise.all([
          fetchNextWorkout(currentUser.uid),
          fetchRecentPosts(),
          fetchTodayStats(currentUser.uid),
        ]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="ethos-panel rounded-[32px] px-10 py-10 text-center">
          <div className="animate-ethos-float mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-emerald-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="ethos-display mt-5 text-4xl font-semibold text-slate-900">Preparing your dashboard</h1>
        </div>
      </div>
    );
  }

  const stepsProgress = Math.min((todayStats.steps / 10000) * 100, 100);
  const sleepProgress = Math.min((todayStats.sleep / 8) * 100, 100);
  const displayName =
    profile?.displayName ||
    (language === "ro" ? "sportivule" : "athlete");

  return (
    <div className="pb-24">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="ethos-panel rounded-[38px] p-6 sm:p-8">
          <div className="ethos-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            {language === "ro" ? "Hub personal" : "Personal hub"}
          </div>
          <h1 className="ethos-section-title mt-6 text-slate-900">
            {language === "ro" ? "Bine ai revenit," : "Welcome back,"} {displayName}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            {language === "ro"
              ? "Aici vezi rapid ce urmează, cum stai cu pașii și somnul, plus ce se mișcă în comunitate."
              : "See what is next, how your steps and sleep are doing, and what is moving in the community."}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {profile?.city && <span className="ethos-chip">📍 {profile.city}</span>}
            {(profile?.preferredSports || []).slice(0, 2).map((sport) => (
              <span key={sport} className="ethos-chip">
                {sportEmojis[sport] || "✨"} {sport}
              </span>
            ))}
            {(profile?.goals || []).slice(0, 2).map((goal) => (
              <span key={goal} className="ethos-chip">
                🎯 {goal}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dev/train/workout"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(240,116,62,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/90"
            >
              {language === "ro" ? "Generează workout" : "Generate workout"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dev/find_a_buddy/feed"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              {language === "ro" ? "Intră în find a buddy" : "Open find a buddy"}
            </Link>
          </div>
        </div>

        <div className="rounded-[38px] bg-gradient-to-br from-[#12211f] via-[#17332f] to-[#f0743e] p-6 text-white shadow-[0_28px_64px_rgba(17,31,30,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            {language === "ro" ? "Cadru de azi" : "Today frame"}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-white/75" />
                <p className="text-sm text-white/70">{language === "ro" ? "Mișcare" : "Movement"}</p>
              </div>
              <p className="mt-4 text-4xl font-semibold">{todayStats.steps.toLocaleString()}</p>
              <p className="mt-1 text-sm text-white/70">/ 10,000 {language === "ro" ? "pași" : "steps"}</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <MoonStar className="h-5 w-5 text-white/75" />
                <p className="text-sm text-white/70">{language === "ro" ? "Recovery" : "Recovery"}</p>
              </div>
              <p className="mt-4 text-4xl font-semibold">{todayStats.sleep}h</p>
              <p className="mt-1 text-sm text-white/70">/ 8h {language === "ro" ? "somn recomandat" : "recommended sleep"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="ethos-panel rounded-[36px] p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {language === "ro" ? "Următorul moment" : "Next moment"}
                </p>
                <h2 className="ethos-display mt-3 text-4xl font-semibold text-slate-900">
                  {language === "ro" ? "Sesiunea următoare" : "Upcoming session"}
                </h2>
              </div>
              <Link
                href="/dev/find_a_buddy/feed"
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                {language === "ro" ? "Vezi toate sesiunile" : "View all sessions"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {nextWorkout ? (
              <div className="mt-6 rounded-[30px] bg-gradient-to-br from-emerald-500 to-[#12211f] p-6 text-white shadow-[0_20px_46px_rgba(40,90,70,0.22)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/12 text-4xl backdrop-blur">
                      {sportEmojis[nextWorkout.sportType] || "🏋️"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                        {language === "ro" ? "Antrenament programat" : "Scheduled workout"}
                      </p>
                      <h3 className="mt-2 text-3xl font-semibold capitalize">{nextWorkout.sportType}</h3>
                      <p className="mt-2 text-sm text-white/75">{nextWorkout.hostName}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold">
                    {nextWorkout.participants.length}/{nextWorkout.maxParticipants}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Clock3 className="h-4 w-4" />
                      {language === "ro" ? "Când" : "When"}
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">
                      {formatWorkoutDate(nextWorkout.dateTime, language)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <MapPin className="h-4 w-4" />
                      {language === "ro" ? "Unde" : "Where"}
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{nextWorkout.location.name}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Users className="h-4 w-4" />
                      {language === "ro" ? "Durată" : "Duration"}
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{nextWorkout.duration} min</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[30px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-lg font-semibold text-slate-900">
                  {language === "ro" ? "Nu ai încă sesiuni programate" : "No sessions scheduled yet"}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {language === "ro"
                    ? "Intră în feed și alătură-te unei sesiuni sau publică una nouă."
                    : "Open the feed to join a session or publish a new one."}
                </p>
              </div>
            )}
          </div>

          <div className="ethos-panel rounded-[36px] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {language === "ro" ? "Comunitate" : "Community"}
                </p>
                <h2 className="ethos-display mt-3 text-4xl font-semibold text-slate-900">
                  {language === "ro" ? "Discuții recente" : "Recent discussions"}
                </h2>
              </div>
              <Link
                href="/dev/forum"
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                {language === "ro" ? "Forum" : "Forum"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/dev/forum/${post.id}`}
                    className="ethos-card-lift block rounded-[26px] border border-slate-200/80 bg-white/76 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                        {sportEmojis[post.sport] || "💬"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-semibold text-slate-900">{post.title}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          {post.category} • {post.authorName}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  {language === "ro" ? "Încă nu există postări recente." : "There are no recent posts yet."}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="ethos-panel rounded-[36px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {language === "ro" ? "Readiness" : "Readiness"}
            </p>
            <h2 className="ethos-display mt-3 text-4xl font-semibold text-slate-900">
              {language === "ro" ? "Semnalele de azi" : "Signals for today"}
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{language === "ro" ? "Pași" : "Steps"}</span>
                  <span className="font-semibold text-slate-900">{todayStats.steps.toLocaleString()}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-orange-500"
                    style={{ width: `${stepsProgress}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{language === "ro" ? "Somn" : "Sleep"}</span>
                  <span className="font-semibold text-slate-900">{todayStats.sleep}h</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                    style={{ width: `${sleepProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[36px] bg-slate-900 p-6 text-white shadow-[0_28px_64px_rgba(17,31,30,0.16)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
              {language === "ro" ? "Acțiuni rapide" : "Quick actions"}
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  href: "/dev/train/workout",
                  label: language === "ro" ? "Generează workout" : "Generate workout",
                  detail: "AI planning",
                  icon: Sparkles,
                },
                {
                  href: "/dev/nutrition",
                  label: language === "ro" ? "Deschide nutrition" : "Open nutrition",
                  detail: "Macros & meals",
                  icon: Apple,
                },
                {
                  href: "/dev/find_a_buddy",
                  label: language === "ro" ? "Caută oameni" : "Find people",
                  detail: "Live sessions",
                  icon: Users,
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between rounded-[24px] bg-white/7 px-4 py-4 transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{action.label}</p>
                      <p className="text-xs text-white/60">{action.detail}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/70" />
                </Link>
              ))}
            </div>
          </div>

          {profile?.medicalConditions &&
            profile.medicalConditions.length > 0 &&
            !profile.medicalConditions.includes("none") && (
              <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      {language === "ro" ? "Atenționare medicală activă" : "Active medical flag"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-800">
                      {language === "ro"
                        ? `Planurile tale sunt adaptate pentru: ${profile.medicalConditions.join(", ")}.`
                        : `Your plans are adapted for: ${profile.medicalConditions.join(", ")}.`}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </section>

      <div className="fixed bottom-6 right-6 z-30">
        {fabOpen && (
          <div className="mb-3 space-y-2">
            {[
              { href: "/dev/find_a_buddy", label: language === "ro" ? "Postează slot" : "Create slot", icon: Users },
              { href: "/dev/train/workout", label: language === "ro" ? "Workout nou" : "New workout", icon: Sparkles },
              { href: "/dev/forum", label: language === "ro" ? "Discuție nouă" : "New discussion", icon: MessageCircle },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setFabOpen(false)}
                className="ethos-panel flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setFabOpen((current) => !current)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_20px_40px_rgba(240,116,62,0.28)] transition hover:-translate-y-0.5 hover:bg-primary/90"
        >
          {fabOpen ? "×" : "+"}
        </button>
      </div>
    </div>
  );
}
