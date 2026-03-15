/**
 * Create Your Own Workout - Modern Redesigned
 * 
 * Features:
 * - Beautiful card-based UI
 * - Visual workout type selection
 * - Drag-and-drop style exercise list
 * - Quick duration selector
 * - Modern form elements
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const auth = firebaseAuth;
const db = firebaseDb;

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number | null; // null means no weight (reps only)
  rest: string;
  hasWeight: boolean; // toggle for weight exercises
}

const workoutTypes = [
  { value: "strength", labelRo: "Forță", labelEn: "Strength", emoji: "💪", gradient: "from-orange-500 to-red-500" },
  { value: "cardio", labelRo: "Cardio", labelEn: "Cardio", emoji: "🏃", gradient: "from-blue-500 to-cyan-500" },
  { value: "hiit", labelRo: "HIIT", labelEn: "HIIT", emoji: "⚡", gradient: "from-yellow-500 to-orange-500" },
  { value: "yoga", labelRo: "Yoga", labelEn: "Yoga", emoji: "🧘", gradient: "from-purple-500 to-pink-500" },
  { value: "stretching", labelRo: "Stretching", labelEn: "Stretching", emoji: "🤸", gradient: "from-green-500 to-emerald-500" },
];

const durationPresets = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h 30" },
  { value: 120, label: "2h" },
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
  const [hasWeight, setHasWeight] = useState(false); // Toggle for weight exercises

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
      weight: hasWeight && newExerciseWeight > 0 ? newExerciseWeight : null,
      rest: newExerciseRest,
      hasWeight: hasWeight,
    };

    setExercises([...exercises, newExercise]);
    
    // Reset form
    setNewExerciseName("");
    setNewExerciseSets(3);
    setNewExerciseReps(10);
    setNewExerciseWeight(0);
    setNewExerciseRest("60s");
    setHasWeight(false);
    setError("");
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const getTypeGradient = (type: string) => {
    return workoutTypes.find(t => t.value === type)?.gradient || "from-gray-500 to-gray-600";
  };

  const getTypeEmoji = (type: string) => {
    return workoutTypes.find(t => t.value === type)?.emoji || "🏋️";
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

      setSuccess(language === "ro" ? "Antrenament salvat cu succes! 🎉" : "Workout saved successfully! 🎉");
      
      setTimeout(() => {
        router.push("/dev/train/history");
      }, 2000);
    } catch (err) {
      console.error("Error saving workout:", err);
      setError(language === "ro" ? "Eroare la salvare. Încearcă din nou." : "Error saving. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/dev/train")}
          className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {language === "ro" ? "Creează Antrenament" : "Create Workout"}
          </h1>
          <p className="text-slate-500">
            {language === "ro" ? "Design antrenamentul perfect" : "Design the perfect workout"}
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <span className="text-xl">✅</span>
          <p className="text-emerald-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workout Type Selection - Big Cards */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {language === "ro" ? "Tip Antrenament" : "Workout Type"}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {workoutTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setWorkoutType(type.value)}
                className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                  workoutType === type.value
                    ? "ring-2 ring-offset-2 ring-emerald-500 scale-105"
                    : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-10`} />
                <div className="relative">
                  <div className="text-3xl mb-1">{type.emoji}</div>
                  <div className="text-sm font-medium text-slate-900">
                    {language === "ro" ? type.labelRo : type.labelEn}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Workout Name */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {language === "ro" ? "Nume Antrenament" : "Workout Name"}
          </label>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder={language === "ro" ? "Ex: Antrenament Picioare" : "Ex: Leg Day"}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg font-medium"
          />
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {language === "ro" ? "Durată estimată" : "Estimated Duration"}
          </label>
          <div className="flex flex-wrap gap-2">
            {durationPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setDuration(preset.value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  duration === preset.value
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {language === "ro" ? "Exerciții" : "Exercises"}
                </h2>
                <p className="text-sm text-slate-500">
                  {exercises.length} {language === "ro" ? "exerciții adăugate" : "exercises added"}
                </p>
              </div>
              {exercises.length > 0 && (
                <div className="text-2xl font-bold text-emerald-500">
                  {exercises.reduce((acc, e) => acc + e.sets * e.reps, 0)} reps
                </div>
              )}
            </div>
          </div>

          {/* Exercise List */}
          {exercises.length > 0 && (
            <div className="p-6 pt-0 space-y-3">
              {exercises.map((exercise, index) => (
                <div 
                  key={exercise.id} 
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{exercise.name}</div>
                    <div className="text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{exercise.sets} seturi</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{exercise.reps} reps</span>
                        {exercise.hasWeight && exercise.weight && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{exercise.weight}kg</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(exercise.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Exercise Form */}
          <div className="p-6 bg-slate-50">
            {/* Weight Toggle */}
            <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏋️</span>
                <span className="text-sm font-medium text-slate-700">
                  {language === "ro" ? "Exercițiu cu greutăți?" : "Exercise with weights?"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHasWeight(!hasWeight)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  hasWeight ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  hasWeight ? "left-7" : "left-1"
                }`} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder={language === "ro" ? "Nume exercițiu..." : "Exercise name..."}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              
              <div className={`grid gap-3 ${hasWeight ? "grid-cols-4" : "grid-cols-3"}`}>
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <label className="block text-xs text-slate-500 mb-1">{language === "ro" ? "Seturi" : "Sets"}</label>
                  <input
                    type="number"
                    value={newExerciseSets}
                    onChange={(e) => setNewExerciseSets(parseInt(e.target.value) || 0)}
                    className="w-full text-center font-semibold text-slate-900 bg-transparent"
                  />
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <label className="block text-xs text-slate-500 mb-1">{language === "ro" ? "Reps" : "Reps"}</label>
                  <input
                    type="number"
                    value={newExerciseReps}
                    onChange={(e) => setNewExerciseReps(parseInt(e.target.value) || 0)}
                    className="w-full text-center font-semibold text-slate-900 bg-transparent"
                  />
                </div>
                {hasWeight && (
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <label className="block text-xs text-slate-500 mb-1">Kg</label>
                    <input
                      type="number"
                      value={newExerciseWeight}
                      onChange={(e) => setNewExerciseWeight(parseInt(e.target.value) || 0)}
                      className="w-full text-center font-semibold text-slate-900 bg-transparent"
                    />
                  </div>
                )}
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <label className="block text-xs text-slate-500 mb-1">{language === "ro" ? "Pauză" : "Rest"}</label>
                  <input
                    type="text"
                    value={newExerciseRest}
                    onChange={(e) => setNewExerciseRest(e.target.value)}
                    className="w-full text-center font-semibold text-slate-900 bg-transparent"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={addExercise}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                {language === "ro" ? "Adaugă Exercițiu" : "Add Exercise"}
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {language === "ro" ? "Notițe (opțional)" : "Notes (optional)"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={language === "ro" ? "Adaugă notițe despre antrenament..." : "Add notes about the workout..."}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 text-lg font-bold rounded-2xl transition-all flex items-center justify-center gap-3 ${
            loading 
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
              {language === "ro" ? "Se salvează..." : "Saving..."}
            </>
          ) : (
            <>
              <span className="text-2xl">💾</span>
              {language === "ro" ? "Salvează Antrenamentul" : "Save Workout"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
