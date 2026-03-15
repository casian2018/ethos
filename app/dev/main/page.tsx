/**
 * Dashboard - Main hub showing daily fitness overview
 * 
 * Purpose: Quick glance at what matters today
 * Minimal cognitive load - only key metrics
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, getCountFromServer, collection, query } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface UserProfile {
  age?: number;
  height?: number;
  weight?: number;
  fitnessLevel?: string;
  goals?: string[];
}

export default function MainPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [_user, setUser] = useState<User | null>(null);
  const [_profile, setProfile] = useState<UserProfile | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUser(currentUser);

      // Fetch user profile
      try {
        const profileDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        }

        // Get post count
        const postsQuery = query(collection(db, "forum_posts"));
        const postsSnapshot = await getCountFromServer(postsQuery);
        setPostCount(postsSnapshot.data().count);
      } catch (err) {
        console.error("Error loading data:", err);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Welcome Section */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
          {t("dashboard.welcome")} 👋
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          {t("dashboard.subtitle")}
        </p>
      </header>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/dev/workout"
          className="card-hover p-6 flex flex-col items-center justify-center gap-2 text-center"
        >
          <span className="text-3xl">💪</span>
          <span className="font-medium text-zinc-900 dark:text-white">
            {t("dashboard.generateWorkout")}
          </span>
        </Link>
        
        <Link
          href="/dev/find_a_buddy"
          className="card-hover p-6 flex flex-col items-center justify-center gap-2 text-center"
        >
          <span className="text-3xl">🤝</span>
          <span className="font-medium text-zinc-900 dark:text-white">
            {t("nav.findBuddy")}
          </span>
        </Link>
      </div>

      {/* Today's Workout Card */}
      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Today&apos;s Workout
        </h2>
        <div className="text-center py-8">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            {t("dashboard.noWorkout")}
          </p>
          <Link
            href="/dev/workout"
            className="btn-primary inline-flex items-center gap-2"
          >
            <span>✨</span>
            {t("workout.generate")}
          </Link>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Sleep Card */}
        <Link href="/dev/sleep-analysis" className="card-hover p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">😴</span>
            <span className="font-medium text-zinc-900 dark:text-white">
              Sleep
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            --
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Recovery score
          </p>
        </Link>

        {/* Steps Card */}
        <Link href="/dev/stats" className="card-hover p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👟</span>
            <span className="font-medium text-zinc-900 dark:text-white">
              Steps
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            --
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Daily goal
          </p>
        </Link>
      </div>

      {/* Competition Preview */}
      <Link href="/dev/competition" className="card-hover p-6 mb-6 block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-white">
                Active Competition
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Join a step challenge
              </p>
            </div>
          </div>
          <span className="text-zinc-400">→</span>
        </div>
      </Link>

      {/* Forum Highlights - Now shows actual count */}
      <Link href="/dev/forum" className="card-hover p-6 block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-white">
                Community
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {postCount > 0 
                  ? `${postCount} post${postCount !== 1 ? 's' : ''} in forum` 
                  : t("dashboard.noPosts")}
              </p>
            </div>
          </div>
          <span className="text-zinc-400">→</span>
        </div>
      </Link>
    </div>
  );
}
