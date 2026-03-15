/**
 * Workout Session Page - Live workout tracking
 * 
 * Route: /train/session/[sessionId]
 * 
 * Features:
 * - Display workout exercises
 * - Log sets (weight/reps)
 * - Rest timer
 * - Finish workout
 */

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface SessionExercise {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
  restTime: number;
}

interface SetLog {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  timestamp: Timestamp | null;
}

interface WorkoutSession {
  id: string;
  userId: string;
  workoutName: string;
  workoutType: string;
  date: string;
  startTime: Timestamp | null;
  status: "active" | "completed";
  source: "generated" | "saved";
}

export default function WorkoutSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [_user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [completedSets, setCompletedSets] = useState<Record<string, SetLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTime, setRestTime] = useState(60);
  const [timer, setTimer] = useState(0);
  const [saving, setSaving] = useState(false);

  // New set input
  const [newWeight, setNewWeight] = useState("");
  const [newReps, setNewReps] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUser(currentUser);
      loadSession(currentUser.uid);
    });
    return () => unsubscribe();
   
  }, [sessionId, router]);

  // Rest timer countdown
  useEffect(() => {
    if (showRestTimer && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setShowRestTimer(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showRestTimer, timer]);

  const loadSession = async (userId: string) => {
    try {
      // Get session
      const sessionDoc = await getDoc(doc(db, "workout_sessions", sessionId));
      if (!sessionDoc.exists()) {
        router.push("/train");
        return;
      }
      const sessionData = sessionDoc.data() as WorkoutSession;
      if (sessionData.userId !== userId) {
        router.push("/train");
        return;
      }
      setSession(sessionData);

      // Get exercises from subcollection
      const exercisesQuery = collection(db, `workout_sessions/${sessionId}/exercises`);
      const exercisesSnapshot = await getDocs(exercisesQuery);
      const exercisesData: SessionExercise[] = [];
      exercisesSnapshot.forEach((doc: QueryDocumentSnapshot) => {
        exercisesData.push({ id: doc.id, ...doc.data() } as SessionExercise);
      });
      setExercises(exercisesData);

      // Load completed sets for each exercise
      const setsData: Record<string, SetLog[]> = {};
      for (const exercise of exercisesData) {
        const setsQuery = collection(db, `workout_sessions/${sessionId}/exercises/${exercise.id}/sets`);
        const setsSnapshot = await getDocs(setsQuery);
        const sets: SetLog[] = [];
        setsSnapshot.forEach((doc: QueryDocumentSnapshot) => {
          sets.push(doc.data() as SetLog);
        });
        setsData[exercise.id] = sets;
      }
      setCompletedSets(setsData);

    } catch (err) {
      console.error("Error loading session:", err);
    } finally {
      setLoading(false);
    }
  };

  const logSet = async (exerciseId: string) => {
    if (!newWeight || !newReps) return;
    setSaving(true);

    try {
      const exercise = exercises.find(e => e.id === exerciseId);
      const currentSets = completedSets[exerciseId] || [];
      const setNumber = currentSets.length + 1;

      // Add set to Firestore
      await addDoc(collection(db, `workout_sessions/${sessionId}/exercises/${exerciseId}/sets`), {
        setNumber,
        reps: parseInt(newReps),
        weight: parseFloat(newWeight),
        completed: true,
        timestamp: serverTimestamp(),
      });

      // Update local state
      const newSet: SetLog = {
        setNumber,
        reps: parseInt(newReps),
        weight: parseFloat(newWeight),
        completed: true,
        timestamp: null,
      };
      setCompletedSets(prev => ({
        ...prev,
        [exerciseId]: [...(prev[exerciseId] || []), newSet]
      }));

      // Start rest timer
      setRestTime(exercise?.restTime || 60);
      setTimer(exercise?.restTime || 60);
      setShowRestTimer(true);

      // Clear inputs
      setNewWeight("");
      setNewReps("");

    } catch (err) {
      console.error("Error logging set:", err);
    } finally {
      setSaving(false);
    }
  };

  const finishWorkout = async () => {
    if (!session) return;
    setSaving(true);

    try {
      // Calculate total volume
      let totalVolume = 0;
      Object.values(completedSets).forEach(sets => {
        sets.forEach(set => {
          totalVolume += set.weight * set.reps;
        });
      });

      // Update session status
      await updateDoc(doc(db, "workout_sessions", sessionId), {
        status: "completed",
        endTime: serverTimestamp(),
        totalVolume,
      });

      router.push("/dev/train/history");
    } catch (err) {
      console.error("Error finishing workout:", err);
    } finally {
      setSaving(false);
    }
  };

  const skipRest = () => {
    setShowRestTimer(false);
    setTimer(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!session || exercises.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 bg-white">
        <p className="text-zinc-500">Loading workout...</p>
      </div>
    );
  }

  const currentExerciseData = exercises[currentExercise];
  const currentSets = completedSets[currentExerciseData?.id] || [];
  const targetSets = currentExerciseData?.targetSets || 3;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <Link href="/train" className="text-zinc-500 text-slate-500 mb-2 inline-flex items-center gap-1">
          ← Exit Workout
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 text-slate-900">
          {session.workoutName}
        </h1>
        <p className="text-zinc-500">
          {session.workoutType} • {new Date(session.date).toLocaleDateString()}
        </p>
      </header>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {exercises.map((ex, i) => {
          const sets = completedSets[ex.id] || [];
          const completedCount = sets.filter(s => s.completed).length;
          const isActive = i === currentExercise;
          const isComplete = completedCount >= ex.targetSets;
          
          return (
            <button
              key={ex.id}
              onClick={() => setCurrentExercise(i)}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                isActive 
                  ? "bg-emerald-500 text-white" 
                  : isComplete 
                    ? "bg-emerald-100 bg-emerald-100 text-emerald-600 text-emerald-600"
                    : "bg-zinc-100 bg-slate-50 text-zinc-500"
              }`}
            >
              {isComplete ? "✓" : i + 1}
            </button>
          );
        })}
      </div>

      {/* Rest Timer Overlay */}
      {showRestTimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-8 text-center max-w-sm">
            <h3 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4">
              Rest Time
            </h3>
            <p className="text-5xl font-bold text-emerald-600 text-emerald-600 mb-6">
              {timer}s
            </p>
            <div className="flex gap-2 justify-center mb-4">
              {[30, 60, 90, 120].map(time => (
                <button
                  key={time}
                  onClick={() => { setRestTime(time); setTimer(time); }}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    restTime === time 
                      ? "bg-emerald-500 text-white" 
                      : "bg-zinc-100 bg-slate-50 text-zinc-600"
                  }`}
                >
                  {time}s
                </button>
              ))}
            </div>
            <button onClick={skipRest} className="btn-primary w-full">
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* Current Exercise */}
      {currentExerciseData && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 text-slate-900">
                {currentExerciseData.exerciseName}
              </h2>
              <span className="badge badge-primary">
                {currentExerciseData.muscleGroup}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Target</p>
              <p className="font-semibold text-zinc-900 text-slate-900">
                {targetSets} × {currentExerciseData.targetReps}
              </p>
            </div>
          </div>

          {/* Completed Sets */}
          <div className="space-y-2 mb-6">
            {currentSets.map((set, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm font-medium text-zinc-600 text-slate-500">
                  Set {set.setNumber}
                </span>
                <span className="font-semibold text-emerald-600 text-emerald-600">
                  {set.weight}kg × {set.reps}
                </span>
              </div>
            ))}
          </div>

          {/* Log New Set */}
          {currentSets.length < targetSets && (
            <div className="border-t border-zinc-200 border-slate-200 pt-4">
              <p className="text-sm text-zinc-500 mb-3">
                Log set {currentSets.length + 1}
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Reps"
                    value={newReps}
                    onChange={(e) => setNewReps(e.target.value)}
                    className="input"
                  />
                </div>
                <button
                  onClick={() => logSet(currentExerciseData.id)}
                  disabled={!newWeight || !newReps || saving}
                  className="btn-primary px-6"
                >
                  ✓
                </button>
              </div>
            </div>
          )}

          {currentSets.length >= targetSets && (
            <div className="mt-4 p-3 bg-emerald-100 bg-emerald-100 rounded-lg text-center">
              <p className="text-emerald-700 text-emerald-700 font-medium">
                ✓ Exercise Complete!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setCurrentExercise(Math.max(0, currentExercise - 1))}
          disabled={currentExercise === 0}
          className="btn-secondary flex-1"
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentExercise(Math.min(exercises.length - 1, currentExercise + 1))}
          disabled={currentExercise === exercises.length - 1}
          className="btn-secondary flex-1"
        >
          Next →
        </button>
      </div>

      {/* Finish Workout */}
      <button
        onClick={finishWorkout}
        disabled={saving}
        className="w-full btn-primary py-4 text-lg"
      >
        {saving ? "Saving..." : "Finish Workout"}
      </button>
    </div>
  );
}
