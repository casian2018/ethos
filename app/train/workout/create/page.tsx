/**
 * Create Your Own Workout - User-defined workout creation
 * 
 * Features:
 * - Add custom exercises
 * - Set sets, reps, weight
 * - Save to Firestore
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const auth = firebaseAuth;
const db = firebaseDb;

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  rest: string;
}

const workoutTypes = [
  { value: "strength", labelRo: "Forță", labelEn: "Strength", emoji: "💪" },
  { value: "cardio", labelRo: "Cardio", labelEn: "Cardio", emoji: "🏃" },
  { value: "hiit", labelRo: "HIIT", labelEn: "HIIT", emoji: "⚡" },
  { value: "yoga", labelRo: "Yoga", labelEn: "Yoga", emoji: "🧘" },
  { value: "stretching", labelRo: "Stretching", labelEn: "Stretching", emoji: "🤸" },
];

export default function CreateWorkoutPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Workout details
  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState("strength");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  
  // New exercise form
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseSets, setNewExerciseSets] = useState(3);
  const [newExerciseReps, setNewExerciseReps] = useState(10);
  const [newExerciseWeight, setNewExerciseWeight] = useState(0);
  const [newExerciseRest, setNewExerciseRest] = useState("60s");

  useEffect(() => {
    if (!auth || !db) {
      setError("Firebase configuration missing");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const addExercise = () => {
    if (!newExerciseName.trim()) {
      setError(language === "ro" ? "Numele exercițiului este obligatoriu" : "Exercise name is required");
      return;
    }

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName,
      sets: newExerciseSets,
      reps: newExerciseReps,
      weight: newExerciseWeight,
      rest: newExerciseRest,
    };

    setExercises([...exercises, newExercise]);
    
    // Reset form
    setNewExerciseName("");
    setNewExerciseSets(3);
    setNewExerciseReps(10);
    setNewExerciseWeight(0);
    setNewExerciseRest("60s");
    setError("");
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !db || !auth) {
      setError("Authentication error. Please refresh and try again.");
      return;
    }

    if (!workoutName.trim()) {
      setError(language === "ro" ? "Numele antrenamentului este obligatoriu" : "Workout name is required");
      return;
    }

    if (exercises.length === 0) {
      setError(language === "ro" ? "Adaugă cel puțin un exercițiu" : "Add at least one exercise");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addDoc(collection(db, "workouts"), {
        userId,
        name: workoutName,
        type: workoutType,
        exercises,
        duration,
        notes,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(language === "ro" ? "Antrenament salvat cu succes!" : "Workout saved successfully!");
      
      // Reset form
      setWorkoutName("");
      setWorkoutType("strength");
      setExercises([]);
      setDuration(60);
      setNotes("");
      
      // Redirect after success
      setTimeout(() => {
        router.push("/train/history");
      }, 1500);
    } catch (err) {
      console.error("Error saving workout:", err);
      setError(language === "ro" ? "Eroare la salvare. Încearcă din nou." : "Error saving. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 text-slate-900">
          {language === "ro" ? "Creează Antrenament" : "Create Workout"}
        </h1>
        <p className="text-zinc-600 text-slate-500 mt-1">
          {language === "ro" 
            ? "Creează propriul antrenament de la zero" 
            : "Create your own workout from scratch"}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600">
            {success}
          </div>
        )}

        {/* Workout Details */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 text-slate-900">
            {language === "ro" ? "Detalii Antrenament" : "Workout Details"}
          </h2>
          
          {/* Workout Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === "ro" ? "Nume Antrenament *" : "Workout Name *"}
            </label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder={language === "ro" ? "Ex: Antrenament Picioare" : "Ex: Leg Day"}
              className="input"
              required
            />
          </div>

          {/* Workout Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === "ro" ? "Tip Antrenament" : "Workout Type"}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {workoutTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setWorkoutType(type.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                    workoutType === type.value
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{type.emoji}</span>
                  <span>{language === "ro" ? type.labelRo : type.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === "ro" ? "Durată (minute)" : "Duration (minutes)"}
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min="5"
              max="300"
              className="input w-32"
            />
          </div>
        </div>

        {/* Exercises */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 text-slate-900">
            {language === "ro" ? "Exerciții" : "Exercises"}
          </h2>
          
          {/* Exercise List */}
          {exercises.length > 0 && (
            <div className="space-y-2 mb-4">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-medium text-slate-900">{exercise.name}</span>
                    <span className="text-sm text-slate-500 ml-2">
                      {exercise.sets} x {exercise.reps} {exercise.weight > 0 ? `@ ${exercise.weight}kg` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(exercise.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Exercise Form */}
          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
            <h3 className="text-sm font-medium text-slate-700">
              {language === "ro" ? "Adaugă Exercițiu" : "Add Exercise"}
            </h3>
            
            <div>
              <input
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder={language === "ro" ? "Nume exercițiu" : "Exercise name"}
                className="input"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Seturi</label>
                <input
                  type="number"
                  value={newExerciseSets}
                  onChange={(e) => setNewExerciseSets(parseInt(e.target.value) || 0)}
                  min="1"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Repetiții</label>
                <input
                  type="number"
                  value={newExerciseReps}
                  onChange={(e) => setNewExerciseReps(parseInt(e.target.value) || 0)}
                  min="1"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Kg</label>
                <input
                  type="number"
                  value={newExerciseWeight}
                  onChange={(e) => setNewExerciseWeight(parseInt(e.target.value) || 0)}
                  min="0"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Pauză</label>
                <input
                  type="text"
                  value={newExerciseRest}
                  onChange={(e) => setNewExerciseRest(e.target.value)}
                  placeholder="60s"
                  className="input"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={addExercise}
              className="btn-secondary w-full"
            >
              + {language === "ro" ? "Adaugă Exercițiu" : "Add Exercise"}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {language === "ro" ? "Notițe (opțional)" : "Notes (optional)"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={language === "ro" ? "Adaugă notițe despre antrenament..." : "Add notes about the workout..."}
            className="input min-h-[80px] resize-none"
            rows={3}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              {language === "ro" ? "Se salvează..." : "Saving..."}
            </span>
          ) : (
            language === "ro" ? "💾 Salvează Antrenamentul" : "💾 Save Workout"
          )}
        </button>
      </form>
    </div>
  );
}
