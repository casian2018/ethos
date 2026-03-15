/**
 * Workout Generator - Guided AI workout creation
 * 
 * Flow:
 * 1. Select workout type (Gym/Home/Cardio/Stretching)
 * 2. Select intensity (Low/Medium/High)
 * 3. Select duration (15/20/30/45/60 min)
 * 4. Generate AI workout
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";

const auth = firebaseAuth!;
const db = firebaseDb!;

type WorkoutType = "gym" | "home" | "cardio" | "stretching" | null;
type Intensity = "low" | "medium" | "high" | null;
type Duration = 15 | 20 | 30 | 45 | 60 | null;
type Step = "type" | "intensity" | "duration" | "generating" | "result";

interface UserProfile {
  age?: number;
  height?: number;
  weight?: number;
  experienceLevel?: string;
  goals?: string[];
  trainingEnvironment?: string;
  homeEquipment?: string[];
  daysPerWeek?: number;
  injuries?: string[];
  activityLevel?: string;
}

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  rest?: string;
  muscleGroup?: string;
  tips?: string[];
  mistakes?: string[];
  workInterval?: string;
  restInterval?: string;
  holdTime?: string;
  breathing?: string;
}

interface Workout {
  type: string;
  intensity: string;
  duration: number;
  exercises: Exercise[];
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export default function WorkoutGeneratorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [step, setStep] = useState<Step>("type");
  const [workoutType, setWorkoutType] = useState<WorkoutType>(null);
  const [intensity, setIntensity] = useState<Intensity>(null);
  const [duration, setDuration] = useState<Duration>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // For demo, create a mock user
        setUser({ uid: "demo-user" } as User);
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // Fetch user profile
      try {
        const profileDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTypeSelect = (type: WorkoutType) => {
    setWorkoutType(type);
    setStep("intensity");
  };

  const handleIntensitySelect = (int: Intensity) => {
    setIntensity(int);
    setStep("duration");
  };

  const handleDurationSelect = (dur: Duration) => {
    setDuration(dur);
    generateWorkout();
  };

  const generateWorkout = async () => {
    setStep("generating");

    // Build context from user profile
    const userContext = `
User Profile:
- Experience: ${profile?.experienceLevel || "not set"}
- Goals: ${profile?.goals?.join(", ") || "general fitness"}
- Training: ${profile?.trainingEnvironment || "gym"}
- Equipment: ${profile?.homeEquipment?.join(", ") || "none"}
- Injuries: ${profile?.injuries?.join(", ") || "none"}
- Activity Level: ${profile?.activityLevel || "moderate"}
    `.trim();

    const prompt = `
You are a professional fitness coach. Generate a personalized workout based on:

${userContext}

Workout Requirements:
- Type: ${workoutType}
- Intensity: ${intensity}
- Duration: ${duration} minutes

Return ONLY valid JSON with this exact structure:
{
  "type": "${workoutType}",
  "intensity": "${intensity}",
  "duration": ${duration},
  "exercises": [
    {
      "name": "exercise name",
      "sets": number or null,
      "reps": "string or null" or "duration like 30sec",
      "duration": "string or null",
      "rest": "string like 60sec",
      "muscleGroup": "string",
      "tips": ["tip1", "tip2"],
      "mistakes": ["mistake1", "mistake2"],
      "workInterval": "for cardio only",
      "restInterval": "for cardio only",
      "holdTime": "for stretching only",
      "breathing": "for stretching only"
    }
  ]
}

Rules for each workout type:

GYM: Include compound movements (bench press, squats, deadlifts) and accessories. Use weights.

HOME: Use bodyweight or minimal equipment (push-ups, squats, lunges, planks).

CARDIO: Include work/rest intervals,HIIT circuits, running, jumping rope. Include workInterval and restInterval.

STRETCHING: Focus on mobility, holdTime, breathing instructions for each stretch.

For LOW intensity: 8-10 exercises, shorter holds, more rest.
For MEDIUM intensity: 10-12 exercises, moderate challenge.
For HIGH intensity: 12-15 exercises, minimal rest, challenging.

Make exercises appropriate for the user's injuries: ${profile?.injuries?.join(", ") || "none"}
    `.trim();

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          }
        })
      });

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedWorkout = JSON.parse(jsonMatch[0]);
        setWorkout(parsedWorkout);
      } else {
        // Fallback to demo workout if parsing fails
        setWorkout(generateDemoWorkout());
      }
    } catch (err) {
      console.error("Error generating workout:", err);
      // Use demo workout on error
      setWorkout(generateDemoWorkout());
    }

    setStep("result");
  };

  const generateDemoWorkout = (): Workout => {
    const exercises: Exercise[] = workoutType === "gym" ? [
      { name: "Warm-up", sets: 1, reps: "5 min", rest: "0", muscleGroup: "full body", tips: ["Light jogging", "Dynamic stretching"], mistakes: ["Skipping warm-up"] },
      { name: "Push-ups", sets: 3, reps: "12", rest: "60sec", muscleGroup: "chest, triceps", tips: ["Keep core tight", "Full range of motion"], mistakes: ["Flaring elbows"] },
      { name: "Squats", sets: 3, reps: "15", rest: "60sec", muscleGroup: "quads, glutes", tips: ["Chest up", "Knees over toes"], mistakes: ["Letting knees cave in"] },
      { name: "Dumbbell Rows", sets: 3, reps: "12", rest: "60sec", muscleGroup: "back, biceps", tips: ["Pull to hip", "Keep back flat"], mistakes: ["Using momentum"] },
      { name: "Plank", sets: 3, reps: "30sec", rest: "45sec", muscleGroup: "core", tips: ["Squeeze glutes", "Don't hold breath"], mistakes: ["Holding too high"] },
      { name: "Cool-down", sets: 1, reps: "5 min", rest: "0", muscleGroup: "full body", tips: ["Static stretching"], mistakes: ["Skipping cool-down"] },
    ] : workoutType === "cardio" ? [
      { name: "Jumping Jacks", sets: 4, workInterval: "45sec", restInterval: "15sec", muscleGroup: "full body", tips: ["Land softly", "Keep arms straight"], mistakes: ["Heavy landing"] },
      { name: "High Knees", sets: 4, workInterval: "30sec", restInterval: "15sec", muscleGroup: "legs, cardio", tips: ["Drive knees high", "Pump arms"], mistakes: ["Slouching"] },
      { name: "Burpees", sets: 4, workInterval: "30sec", restInterval: "15sec", muscleGroup: "full body", tips: ["Modify if needed", "Keep pace"], mistakes: ["Rushing form"] },
      { name: "Mountain Climbers", sets: 4, workInterval: "30sec", restInterval: "15sec", muscleGroup: "core, cardio", tips: ["Core engaged", "Alternating fast"], mistakes: ["Hips too high"] },
      { name: "Jump Rope", sets: 4, workInterval: "45sec", restInterval: "15sec", muscleGroup: "full body", tips: ["Light on feet", " wrists only"], mistakes: ["Jumping too high"] },
    ] : [
      { name: "Cat-Cow Stretch", sets: 2, reps: "10", holdTime: "5 breaths", muscleGroup: "spine", tips: ["Move with breath", "Full extension"], mistakes: ["Rushing"] },
      { name: "Hip Flexor Stretch", sets: 2, reps: "each side", holdTime: "30sec", muscleGroup: "hips", tips: ["Push hips forward", "Keep torso tall"], mistakes: ["Leaning forward"] },
      { name: "Hamstring Stretch", sets: 2, reps: "each side", holdTime: "30sec", muscleGroup: "hamstrings", tips: ["Flex foot", "Reach for toes"], mistakes: ["Bouncing"] },
      { name: "Child's Pose", sets: 2, reps: "60sec", holdTime: "60sec", muscleGroup: "back, hips", tips: ["Breathe deeply", "Relax shoulders"], mistakes: ["Rushing"] },
      { name: "Shoulder Circles", sets: 2, reps: "10 each direction", muscleGroup: "shoulders", tips: ["Slow controlled", "Full range"], mistakes: ["Going too fast"] },
    ];

    return {
      type: workoutType || "gym",
      intensity: intensity || "medium",
      duration: duration || 30,
      exercises
    };
  };

  const saveWorkout = async () => {
    if (!user || !workout) return;
    setSaving(true);

    try {
      await addDoc(collection(db, "workouts"), {
        userId: user.uid,
        workoutType: workout.type,
        intensity: workout.intensity,
        duration: workout.duration,
        exercises: workout.exercises,
        createdAt: new Date(),
      });
      alert("Workout saved!");
    } catch (err) {
      console.error("Error saving workout:", err);
    } finally {
      setSaving(false);
    }
  };

  const startWorkout = async () => {
    if (!user || !workout) return;
    setSaving(true);

    try {
      // Create workout session
      const sessionRef = await addDoc(collection(db, "workout_sessions"), {
        userId: user.uid,
        workoutName: `${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} Workout`,
        workoutType: workout.type,
        date: new Date().toISOString(),
        startTime: serverTimestamp(),
        status: "active",
        source: "generated",
      });

      // Add exercises to session
      for (const exercise of workout.exercises) {
        const restSeconds = exercise.rest ? parseInt(exercise.rest.replace("sec", "")) : 60;
        const exerciseData = {
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup || "",
          targetSets: exercise.sets || 3,
          targetReps: exercise.reps || "10",
          restTime: isNaN(restSeconds) ? 60 : restSeconds,
        };
        await addDoc(collection(db, `workout_sessions/${sessionRef.id}/exercises`), exerciseData);
      }

      // Redirect to session
      router.push(`/train/session/${sessionRef.id}`);
    } catch (err) {
      console.error("Error starting workout:", err);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep("type");
    setWorkoutType(null);
    setIntensity(null);
    setDuration(null);
    setWorkout(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-8">
        <Link href="/train" className="text-zinc-500 dark:text-zinc-400 mb-2 inline-flex items-center gap-1">
          ← Back to Train
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
          Workout Generator
        </h1>
      </header>

      {/* Progress Indicator */}
      {step !== "generating" && step !== "result" && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {["type", "intensity", "duration"].map((s) => {
            const stepOrder = ["type", "intensity", "duration"];
            const isActive = step === s;
            const isPast = stepOrder.indexOf(step) > stepOrder.indexOf(s);
            return (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  isActive || isPast ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Step 1: Workout Type Selection */}
      {step === "type" && (
        <div className="card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6 text-center">
            What type of workout?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleTypeSelect("gym")}
              className="card-hover p-6 flex flex-col items-center gap-3 text-center"
            >
              <span className="text-4xl">🏋️</span>
              <span className="font-medium text-zinc-900 dark:text-white">Gym</span>
              <span className="text-sm text-zinc-500">Weights & machines</span>
            </button>
            <button
              onClick={() => handleTypeSelect("home")}
              className="card-hover p-6 flex flex-col items-center gap-3 text-center"
            >
              <span className="text-4xl">🏠</span>
              <span className="font-medium text-zinc-900 dark:text-white">Home</span>
              <span className="text-sm text-zinc-500">Bodyweight</span>
            </button>
            <button
              onClick={() => handleTypeSelect("cardio")}
              className="card-hover p-6 flex flex-col items-center gap-3 text-center"
            >
              <span className="text-4xl">🏃</span>
              <span className="font-medium text-zinc-900 dark:text-white">Cardio</span>
              <span className="text-sm text-zinc-500">HIIT & endurance</span>
            </button>
            <button
              onClick={() => handleTypeSelect("stretching")}
              className="card-hover p-6 flex flex-col items-center gap-3 text-center"
            >
              <span className="text-4xl">🧘</span>
              <span className="font-medium text-zinc-900 dark:text-white">Stretching</span>
              <span className="text-sm text-zinc-500">Mobility & recovery</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Intensity Selection */}
      {step === "intensity" && (
        <div className="card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6 text-center">
            What&apos;s your intensity level?
          </h2>
          <div className="space-y-3">
            {[
              { value: "low", label: "Low", emoji: "😌", desc: "Recovery or beginner session" },
              { value: "medium", label: "Medium", emoji: "💪", desc: "Balanced training" },
              { value: "high", label: "High", emoji: "🔥", desc: "Challenging workout" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleIntensitySelect(option.value as Intensity)}
                className="card-hover w-full p-4 flex items-center gap-4 text-left"
              >
                <span className="text-2xl">{option.emoji}</span>
                <div>
                  <span className="font-medium text-zinc-900 dark:text-white">{option.label}</span>
                  <p className="text-sm text-zinc-500">{option.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Duration Selection */}
      {step === "duration" && (
        <div className="card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6 text-center">
            How much time do you have?
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 15, label: "15 min" },
              { value: 20, label: "20 min" },
              { value: 30, label: "30 min" },
              { value: 45, label: "45 min" },
              { value: 60, label: "60 min" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleDurationSelect(option.value as Duration)}
                className="card-hover p-4 text-center font-medium text-zinc-900 dark:text-white"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Generating */}
      {step === "generating" && (
        <div className="card p-12 text-center animate-fade-in">
          <div className="text-5xl mb-6 animate-bounce">✨</div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Generating your personalized workout
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Creating a plan tailored to your profile...
          </p>
        </div>
      )}

      {/* Step 5: Result */}
      {step === "result" && workout && (
        <div className="animate-fade-in">
          {/* Workout Summary */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Your {workout.duration}-minute {workout.intensity} intensity {workout.type} workout
              </h2>
              <button
                onClick={reset}
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                Start over
              </button>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              {workout.exercises.map((exercise, i) => (
                <div
                  key={i}
                  className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {exercise.name}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {exercise.sets ? `${exercise.sets} × ` : ""}
                      {exercise.reps || exercise.duration || exercise.workInterval || exercise.holdTime || ""}
                      {exercise.rest ? ` rest ${exercise.rest}` : ""}
                    </span>
                  </div>
                  
                  {exercise.muscleGroup && (
                    <span className="badge badge-primary text-xs">
                      {exercise.muscleGroup}
                    </span>
                  )}

                  {exercise.tips && exercise.tips.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tips:</p>
                      <ul className="text-xs text-zinc-500 space-y-1">
                        {exercise.tips.map((tip, j) => (
                          <li key={j}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exercise.mistakes && exercise.mistakes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Common mistakes:</p>
                      <ul className="text-xs text-zinc-500">
                        {exercise.mistakes.map((mistake, j) => (
                          <li key={j}>• {mistake}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button 
              onClick={startWorkout}
              disabled={saving}
              className="btn-primary flex-1 py-3"
            >
              {saving ? "Starting..." : "Start Workout"}
            </button>
            <button 
              onClick={saveWorkout}
              disabled={saving}
              className="btn-secondary flex-1 py-3"
            >
              {saving ? "Saving..." : "Save Workout"}
            </button>
          </div>

          <button
            onClick={generateWorkout}
            className="w-full mt-4 text-center text-emerald-600 dark:text-emerald-400 font-medium"
          >
            Generate another workout →
          </button>
        </div>
      )}
    </div>
  );
}
