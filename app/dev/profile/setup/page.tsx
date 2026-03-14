/**
 * Profile Setup - Comprehensive 9-step onboarding questionnaire
 * 
 * This creates a detailed user profile for personalized workout generation.
 * Each step collects specific data needed for AI workout planning.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import { calculateAge, calculateBMI } from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

interface UserProfileData {
  // Step 1: Birth Date (replaces age)
  birthDate: string;
  gender: string;
  height: string;
  weight: string;
  
  // Step 2: Medical Conditions
  medicalConditions: string[];
  
  // Step 3: Fitness Experience
  experienceLevel: string;
  trainsRegularly: boolean;
  
  // Step 4: Preferred Sports
  preferredSports: string[];
  
  // Step 5: Primary Goals
  goals: string[];
  priorityGoal: string;
  
  // Step 6: Training Environment
  trainingEnvironment: string;
  homeEquipment: string[];
  
  // Step 7: Available Training Time
  daysPerWeek: number;
  workoutDuration: number;
  
  // Step 8: Fitness Limitations
  injuries: string[];
  
  // Step 9: Physical Condition
  activityLevel: string;
  
  // Step 10: Lifestyle Factors
  sleepHours: number;
  stressLevel: string;
  dailySteps: number;
  
  // Step 11: Motivation Style
  motivationType: string;
  
  // Profile basics
  city: string;
  lookingForBuddy: boolean;
}

const TOTAL_STEPS = 11;

export default function ProfileSetupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserProfileData>({
    birthDate: "",
    gender: "",
    height: "",
    weight: "",
    medicalConditions: [],
    experienceLevel: "",
    trainsRegularly: false,
    preferredSports: [],
    goals: [],
    priorityGoal: "",
    trainingEnvironment: "",
    homeEquipment: [],
    daysPerWeek: 3,
    workoutDuration: 30,
    injuries: [],
    activityLevel: "",
    sleepHours: 7,
    stressLevel: "moderate",
    dailySteps: 5000,
    motivationType: "",
    city: "",
    lookingForBuddy: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const updateField = <K extends keyof UserProfileData>(field: K, value: UserProfileData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof UserProfileData, item: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateField(field, updated);
  };

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep((step + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.birthDate && formData.gender && formData.height && formData.weight;
      case 2: return formData.medicalConditions.length > 0;
      case 3: return formData.experienceLevel;
      case 4: return formData.preferredSports.length > 0;
      case 5: return formData.goals.length > 0 && formData.priorityGoal;
      case 6: return formData.trainingEnvironment;
      case 7: return formData.daysPerWeek && formData.workoutDuration;
      case 8: return true; // Injuries are optional
      case 9: return formData.activityLevel;
      case 10: return formData.sleepHours && formData.stressLevel;
      case 11: return formData.motivationType;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSaving(true);
    
    try {
      // Calculate derived fields
      const height = parseInt(formData.height);
      const weight = parseInt(formData.weight);
      const bmi = calculateBMI(height, weight);
      const age = calculateAge(formData.birthDate);
      
      await setDoc(doc(db, "users", userId), {
        ...formData,
        // Store birthDate as-is
        birthDate: formData.birthDate,
        // Also store calculated age for easier queries
        age,
        bmi,
        height,
        weight,
        daysPerWeek: parseInt(formData.daysPerWeek.toString()),
        workoutDuration: parseInt(formData.workoutDuration.toString()),
        sleepHours: parseInt(formData.sleepHours.toString()),
        dailySteps: parseInt(formData.dailySteps.toString()),
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingComplete: true,
      }, { merge: true });
      
      router.push("/dev/main");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Cards */}
        <div className="card p-6 animate-fade-in">
          {/* STEP 1: Basic Body Data */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Let's get to know you
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                This helps us create workouts that are safe and effective for your body.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Data Nașterii *
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                    className="input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Vârsta va fi calculată automat din data nașterii
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Gender *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["male", "female", "other"].map((g) => (
                      <button
                        key={g}
                        onClick={() => updateField("gender", g)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.gender === g
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <span className="text-2xl block mb-1">
                          {g === "male" ? "👨" : g === "female" ? "👩" : "🧑"}
                        </span>
                        <span className="text-sm capitalize text-zinc-700 dark:text-zinc-300">
                          {g}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Height (cm) *
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => updateField("height", e.target.value)}
                      className="input"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => updateField("weight", e.target.value)}
                      className="input"
                      placeholder="70"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Medical Conditions */}
          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Stare de Sănătate
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Afecțiunile medicale vor influența tipul de antrenamente recomandate.
              </p>
              
              <div className="space-y-3">
                {[
                  { value: "none", label: "Niciuna", desc: "Nu am nicio afecțiune medicală", emoji: "✅" },
                  { value: "obesity", label: "Obezitate", desc: "Indicele de masă corporală peste 30", emoji: "⚖️" },
                  { value: "anorexia", label: "Anorexie", desc: "Tulburare de alimentație", emoji: "🍽️" },
                  { value: "anemia", label: "Anemie", desc: "Nivel scăzut de fier în sânge", emoji: "🩸" },
                ].map((condition) => (
                  <button
                    key={condition.value}
                    onClick={() => updateField("medicalConditions", [condition.value])}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.medicalConditions.includes(condition.value)
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{condition.emoji}</span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{condition.label}</p>
                        <p className="text-sm text-zinc-500">{condition.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 3: Fitness Experience */}
          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                What's your training experience?
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                This helps us match exercises to your fitness level.
              </p>
              
              <div className="space-y-3">
                {[
                  { value: "beginner", label: "Beginner", desc: "Never trained or less than 6 months", emoji: "🌱" },
                  { value: "intermediate", label: "Intermediate", desc: "6 months to 2 years", emoji: "💪" },
                  { value: "advanced", label: "Advanced", desc: "2+ years of training", emoji: "🏆" },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => updateField("experienceLevel", level.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.experienceLevel === level.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{level.emoji}</span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{level.label}</p>
                        <p className="text-sm text-zinc-500">{level.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.trainsRegularly}
                    onChange={(e) => updateField("trainsRegularly", e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    I currently train regularly
                  </span>
                </label>
              </div>
            </>
          )}

          {/* STEP 3: Primary Goals */}
          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                What are your fitness goals?
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Select all that apply and choose your top priority.
              </p>
              
              <div className="space-y-3 mb-6">
                {[
                  { value: "lose fat", label: "Lose Fat", emoji: "🔥" },
                  { value: "gain muscle", label: "Gain Muscle", emoji: "💪" },
                  { value: "strength", label: "Increase Strength", emoji: "🏋️" },
                  { value: "endurance", label: "Improve Endurance", emoji: "🏃" },
                  { value: "general", label: "General Fitness", emoji: "⚖️" },
                  { value: "athletic", label: "Athletic Performance", emoji: "🎯" },
                ].map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => toggleArrayItem("goals", goal.value)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      formData.goals.includes(goal.value)
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{goal.emoji}</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{goal.label}</span>
                      {formData.goals.includes(goal.value) && (
                        <span className="ml-auto text-emerald-500">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {formData.goals.length > 0 && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Your top priority goal:
                  </p>
                  <select
                    value={formData.priorityGoal}
                    onChange={(e) => updateField("priorityGoal", e.target.value)}
                    className="input"
                  >
                    <option value="">Select priority...</option>
                    {formData.goals.map((g) => (
                      <option key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* STEP 4: Preferred Sports */}
          {step === 4 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Sporturi Preferate
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Selectează sporturile pe care le practici sau ai dori să le încerci.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "gym", label: "Sala", emoji: "🏋️" },
                  { value: "ping_pong", label: "Ping Pong", emoji: "🏓" },
                  { value: "football", label: "Fotbal", emoji: "⚽" },
                  { value: "tennis", label: "Tenis", emoji: "🎾" },
                  { value: "swimming", label: "Înot", emoji: "🏊" },
                  { value: "running", label: "Alergat", emoji: "🏃" },
                  { value: "cycling", label: "Ciclism", emoji: "🚴" },
                  { value: "basketball", label: "Baschet", emoji: "🏀" },
                  { value: "volleyball", label: "Volei", emoji: "🏐" },
                  { value: "yoga", label: "Yoga", emoji: "🧘" },
                  { value: "dancing", label: "Dans", emoji: "💃" },
                  { value: "martial_arts", label: "Arte Marțiale", emoji: "🥋" },
                ].map((sport) => (
                  <button
                    key={sport.value}
                    onClick={() => {
                      const current = formData.preferredSports;
                      if (current.includes(sport.value)) {
                        updateField("preferredSports", current.filter(s => s !== sport.value));
                      } else {
                        updateField("preferredSports", [...current, sport.value]);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.preferredSports.includes(sport.value)
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{sport.emoji}</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {sport.label}
                    </span>
                  </button>
                ))}
              </div>
              
              {formData.preferredSports.length > 0 && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-4 text-center">
                  {formData.preferredSports.length} selectate
                </p>
              )}
            </>
          )}

          {/* STEP 5: Training Environment */}
          {step === 5 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Where do you train?
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                This determines what exercises we can include in your plan.
              </p>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { value: "gym", label: "Gym", emoji: "🏋️" },
                  { value: "home", label: "Home", emoji: "🏠" },
                  { value: "both", label: "Both", emoji: "🔄" },
                ].map((env) => (
                  <button
                    key={env.value}
                    onClick={() => updateField("trainingEnvironment", env.value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.trainingEnvironment === env.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <span className="text-3xl block mb-1">{env.emoji}</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{env.label}</span>
                  </button>
                ))}
              </div>
              
              {formData.trainingEnvironment === "home" && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    What equipment do you have at home?
                  </p>
                  <div className="space-y-2">
                    {[
                      { value: "none", label: "None (bodyweight only)", emoji: "🙂" },
                      { value: "dumbbells", label: "Dumbbells", emoji: "🏋️" },
                      { value: "bands", label: "Resistance Bands", emoji: "➰" },
                      { value: "pullupbar", label: "Pull-up Bar", emoji: "单" },
                      { value: "kettlebell", label: "Kettlebell", emoji: "🔔" },
                    ].map((equip) => (
                      <label key={equip.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.homeEquipment.includes(equip.value)}
                          onChange={() => toggleArrayItem("homeEquipment", equip.value)}
                          className="w-4 h-4 rounded border-zinc-300 text-emerald-600"
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">{equip.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 6: Available Training Time */}
          {step === 6 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                How much time can you commit?
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                We'll design a plan that fits your schedule.
              </p>
              
              <div className="mb-6">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Days per week
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      onClick={() => updateField("daysPerWeek", days)}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        formData.daysPerWeek === days
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {days}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Average workout duration
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 20, label: "20 min" },
                    { value: 30, label: "30 min" },
                    { value: 45, label: "45 min" },
                    { value: 60, label: "60 min" },
                    { value: 90, label: "90 min" },
                  ].map((dur) => (
                    <button
                      key={dur.value}
                      onClick={() => updateField("workoutDuration", dur.value)}
                      className={`p-3 rounded-lg border-2 font-medium transition-all ${
                        formData.workoutDuration === dur.value
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 7: Fitness Limitations */}
          {step === 7 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Any injuries or limitations?
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                This helps us avoid exercises that could cause discomfort or injury.
              </p>
              
              <div className="space-y-2 mb-6">
                {[
                  { value: "none", label: "No injuries or limitations", emoji: "✅" },
                  { value: "back", label: "Back pain", emoji: "🪓" },
                  { value: "knee", label: "Knee issues", emoji: "🦵" },
                  { value: "shoulder", label: "Shoulder problems", emoji: "💪" },
                  { value: "wrist", label: "Wrist/Elbow", emoji: "🤲" },
                  { value: "neck", label: "Neck pain", emoji: "😣" },
                  { value: "hip", label: "Hip issues", emoji: "🦴" },
                  { value: "ankle", label: "Ankle injuries", emoji: "🦶" },
                ].map((injury) => (
                  <button
                    key={injury.value}
                    onClick={() => {
                      if (injury.value === "none") {
                        updateField("injuries", []);
                      } else {
                        toggleArrayItem("injuries", injury.value);
                        // Remove "none" if selecting an injury
                        if (!formData.injuries.includes("none") && formData.injuries.length > 0) {
                          updateField("injuries", formData.injuries.filter(i => i !== "none"));
                        }
                      }
                    }}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      formData.injuries.includes(injury.value)
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{injury.emoji}</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{injury.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 8: Physical Condition */}
          {step === 8 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                What's your current activity level?
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                This helps us gauge your baseline fitness.
              </p>
              
              <div className="space-y-3">
                {[
                  { value: "sedentary", label: "Sedentary", desc: "Little to no exercise, desk job", emoji: "🪑" },
                  { value: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week", emoji: "🚶" },
                  { value: "moderate", label: "Moderately Active", desc: "Exercise 3-5 days/week", emoji: "🏃" },
                  { value: "very", label: "Very Active", desc: "Hard exercise 6-7 days/week", emoji: "🔥" },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => updateField("activityLevel", level.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.activityLevel === level.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{level.emoji}</span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{level.label}</p>
                        <p className="text-sm text-zinc-500">{level.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 9: Lifestyle Factors */}
          {step === 9 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                A few more details
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                These factors help us optimize your training and recovery.
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Average sleep per night
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="4"
                      max="10"
                      value={formData.sleepHours}
                      onChange={(e) => updateField("sleepHours", parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold text-zinc-900 dark:text-white w-16 text-center">
                      {formData.sleepHours}h
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Stress level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["low", "moderate", "high"].map((stress) => (
                      <button
                        key={stress}
                        onClick={() => updateField("stressLevel", stress)}
                        className={`p-3 rounded-lg border-2 capitalize transition-all ${
                          formData.stressLevel === stress
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {stress}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Average daily steps
                  </label>
                  <select
                    value={formData.dailySteps}
                    onChange={(e) => updateField("dailySteps", parseInt(e.target.value))}
                    className="input"
                  >
                    <option value="3000">Less than 5,000</option>
                    <option value="5000">5,000 - 7,500</option>
                    <option value="7500">7,500 - 10,000</option>
                    <option value="10000">10,000+</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* STEP 10: Motivation Style */}
          {step === 10 && (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                What motivates you?
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                We'll tailor your experience to keep you engaged.
              </p>
              
              <div className="space-y-3">
                {[
                  { value: "structured", label: "Structured Programs", desc: "Follow a clear plan step by step", emoji: "📋" },
                  { value: "flexible", label: "Flexible Workouts", desc: "Choose what feels right that day", emoji: "🎨" },
                  { value: "competitive", label: "Competitive Challenges", desc: "Race to beat my personal best", emoji: "🏆" },
                  { value: "social", label: "Training with Buddy", desc: "More fun with friends", emoji: "👥" },
                ].map((mot) => (
                  <button
                    key={mot.value}
                    onClick={() => updateField("motivationType", mot.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.motivationType === mot.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mot.emoji}</span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{mot.label}</p>
                        <p className="text-sm text-zinc-500">{mot.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lookingForBuddy}
                    onChange={(e) => updateField("lookingForBuddy", e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      I'm looking for a workout buddy
                    </span>
                    <p className="text-sm text-zinc-500">
                      Get matched with people in your area
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="btn-secondary flex-1"
              >
                Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="btn-primary flex-1"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || saving}
                className="btn-primary flex-1"
              >
                {saving ? "Saving..." : "Complete Setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
