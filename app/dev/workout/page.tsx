"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, addDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface UserProfile {
  age: number;
  weight: number;
  height: number;
  fitnessLevel: string;
  goals: string[];
  experienceLevel: string;
  availableDaysPerWeek: number;
  injuries: string[];
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  rest?: string;
}

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
}

interface SavedWorkout {
  id: string;
  name: string;
  userId: string;
  type: "gym" | "home";
  plan: WorkoutDay[];
  createdAt: Timestamp;
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export default function WorkoutGeneratorPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [generatedWorkout, setGeneratedWorkout] = useState<{ type: string; duration: string; days: WorkoutDay[] } | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Workout type selection
  const [workoutType, setWorkoutType] = useState<"gym" | "home">("gym");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.uid);

      // Fetch user profile
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setProfile({
          age: data.age || 0,
          weight: data.weight || 0,
          height: data.height || 0,
          fitnessLevel: data.fitnessLevel || "beginner",
          goals: data.goals || [],
          experienceLevel: data.experienceLevel || "beginner",
          availableDaysPerWeek: data.availableDaysPerWeek || 3,
          injuries: data.injuries || [],
        });
      }

      // Fetch saved workouts
      const workoutsQuery = query(
        collection(db, "workouts"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts: SavedWorkout[] = [];
      workoutsSnapshot.forEach((doc) => {
        const data = doc.data();
        workouts.push({
          id: doc.id,
          name: data.name || "Workout",
          userId: data.userId,
          type: data.type || "gym",
          plan: data.plan || [],
          createdAt: data.createdAt,
        } as SavedWorkout);
      });
      setSavedWorkouts(workouts);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function generateWorkout() {
    if (!profile || !GEMINI_API_KEY) {
      setError("Missing API key or profile data");
      return;
    }

    setGenerating(true);
    setError("");
    setGeneratedWorkout(null);

    try {
      const goalsText = profile.goals.join(", ");
      const injuriesText = profile.injuries?.length > 0 ? profile.injuries.join(", ") : "None";
      
      const equipmentInstruction = workoutType === "home" 
        ? "IMPORTANT: Only use bodyweight exercises or simple equipment (resistance bands, dumbbells if available). No gym machines."
        : "Use full gym equipment including machines, free weights, cables.";

      const prompt = `Generate a personalized ${workoutType} workout plan based on this user profile:

USER DETAILS:
- Age: ${profile.age}
- Weight: ${profile.weight}kg
- Height: ${profile.height}cm
- Fitness Level: ${profile.fitnessLevel}
- Experience Level: ${profile.experienceLevel}
- Main Goals: ${goalsText}
- Days available per week: ${profile.availableDaysPerWeek}
- Injuries/Limitations: ${injuriesText}

${equipmentInstruction}

Return ONLY valid JSON (no markdown formatting) with this exact structure:
{
  "type": "${workoutType}",
  "duration": "60 minutes",
  "days": [
    {
      "day": "Push",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": 8,
          "rest": "90 seconds"
        }
      ]
    }
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate workout");
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("Empty response from AI");
      }

      // Clean the response - remove markdown code blocks if present
      const cleanJson = generatedText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      setGeneratedWorkout(parsed);
    } catch (err) {
      console.error("Error generating workout:", err);
      setError("Failed to generate workout. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveWorkout() {
    if (!generatedWorkout || !userId) return;

    setSuccess("");
    try {
      await addDoc(collection(db, "workouts"), {
        name: `${workoutType === "gym" ? "Gym" : "Home"} Workout - ${new Date().toLocaleDateString()}`,
        userId: userId,
        type: workoutType,
        plan: generatedWorkout.days,
        createdAt: Timestamp.now(),
      });

      setSuccess("Workout saved successfully!");
      
      // Refresh saved workouts
      const workoutsQuery = query(
        collection(db, "workouts"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts: SavedWorkout[] = [];
      workoutsSnapshot.forEach((doc) => {
        const data = doc.data();
        workouts.push({
          id: doc.id,
          name: data.name || "Workout",
          userId: data.userId,
          type: data.type || "gym",
          plan: data.plan || [],
          createdAt: data.createdAt,
        } as SavedWorkout);
      });
      setSavedWorkouts(workouts);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving workout:", err);
      setError("Failed to save workout");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function formatDate(timestamp: any) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  }

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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t("workout.title")}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t("workout.subtitle")}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
            <p className="text-emerald-600 dark:text-emerald-400">{success}</p>
          </div>
        )}

        {/* Profile Info */}
        {!profile && (
          <div className="card p-4 mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800">
            <p className="text-amber-700 dark:text-amber-400">{t("workout.completeProfile")}</p>
          </div>
        )}

        {/* Generate Workout Section */}
        <div className="card p-6 mb-8 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Generate New Workout</h2>
          
          {/* Workout Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Select workout type
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setWorkoutType("gym")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  workoutType === "gym"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-zinc-900 dark:text-white">Gym Workout</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Full equipment</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setWorkoutType("home")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  workoutType === "home"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-zinc-900 dark:text-white">Home Workout</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Bodyweight only</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateWorkout}
            disabled={generating || !profile}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate {workoutType === "gym" ? "Gym" : "Home"} Workout
              </>
            )}
          </button>
        </div>

        {/* Generated Workout */}
        {generatedWorkout && (
          <div className="card p-6 mb-8 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Your {workoutType === "gym" ? "Gym" : "Home"} Workout</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{generatedWorkout.duration}</p>
              </div>
              <button
                onClick={saveWorkout}
                className="btn-secondary flex items-center gap-2 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedWorkout.days.map((day, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 ${
                    day.exercises.length > 0 ? "bg-zinc-50 dark:bg-zinc-800" : "bg-zinc-100 dark:bg-zinc-800/50"
                  }`}
                >
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">{day.day}</h3>
                  {day.exercises.length > 0 ? (
                    <ul className="space-y-2">
                      {day.exercises.map((exercise, i) => (
                        <li key={i} className="text-sm py-2 border-b border-zinc-100 dark:border-zinc-700 last:border-0">
                          <div className="flex justify-between items-start">
                            <span className="text-zinc-700 dark:text-zinc-200 font-medium">{exercise.name}</span>
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {exercise.sets} × {exercise.reps} · Rest: {exercise.rest || "60s"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Rest day</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Workouts */}
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Saved Workouts</h2>
          {savedWorkouts.length === 0 ? (
            <div className="card p-6 text-center dark:bg-zinc-900">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">No saved workouts yet</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="card p-4 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        workout.type === "gym" 
                          ? "bg-emerald-100 dark:bg-emerald-900/30" 
                          : "bg-blue-100 dark:bg-blue-900/30"
                      }`}>
                        {workout.type === "gym" ? (
                          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-zinc-900 dark:text-white">{workout.name}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {workout.type === "gym" ? "Gym" : "Home"} · {formatDate(workout.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">
                    {workout.plan?.length || 0} workout days
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
