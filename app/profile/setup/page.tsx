"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";

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
      setError("Failed to save profile. Please try again.");
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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Setup Your Profile</h1>
          <p className="text-zinc-500 mt-1">Let&apos;s get to know you better</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s <= step
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Age *</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="New York"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Education</label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => handleInputChange("education", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="University"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange("occupation", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Fitness Level *</label>
                <div className="flex gap-2">
                  {fitnessLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleInputChange("fitnessLevel", level)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
                        formData.fitnessLevel === level
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
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
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Fitness Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Height (cm) *</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="175"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Fitness Goals *</label>
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleGoalToggle(goal)}
                      className={`py-2 px-4 rounded-full text-sm font-medium capitalize transition-all ${
                        formData.goals.includes(goal)
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Hobbies</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hobbyInput}
                    onChange={(e) => setHobbyInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addHobby()}
                    className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="Add a hobby..."
                  />
                  <button
                    type="button"
                    onClick={addHobby}
                    className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.hobbies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.hobbies.map((hobby) => (
                      <span
                        key={hobby}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                      >
                        {hobby}
                        <button
                          type="button"
                          onClick={() => removeHobby(hobby)}
                          className="hover:text-emerald-900"
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
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Find a Workout Buddy</h2>

              <div className="p-4 bg-zinc-50 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lookingForBuddy}
                    onChange={(e) => handleInputChange("lookingForBuddy", e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-medium text-zinc-900">I&apos;m looking for a workout buddy</p>
                    <p className="text-sm text-zinc-500">Get matched with people in your area</p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl">
                <h3 className="font-medium text-emerald-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• Your profile will be created</li>
                  <li>• You&apos;ll be redirected to your dashboard</li>
                  <li>• You can find gym buddies in your area</li>
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
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200 transition-colors"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
