/**
 * Workout History Page - View completed workouts
 * 
 * Route: /train/history
 * 
 * Features:
 * - List of completed workouts
 * - Workout details
 * - Total volume stats
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  doc,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface WorkoutSession {
  id: string;
  userId: string;
  workoutName: string;
  workoutType: string;
  date: string;
  startTime: Timestamp | null;
  endTime?: Timestamp | null;
  status: "active" | "completed";
  source: "generated" | "saved";
  totalVolume?: number;
}

export default function WorkoutHistoryPage() {
  const [_user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // For demo, use mock user
        setUser({ uid: "demo-user" } as User);
        setLoading(false);
        return;
      }
      setUser(currentUser);
      loadHistory(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  const loadHistory = async (userId: string) => {
    try {
      // Get completed sessions
      const sessionsQuery = query(
        collection(db, "workout_sessions"),
        where("userId", "==", userId),
        where("status", "==", "completed"),
        orderBy("startTime", "desc"),
        limit(20)
      );

      const snapshot = await getDocs(sessionsQuery);
      const sessionsData: WorkoutSession[] = [];
      
      snapshot.forEach((doc) => {
        sessionsData.push({ id: doc.id, ...doc.data() } as WorkoutSession);
      });
      
      setSessions(sessionsData);

      // Calculate stats
      const totalVolume = sessionsData.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
      
      // This week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const thisWeek = sessionsData.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate >= startOfWeek;
      }).length;

      setStats({
        totalWorkouts: sessionsData.length,
        totalVolume,
        thisWeek,
      });

    } catch (err) {
      console.error("Error loading history:", err);
      // Use demo data on error
      setSessions([
        {
          id: "1",
          userId: userId,
          workoutName: "Full Body Strength",
          workoutType: "gym",
          date: new Date(Date.now() - 86400000).toISOString(),
          startTime: null,
          status: "completed",
          source: "generated",
          totalVolume: 12500,
        },
        {
          id: "2",
          userId: userId,
          workoutName: "HIIT Cardio",
          workoutType: "cardio",
          date: new Date(Date.now() - 172800000).toISOString(),
          startTime: null,
          status: "completed",
          source: "generated",
          totalVolume: 0,
        },
        {
          id: "3",
          userId: userId,
          workoutName: "Upper Body",
          workoutType: "gym",
          date: new Date(Date.now() - 345600000).toISOString(),
          startTime: null,
          status: "completed",
          source: "saved",
          totalVolume: 8500,
        },
      ]);
      setStats({
        totalWorkouts: 3,
        totalVolume: 21000,
        thisWeek: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k kg`;
    }
    return `${volume} kg`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <Link href="/train" className="text-zinc-500 text-slate-500 mb-2 inline-flex items-center gap-1">
          ← Back to Train
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 text-slate-900">
          Workout History
        </h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 text-emerald-600">
            {stats.totalWorkouts}
          </p>
          <p className="text-xs text-zinc-500">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 text-emerald-600">
            {formatVolume(stats.totalVolume)}
          </p>
          <p className="text-xs text-zinc-500">Volume</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 text-emerald-600">
            {stats.thisWeek}
          </p>
          <p className="text-xs text-zinc-500">This Week</p>
        </div>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🏋️</div>
          <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-2">
            No workouts yet
          </h2>
          <p className="text-zinc-500 mb-4">
            Complete your first workout to see it here
          </p>
          <Link href="/train/workout" className="btn-primary">
            Generate Workout
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-zinc-900 text-slate-900">
                  {session.workoutName}
                </h3>
                <span className="text-sm text-zinc-500">
                  {formatDate(session.date)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <span className="badge badge-primary">
                  {session.workoutType}
                </span>
                {session.totalVolume ? (
                  <span>Volume: {formatVolume(session.totalVolume)}</span>
                ) : null}
                <span className="badge badge-secondary">
                  {session.source === "generated" ? "AI" : "Saved"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6">
        <Link href="/train/workout" className="btn-primary w-full py-3 text-center block">
          Start New Workout
        </Link>
      </div>
    </div>
  );
}
