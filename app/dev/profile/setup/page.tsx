/**
 * Profile Setup - Complete 8-Step Onboarding Wizard
 * 
 * Features:
 * - Multi-step wizard with progress bar
 * - Visual card selection for Gender and Fitness Level
 * - Health & Safety step with medical conditions
 * - i18n support (RO/EN)
 * - Real-time age calculation from birthDate
 * 
 * Steps:
 * 1. Welcome & Introduction
 * 2. Birth Date & Basic Info
 * 3. Gender (Visual cards)
 * 4. Fitness Level (Visual cards)
 * 5. Health & Safety (Medical conditions)
 * 6. City & Location
 * 7. Training Preferences
 * 8. Summary & Completion
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { calculateAge, calculateBMI } from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface UserProfileData {
  birthDate: string;
  gender: string;
  height: string;
  weight: string;
  fitnessLevel: string;
  medicalConditions: string[];
  city: string;
  preferredSports: string[];
  goals: string[];
  daysPerWeek: number;
  workoutDuration: number;
}

const TOTAL_STEPS = 8;

// Gender options with visual cards
const genderOptions = [
  { value: "male", emoji: "👨", labelRo: "Masculin", labelEn: "Male" },
  { value: "female", emoji: "👩", labelRo: "Feminin", labelEn: "Female" },
  { value: "non-binary", emoji: "🧑", labelRo: "Non-binar", labelEn: "Non-binary" },
  { value: "prefer-not-to-say", emoji: "🤐", labelRo: "Prefer să nu spun", labelEn: "Prefer not to say" },
];

// Fitness level options with visual cards
const fitnessOptions = [
  { 
    value: "beginner", 
    emoji: "🌱", 
    labelRo: "Începător", 
    labelEn: "Beginner",
    descRo: "Abia încep cu sportul",
    descEn: "Just starting with fitness"
  },
  { 
    value: "intermediate", 
    emoji: "💪", 
    labelRo: "Intermediar", 
    labelEn: "Intermediate",
    descRo: "Am experiență moderată",
    descEn: "Moderate experience"
  },
  { 
    value: "advanced", 
    emoji: "🔥", 
    labelRo: "Avansat", 
    labelEn: "Advanced",
    descRo: "Sport de performanță",
    descEn: "Competitive athlete"
  },
];

// Medical conditions
const medicalConditionOptions = [
  { value: "none", emoji: "✅", labelRo: "Niciuna", labelEn: "None", descRo: "Nu am afecțiuni medicale", descEn: "No medical conditions" },
  { value: "obesity", emoji: "⚖️", labelRo: "Obezitate", labelEn: "Obesity", descRo: "Indicele de masă corporală peste 30", descEn: "BMI over 30" },
  { value: "anorexia", emoji: "🍽️", labelRo: "Anorexie", labelEn: "Anorexia", descRo: "Tulburare de alimentație", descEn: "Eating disorder" },
  { value: "anemia", emoji: "🩸", labelRo: "Anemie", labelEn: "Anemia", descRo: "Nivel scăzut de fier", descEn: "Low iron levels" },
  { value: "joint-problems", emoji: "🦴", labelRo: "Probleme articulare", labelEn: "Joint Problems", descRo: "Dureri de articulații", descEn: "Joint pain" },
  { value: "hypertension", emoji: "❤️", labelRo: "Hipertensiune", labelEn: "Hypertension", descRo: "Tensiune arterială ridicată", descEn: "High blood pressure" },
  { value: "diabetes", emoji: "💉", labelRo: "Diabet", labelEn: "Diabetes", descRo: "Nivel ridicat de zahăr", descEn: "High blood sugar" },
  { value: "back-pain", emoji: "🪑", labelRo: "Dureri de spate", labelEn: "Back Pain", descRo: "Probleme cu coloana", descEn: "Spine issues" },
  { value: "heart-condition", emoji: "❤️‍🩹", labelRo: "Probleme cardiace", labelEn: "Heart Condition", descRo: "Afecțiuni cardiovasculare", descEn: "Cardiovascular issues" },
  { value: "asthma", emoji: "😮‍💨", labelRo: "Astm", labelEn: "Asthma", descRo: "Probleme respiratorii", descEn: "Respiratory issues" },
];

// Sports options
const sportsOptions = [
  { value: "gym", emoji: "🏋️", labelRo: "Sală de forță", labelEn: "Gym" },
  { value: "running", emoji: "🏃", labelRo: "Alergare", labelEn: "Running" },
  { value: "swimming", emoji: "🏊", labelRo: "Înot", labelEn: "Swimming" },
  { value: "football", emoji: "⚽", labelRo: "Fotbal", labelEn: "Football" },
  { value: "tennis", emoji: "🎾", labelRo: "Tenis", labelEn: "Tennis" },
  { value: "yoga", emoji: "🧘", labelRo: "Yoga", labelEn: "Yoga" },
  { value: "cycling", emoji: "🚴", labelRo: "Ciclism", labelEn: "Cycling" },
  { value: "basketball", emoji: "🏀", labelRo: "Baschet", labelEn: "Basketball" },
];

// Goals options
const goalsOptions = [
  { value: "weight-loss", emoji: "📉", labelRo: "Slăbire", labelEn: "Weight Loss" },
  { value: "muscle-gain", emoji: "💪", labelRo: "Creștere musculară", labelEn: "Muscle Gain" },
  { value: "endurance", emoji: "🏃", labelRo: "Rezistență", labelEn: "Endurance" },
  { value: "flexibility", emoji: "🧘", labelRo: "Flexibilitate", labelEn: "Flexibility" },
  { value: "general-health", emoji: "❤️", labelRo: "Sănătate generală", labelEn: "General Health" },
];

// Cities
const cities = [
  { value: "bucharest", labelRo: "București", labelEn: "Bucharest" },
  { value: "cluj-napoca", labelRo: "Cluj-Napoca", labelEn: "Cluj-Napoca" },
  { value: "timisoara", labelRo: "Timișoara", labelEn: "Timișoara" },
  { value: "iasi", labelRo: "Iași", labelEn: "Iași" },
  { value: "constanta", labelRo: "Constanța", labelEn: "Constanța" },
  { value: "craiova", labelRo: "Craiova", labelEn: "Craiova" },
  { value: "brasov", labelRo: "Brașov", labelEn: "Brașov" },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserProfileData>({
    birthDate: "",
    gender: "",
    height: "",
    weight: "",
    fitnessLevel: "",
    medicalConditions: [],
    city: "",
    preferredSports: [],
    goals: [],
    daysPerWeek: 3,
    workoutDuration: 60,
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
    if (item === "none") {
      updateField(field, ["none"]);
    } else {
      const updated = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current.filter(i => i !== "none"), item];
      updateField(field, updated);
    }
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
      case 1: return true;
      case 2: return formData.birthDate && formData.height && formData.weight;
      case 3: return formData.gender;
      case 4: return formData.fitnessLevel;
      case 5: return formData.medicalConditions.length > 0;
      case 6: return formData.city;
      case 7: return formData.preferredSports.length > 0 && formData.goals.length > 0;
      case 8: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSaving(true);
    
    try {
      const height = parseInt(formData.height);
      const weight = parseInt(formData.weight);
      const bmi = calculateBMI(height, weight);
      const age = calculateAge(formData.birthDate);
      
      await setDoc(doc(db, "users", userId), {
        ...formData,
        birthDate: formData.birthDate,
        age,
        bmi,
        height,
        weight,
        daysPerWeek: parseInt(formData.daysPerWeek.toString()),
        workoutDuration: parseInt(formData.workoutDuration.toString()),
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              {language === "ro" ? "Pasul" : "Step"} {step} / {TOTAL_STEPS}
            </span>
            <span className="text-sm font-medium text-emerald-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
          
          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="text-center">
              <div className="text-6xl mb-4">👋</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Bine ai venit în Ethos!" : "Welcome to Ethos!"}
              </h1>
              <p className="text-slate-600 mb-6">
                {language === "ro" 
                  ? "Să configurăm profilul tău pentru antrenamente personalizate și sigure."
                  : "Let's set up your profile for personalized and safe workouts."}
              </p>
              <div className="grid grid-cols-2 gap-4 text-left mt-8">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold text-slate-900">
                    {language === "ro" ? "Antrenamente Personalizate" : "Personalized Workouts"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {language === "ro" ? "AI-ul creează planuri pentru tine" : "AI creates plans for you"}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl mb-2">🤝</div>
                  <h3 className="font-semibold text-slate-900">
                    {language === "ro" ? "Găsește Parteneri" : "Find Partners"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {language === "ro" ? "Antrenează-te cu prieteni" : "Train with friends"}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold text-slate-900">
                    {language === "ro" ? "Urmărește Progresul" : "Track Progress"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {language === "ro" ? "Vezi statistici detaliate" : "See detailed stats"}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="text-2xl mb-2">💡</div>
                  <h3 className="font-semibold text-slate-900">
                    {language === "ro" ? "Sfaturi Smart" : "Smart Tips"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {language === "ro" ? "Recomandări bazate pe date" : "Data-driven recommendations"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Birth Date & Basic Info */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Câteva informații de bază" : "Some basic information"}
              </h1>
              <p className="text-slate-600 mb-6">
                {language === "ro" 
                  ? "Aceste date ne ajută să calculăm vârsta și să creăm antrenamente sigure."
                  : "This data helps us calculate age and create safe workouts."}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === "ro" ? "Data nașterii" : "Birth Date"} *
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {formData.birthDate && (
                    <p className="text-sm text-emerald-600 mt-2 font-medium">
                      {language === "ro" ? "Vârsta:" : "Age:"} {calculateAge(formData.birthDate)} {language === "ro" ? "ani" : "years"}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === "ro" ? "Înălțime (cm)" : "Height (cm)"} *
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => updateField("height", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {language === "ro" ? "Greutate (kg)" : "Weight (kg)"} *
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => updateField("weight", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                      placeholder="70"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Gender (Visual Cards) */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Cum te identifici?" : "How do you identify?"}
              </h1>
              <p className="text-slate-600 mb-6">
                {language === "ro" 
                  ? "Alegerea ta ne ajută să adaptăm antrenamentele."
                  : "Your choice helps us adapt workouts."}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateField("gender", option.value)}
                    className={`p-6 rounded-xl border-2 text-center transition-all ${
                      formData.gender === option.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-4xl mb-2">{option.emoji}</div>
                    <div className="font-medium text-slate-900">
                      {language === "ro" ? option.labelRo : option.labelEn}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Fitness Level (Visual Cards) */}
          {step === 4 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Care este nivelul tău de fitness?" : "What is your fitness level?"}
              </h1>
              <p className="text-slate-600 mb-6">
                {language === "ro" 
                  ? "Alege nivelul care te descrie cel mai bine."
                  : "Choose the level that best describes you."}
              </p>
              
              <div className="space-y-4">
                {fitnessOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateField("fitnessLevel", option.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.fitnessLevel === option.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{option.emoji}</span>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {language === "ro" ? option.labelRo : option.labelEn}
                        </div>
                        <div className="text-sm text-slate-500">
                          {language === "ro" ? option.descRo : option.descEn}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Health & Safety (Medical Conditions) */}
          {step === 5 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Sănătate și Siguranță" : "Health & Safety"}
              </h1>
              <p className="text-slate-600 mb-4">
                {language === "ro" 
                  ? "Selectează orice afecțiune care te-ar putea afecta la antrenamente."
                  : "Select any conditions that might affect your workouts."}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                <p className="text-sm text-amber-800">
                  💡 {language === "ro" 
                    ? "Antrenamentele tale vor fi adaptate automat pentru condițiile selectate."
                    : "Your workouts will be automatically adapted for selected conditions."}
                </p>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {medicalConditionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleArrayItem("medicalConditions", option.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.medicalConditions.includes(option.value)
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <div>
                        <div className="font-medium text-slate-900">
                          {language === "ro" ? option.labelRo : option.labelEn}
                        </div>
                        <div className="text-sm text-slate-500">
                          {language === "ro" ? option.descRo : option.descEn}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: City & Location */}
          {step === 6 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Unde te afli?" : "Where are you located?"}
              </h1>
              <p className="text-slate-600 mb-6">
                {language === "ro" 
                  ? "Alege orașul pentru a găsi parteneri de antrenament aproape de tine."
                  : "Choose your city to find workout partners near you."}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {cities.map((city) => (
                  <button
                    key={city.value}
                    onClick={() => updateField("city", city.value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.city === city.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-medium text-slate-900">
                      {language === "ro" ? city.labelRo : city.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Training Preferences */}
          {step === 7 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Preferințe de Antrenament" : "Training Preferences"}
              </h1>
              <p className="text-slate-600 mb-4">
                {language === "ro" 
                  ? "Ce sporturi practici și ce obiective ai?"
                  : "What sports do you practice and what are your goals?"}
              </p>
              
              {/* Sports */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {language === "ro" ? "Sporturi preferate *" : "Preferred sports *"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {sportsOptions.map((sport) => (
                    <button
                      key={sport.value}
                      onClick={() => toggleArrayItem("preferredSports", sport.value)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        formData.preferredSports.includes(sport.value)
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {sport.emoji} {language === "ro" ? sport.labelRo : sport.labelEn}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Goals */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {language === "ro" ? "Obiective *" : "Goals *"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {goalsOptions.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => toggleArrayItem("goals", goal.value)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        formData.goals.includes(goal.value)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {goal.emoji} {language === "ro" ? goal.labelRo : goal.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Summary */}
          {step === 8 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Gata!" : "Ready!"}
              </h1>
              <p className="text-slate-600 mb-6">
                {language === "ro" 
                  ? "Iată un rezumat al profilului tău:"
                  : "Here's a summary of your profile:"}
              </p>
              
              <div className="space-y-4 bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === "ro" ? "Vârstă" : "Age"}</span>
                  <span className="font-medium text-slate-900">{calculateAge(formData.birthDate) || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === "ro" ? "Gen" : "Gender"}</span>
                  <span className="font-medium text-slate-900">
                    {genderOptions.find(g => g.value === formData.gender)?.emoji} {language === "ro" ? genderOptions.find(g => g.value === formData.gender)?.labelRo : genderOptions.find(g => g.value === formData.gender)?.labelEn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === "ro" ? "Nivel" : "Level"}</span>
                  <span className="font-medium text-slate-900">
                    {fitnessOptions.find(f => f.value === formData.fitnessLevel)?.emoji} {language === "ro" ? fitnessOptions.find(f => f.value === formData.fitnessLevel)?.labelRo : fitnessOptions.find(f => f.value === formData.fitnessLevel)?.labelEn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === "ro" ? "Oraș" : "City"}</span>
                  <span className="font-medium text-slate-900">{cities.find(c => c.value === formData.city)?.labelRo || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === "ro" ? "Sporturi" : "Sports"}</span>
                  <span className="font-medium text-slate-900">{formData.preferredSports.length}</span>
                </div>
                {formData.medicalConditions.length > 0 && !formData.medicalConditions.includes("none") && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">❤️</span>
                    <span className="font-medium text-amber-600">
                      {language === "ro" ? "Atenționări medicale active" : "Active medical warnings"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                {language === "ro" ? "Înapoi" : "Back"}
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-medium transition-colors"
              >
                {language === "ro" ? "Continuă" : "Continue"}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {language === "ro" ? "Se salvează..." : "Saving..."}
                  </>
                ) : (
                  language === "ro" ? "Finalizează" : "Complete"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
