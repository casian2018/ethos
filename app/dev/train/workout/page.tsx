"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import {
  getProfileHeadline,
  profileNeedsOnboarding,
  type DetailedUserProfile,
} from "@/lib/profile";

const auth = firebaseAuth!;
const db = firebaseDb!;

type WorkoutType = "gym" | "home" | "cardio" | "stretching" | null;
type Intensity = "low" | "medium" | "high" | null;
type Duration = 15 | 20 | 30 | 45 | 60 | null;
type Step = "type" | "intensity" | "duration" | "generating" | "result";

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

function getFallbackExercises(profile: DetailedUserProfile, workoutType: WorkoutType): Exercise[] {
  const lowImpact = profile.medicalConditions.includes("joint-problems") || profile.medicalConditions.includes("back-pain");
  const hasBands = profile.homeEquipment.includes("resistance-bands");
  const hasDumbbells = profile.homeEquipment.includes("dumbbells");

  if (workoutType === "cardio") {
    return lowImpact
      ? [
          { name: "Brisk Walk", sets: 4, workInterval: "4 min", restInterval: "1 min", muscleGroup: "cardio", tips: ["Keep a sustainable pace"], mistakes: ["Starting too fast"] },
          { name: "Step Touch", sets: 4, workInterval: "45sec", restInterval: "15sec", muscleGroup: "legs", tips: ["Stay light on feet"], mistakes: ["Twisting the knees"] },
          { name: "Shadow Boxing", sets: 4, workInterval: "45sec", restInterval: "20sec", muscleGroup: "upper body", tips: ["Keep core active"], mistakes: ["Locking the elbows"] },
          { name: "Marching Knees", sets: 4, workInterval: "45sec", restInterval: "15sec", muscleGroup: "full body", tips: ["Drive knees smoothly"], mistakes: ["Leaning back"] },
        ]
      : [
          { name: "Jumping Jacks", sets: 4, workInterval: "45sec", restInterval: "15sec", muscleGroup: "full body", tips: ["Land softly"], mistakes: ["Heavy landing"] },
          { name: "High Knees", sets: 4, workInterval: "30sec", restInterval: "15sec", muscleGroup: "legs", tips: ["Pump your arms"], mistakes: ["Slouching"] },
          { name: "Burpees", sets: 4, workInterval: "30sec", restInterval: "20sec", muscleGroup: "full body", tips: ["Control the landing"], mistakes: ["Rushing the push-up"] },
          { name: "Mountain Climbers", sets: 4, workInterval: "35sec", restInterval: "15sec", muscleGroup: "core", tips: ["Keep shoulders stacked"], mistakes: ["Hips too high"] },
        ];
  }

  if (workoutType === "stretching") {
    return [
      { name: "Cat-Cow Stretch", sets: 2, reps: "10", holdTime: "5 breaths", muscleGroup: "spine", tips: ["Move with breath"], mistakes: ["Rushing"] },
      { name: "Hip Flexor Stretch", sets: 2, reps: "each side", holdTime: "30sec", muscleGroup: "hips", tips: ["Stay tall"], mistakes: ["Arching lower back"] },
      { name: "Hamstring Stretch", sets: 2, reps: "each side", holdTime: "30sec", muscleGroup: "hamstrings", tips: ["Lengthen spine"], mistakes: ["Bouncing"] },
      { name: "Thoracic Rotation", sets: 2, reps: "8 each side", holdTime: "2 breaths", muscleGroup: "upper back", tips: ["Move slowly"], mistakes: ["Forcing the range"] },
      { name: "Child's Pose", sets: 2, reps: "60sec", holdTime: "60sec", muscleGroup: "back", tips: ["Relax shoulders"], mistakes: ["Holding breath"] },
    ];
  }

  if (workoutType === "home") {
    const rowsName = hasBands ? "Resistance Band Rows" : hasDumbbells ? "Single Arm Dumbbell Rows" : "Back Widows";

    return [
      { name: "Warm-up Flow", sets: 1, reps: "5 min", rest: "0", muscleGroup: "full body", tips: ["Mobilize shoulders and hips"], mistakes: ["Skipping warm-up"] },
      { name: lowImpact ? "Box Squats" : "Bodyweight Squats", sets: 3, reps: "12", rest: "45sec", muscleGroup: "legs", tips: ["Keep chest proud"], mistakes: ["Knees collapsing inward"] },
      { name: "Push-ups", sets: 3, reps: lowImpact ? "8-10" : "10-15", rest: "45sec", muscleGroup: "chest", tips: ["Brace core"], mistakes: ["Hips sagging"] },
      { name: rowsName, sets: 3, reps: "12", rest: "45sec", muscleGroup: "back", tips: ["Lead with elbow"], mistakes: ["Shrugging shoulders"] },
      { name: "Glute Bridge", sets: 3, reps: "15", rest: "30sec", muscleGroup: "glutes", tips: ["Squeeze at top"], mistakes: ["Overextending back"] },
      { name: "Dead Bug", sets: 3, reps: "10 each side", rest: "30sec", muscleGroup: "core", tips: ["Keep lower back planted"], mistakes: ["Moving too fast"] },
    ];
  }

  return [
    { name: "Dynamic Warm-up", sets: 1, reps: "5 min", rest: "0", muscleGroup: "full body", tips: ["Prime the main lifts"], mistakes: ["Going heavy too soon"] },
    { name: lowImpact ? "Goblet Box Squat" : "Barbell Back Squat", sets: 4, reps: "6-8", rest: "90sec", muscleGroup: "legs", tips: ["Drive through full foot"], mistakes: ["Collapsing chest"] },
    { name: hasDumbbells ? "Dumbbell Bench Press" : "Bench Press", sets: 4, reps: "6-10", rest: "90sec", muscleGroup: "chest", tips: ["Control the eccentric"], mistakes: ["Bouncing the bar"] },
    { name: "Romanian Deadlift", sets: 3, reps: "8-10", rest: "75sec", muscleGroup: "posterior chain", tips: ["Hinge from hips"], mistakes: ["Rounding the back"] },
    { name: "Seated Cable Row", sets: 3, reps: "10-12", rest: "60sec", muscleGroup: "back", tips: ["Pull elbows back"], mistakes: ["Using momentum"] },
    { name: "Pallof Press", sets: 3, reps: "10 each side", rest: "45sec", muscleGroup: "core", tips: ["Stay square"], mistakes: ["Rotating torso"] },
  ];
}

export default function WorkoutGeneratorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DetailedUserProfile | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
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
        router.replace("/auth");
        return;
      }

      setUser(currentUser);

      try {
        const profileDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!profileDoc.exists()) {
          setNeedsProfile(true);
        } else {
          const data = profileDoc.data() as DetailedUserProfile;
          if (profileNeedsOnboarding(data)) {
            setNeedsProfile(true);
          } else {
            setProfile(data);
          }
        }
      } catch (err) {
        console.error("Error loading detailed profile:", err);
        setNeedsProfile(true);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleTypeSelect = (type: WorkoutType) => {
    setWorkoutType(type);
    setStep("intensity");
  };

  const handleIntensitySelect = (selectedIntensity: Intensity) => {
    setIntensity(selectedIntensity);
    setStep("duration");
  };

  const handleDurationSelect = (selectedDuration: Duration) => {
    setDuration(selectedDuration);
    void generateWorkout(selectedDuration);
  };

  const generateWorkout = async (selectedDuration = duration) => {
    if (!profile || !workoutType || !intensity || !selectedDuration) {
      return;
    }

    setStep("generating");
    try {
      const response = await fetch("/api/workout/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          workoutType,
          intensity,
          duration: selectedDuration,
        }),
      });

      const payload = (await response.json()) as {
        workout?: Workout;
        error?: string;
      };

      if (!response.ok || !payload.workout) {
        throw new Error(payload.error || "Failed to generate workout.");
      }

      setWorkout(payload.workout);
    } catch (err) {
      console.error("Error generating workout:", err);
      setWorkout({
        type: workoutType,
        intensity,
        duration: selectedDuration,
        exercises: getFallbackExercises(profile, workoutType),
      });
    }

    setStep("result");
  };

  const saveWorkout = async () => {
    if (!user || !workout || !profile) {
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "workouts"), {
        userId: user.uid,
        workoutType: workout.type,
        intensity: workout.intensity,
        duration: workout.duration,
        exercises: workout.exercises,
        profileSnapshot: {
          goals: profile.goals,
          priorityGoal: profile.priorityGoal,
          medicalConditions: profile.medicalConditions,
          injuries: profile.injuries,
          experienceLevel: profile.experienceLevel,
        },
        createdAt: new Date(),
      });
      alert("Workout saved.");
    } catch (err) {
      console.error("Error saving workout:", err);
    } finally {
      setSaving(false);
    }
  };

  const startWorkout = async () => {
    if (!user || !workout) {
      return;
    }

    setSaving(true);

    try {
      const sessionRef = await addDoc(collection(db, "workout_sessions"), {
        userId: user.uid,
        workoutName: `${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} workout`,
        workoutType: workout.type,
        date: new Date().toISOString(),
        startTime: serverTimestamp(),
        status: "active",
        source: "generated",
      });

      for (const exercise of workout.exercises) {
        const restSeconds = exercise.rest ? parseInt(exercise.rest.replace("sec", ""), 10) : 60;
        await addDoc(collection(db, `workout_sessions/${sessionRef.id}/exercises`), {
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup || "",
          targetSets: exercise.sets || 3,
          targetReps: exercise.reps || exercise.duration || "10",
          restTime: Number.isNaN(restSeconds) ? 60 : restSeconds,
        });
      }

      router.push(`/dev/train/session/${sessionRef.id}`);
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (needsProfile || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Workout generator</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Completează profilul detaliat mai întâi</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Generatorul citește acum obiectivele, echipamentul, condițiile medicale, somnul și nivelul de stres. Fără profil complet nu are context valid.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/dev/profile/setup"
              className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Completează profilul
            </Link>
            <Link
              href="/dev/profile"
              className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Vezi profilul
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-8">
        <Link href="/dev/train" className="inline-flex items-center gap-1 text-sm text-slate-500">
          ← Back to Train
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Workout Generator</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Personalized for {getProfileHeadline(profile)} using your detailed profile, goals, recovery, and constraints.
        </p>
      </header>

      {step !== "generating" && step !== "result" && (
        <div className="mb-8 flex items-center justify-center gap-2">
          {["type", "intensity", "duration"].map((value) => {
            const stepsOrder = ["type", "intensity", "duration"];
            const isActive = step === value;
            const isPast = stepsOrder.indexOf(step) > stepsOrder.indexOf(value);

            return (
              <div
                key={value}
                className={`h-3 w-3 rounded-full transition-colors ${
                  isActive || isPast ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            );
          })}
        </div>
      )}

      {step === "type" && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
          <h2 className="mb-6 text-center text-lg font-semibold text-slate-900">What type of workout?</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "gym", emoji: "🏋️", label: "Gym", description: "Weights & machines" },
              { value: "home", emoji: "🏠", label: "Home", description: "Bodyweight or home equipment" },
              { value: "cardio", emoji: "🏃", label: "Cardio", description: "Intervals & endurance" },
              { value: "stretching", emoji: "🧘", label: "Stretching", description: "Mobility & recovery" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleTypeSelect(option.value as WorkoutType)}
                className="rounded-3xl border border-slate-200 p-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="text-4xl">{option.emoji}</span>
                <p className="mt-3 font-semibold text-slate-900">{option.label}</p>
                <p className="mt-1 text-sm text-slate-500">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "intensity" && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
          <h2 className="mb-6 text-center text-lg font-semibold text-slate-900">What&apos;s your intensity level?</h2>
          <div className="space-y-3">
            {[
              { value: "low", label: "Low", emoji: "😌", description: "Recovery or low fatigue day" },
              { value: "medium", label: "Medium", emoji: "💪", description: "Balanced progress" },
              { value: "high", label: "High", emoji: "🔥", description: "Hard but still profile-aware" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleIntensitySelect(option.value as Intensity)}
                className="flex w-full items-center gap-4 rounded-3xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="text-2xl">{option.emoji}</span>
                <div>
                  <span className="font-semibold text-slate-900">{option.label}</span>
                  <p className="text-sm text-slate-500">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "duration" && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
          <h2 className="mb-6 text-center text-lg font-semibold text-slate-900">How much time do you have?</h2>
          <div className="grid grid-cols-3 gap-3">
            {[15, 20, 30, 45, 60].map((option) => (
              <button
                key={option}
                onClick={() => handleDurationSelect(option as Duration)}
                className="rounded-2xl border border-slate-200 p-4 text-center font-semibold text-slate-900 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                {option} min
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "generating" && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-lg shadow-slate-200/40">
          <div className="mb-6 text-5xl">✨</div>
          <h2 className="text-xl font-semibold text-slate-900">Generating your personalized workout</h2>
          <p className="mt-2 text-slate-500">
            Using your equipment, injuries, recovery state, and performance goals...
          </p>
        </div>
      )}

      {step === "result" && workout && (
        <div>
          <div className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Your {workout.duration}-minute {workout.intensity} intensity {workout.type} workout
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Built from your detailed profile context.
                </p>
              </div>
              <button onClick={reset} className="text-sm font-medium text-slate-500 hover:text-slate-700">
                Start over
              </button>
            </div>

            <div className="space-y-3">
              {workout.exercises.map((exercise, index) => (
                <div key={index} className="rounded-3xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{exercise.name}</span>
                    <span className="text-sm text-slate-500">
                      {exercise.sets ? `${exercise.sets} × ` : ""}
                      {exercise.reps || exercise.duration || exercise.workInterval || exercise.holdTime || ""}
                      {exercise.rest ? ` • rest ${exercise.rest}` : ""}
                    </span>
                  </div>

                  {exercise.muscleGroup && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      {exercise.muscleGroup}
                    </span>
                  )}

                  {exercise.tips && exercise.tips.length > 0 && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Tips</p>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {exercise.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exercise.mistakes && exercise.mistakes.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-500">Common mistakes</p>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {exercise.mistakes.map((mistake, mistakeIndex) => (
                          <li key={mistakeIndex}>• {mistake}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={startWorkout}
              disabled={saving}
              className="flex-1 rounded-2xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
            >
              {saving ? "Starting..." : "Start Workout"}
            </button>
            <button
              onClick={saveWorkout}
              disabled={saving}
              className="flex-1 rounded-2xl border border-slate-200 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:bg-slate-100"
            >
              {saving ? "Saving..." : "Save Workout"}
            </button>
          </div>

          <button
            onClick={() => void generateWorkout()}
            className="mt-4 w-full text-center font-medium text-emerald-600"
          >
            Generate another workout →
          </button>
        </div>
      )}
    </div>
  );
}
