"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

type Step = 1 | 2 | 3;

interface UserProfileData {
  age: string;
  city: string;
  education: string;
  occupation: string;
  hobbies: string[];
  fitnessLevel: string;
  goals: string[];
  height: string;
  weight: string;
  lookingForBuddy: boolean;
}

const fitnessLevels = ["beginner", "intermediate", "advanced"] as const;
const goalOptions = ["lose fat", "gain muscle", "endurance"] as const;

export default function ProfileSetupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserProfileData>({
    age: "",
    city: "",
    education: "",
    occupation: "",
    hobbies: [],
    fitnessLevel: "",
    goals: [],
    height: "",
    weight: "",
    lookingForBuddy: false,
  });

  const [hobbyInput, setHobbyInput] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      
      // Check if profile already exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        router.push("/main");
        return;
      }
      
      setUserId(user.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  function handleInputChange(field: keyof UserProfileData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleGoalToggle(goal: string) {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  }

  function addHobby() {
    if (hobbyInput.trim() && !formData.hobbies.includes(hobbyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, hobbyInput.trim()]
      }));
      setHobbyInput("");
    }
  }

  function removeHobby(hobby: string) {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
  }

  async function handleSubmit() {
    if (!userId) return;
    
    setSaving(true);
    setError("");

    try {
      await setDoc(doc(db, "users", userId), {
        ...formData,
        age: parseInt(formData.age) || 0,
        height: parseFloat(formData.height) || 0,
        weight: parseFloat(formData.weight) || 0,
        createdAt: new Date(),
      });

      router.push("/main");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(t("error") + ". " + t("loading"));
    } finally {
      setSaving(false);
    }
  }

  function nextStep() {
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  }

  const canProceed = () => {
    if (step === 1) {
      return formData.age && formData.city && formData.fitnessLevel;
    }
    if (step === 2) {
      return formData.height && formData.weight && formData.goals.length > 0;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4 transition-colors">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4 shadow-lg shadow-emerald-500/25">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("setup.title")}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t("setup.subtitle")}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  s <= step
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {s < step ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
            ))}
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="card p-6 dark:bg-zinc-900">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t("setup.basicInfo")}</h2>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("setup.age")} *</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="input dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                  placeholder={t("setup.agePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("setup.city")} *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="input dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                  placeholder={t("setup.cityPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("setup.education")}</label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => handleInputChange("education", e.target.value)}
                  className="input dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                  placeholder={t("setup.educationPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("setup.occupation")}</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange("occupation", e.target.value)}
                  className="input dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                  placeholder={t("setup.occupationPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("setup.fitnessLevel")} *</label>
                <div className="flex gap-2">
                  {fitnessLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleInputChange("fitnessLevel", level)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium capitalize transition-all ${
                        formData.fitnessLevel === level
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fitness */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t("setup.fitnessDetails")}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("setup.height")} *</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    className="input dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                    placeholder={t("setup.heightPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("setup.weight")} *</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    className="input dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                    placeholder={t("setup.weightPlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("setup.fitnessGoals")} *</label>
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleGoalToggle(goal)}
                      className={`py-2 px-4 rounded-full text-sm font-medium capitalize transition-all ${
                        formData.goals.includes(goal)
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("profile.hobbies")}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hobbyInput}
                    onChange={(e) => setHobbyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addHobby()}
                    className="input dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                    placeholder={t("setup.addHobby")}
                  />
                  <button
                    type="button"
                    onClick={addHobby}
                    className="btn-secondary dark:bg-zinc-800 dark:text-zinc-200 px-4"
                  >
                    {t("setup.add")}
                  </button>
                </div>
                {formData.hobbies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.hobbies.map((hobby) => (
                      <span
                        key={hobby}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm"
                      >
                        {hobby}
                        <button
                          type="button"
                          onClick={() => removeHobby(hobby)}
                          className="hover:text-emerald-900 dark:hover:text-emerald-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Buddy */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t("setup.findBuddy")}</h2>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lookingForBuddy}
                    onChange={(e) => handleInputChange("lookingForBuddy", e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{t("setup.lookingForBuddy")}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("setup.getMatched")}</p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <h3 className="font-medium text-emerald-900 dark:text-emerald-300 mb-2">{t("setup.whatsNext")}</h3>
                <ul className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
                  <li>• {t("setup.step1")}</li>
                  <li>• {t("setup.step2")}</li>
                  <li>• {t("setup.step3")}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary dark:bg-zinc-800 dark:text-zinc-200 flex-1"
              >
                {t("setup.back")}
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="btn-primary flex-1"
              >
                {t("setup.next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("setup.saving")}
                  </>
                ) : (
                  t("setup.complete")
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
