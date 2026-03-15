"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import ScheduledWorkoutsSection from "@/components/ScheduledWorkoutsSection";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface UserProfileData {
  age: number;
  city: string;
  education: string;
  occupation: string;
  hobbies: string[];
  fitnessLevel: string;
  goals: string[];
  height: number;
  weight: number;
  lookingForBuddy: boolean;
}

const fitnessLevels = ["beginner", "intermediate", "advanced"] as const;
const goalOptions = ["lose fat", "gain muscle", "endurance"] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfileData>({
    age: 0,
    city: "",
    education: "",
    occupation: "",
    hobbies: [],
    fitnessLevel: "",
    goals: [],
    height: 0,
    weight: 0,
    lookingForBuddy: false,
  });

  const [hobbyInput, setHobbyInput] = useState("");

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
          city: data.city || "",
          education: data.education || "",
          occupation: data.occupation || "",
          hobbies: data.hobbies || [],
          fitnessLevel: data.fitnessLevel || "",
          goals: data.goals || [],
          height: data.height || 0,
          weight: data.weight || 0,
          lookingForBuddy: data.lookingForBuddy || false,
        });
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  function handleInputChange(field: keyof UserProfileData, value: string | number | boolean) {
    setProfile(prev => ({ ...prev, [field]: value }));
  }

  function handleGoalToggle(goal: string) {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  }

  function addHobby() {
    if (hobbyInput.trim() && !profile.hobbies.includes(hobbyInput.trim())) {
      setProfile(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, hobbyInput.trim()]
      }));
      setHobbyInput("");
    }
  }

  function removeHobby(hobby: string) {
    setProfile(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
  }

  async function handleSave() {
    if (!userId) return;
    
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "users", userId), {
        ...profile,
        updatedAt: new Date(),
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function getFitnessBadge(level: string) {
    switch (level) {
      case "beginner": return "badge-beginner";
      case "intermediate": return "badge-intermediate";
      case "advanced": return "badge-advanced";
      default: return "badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";
    }
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t("profile.title")}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t("profile.subtitle")}</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {t("profile.edit")}
            </button>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
            <p className="text-emerald-600 dark:text-emerald-400">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="card p-6 sm:p-8 space-y-8 dark:bg-zinc-900">
          {/* Basic Info Section */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t("profile.basicInfo")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1.5">{t("profile.age")}</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => handleInputChange("age", parseInt(e.target.value) || 0)}
                    className="input"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white">{profile.age || t("profile.notSet")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1.5">{t("profile.city")}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="input"
                    placeholder="New York"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white">{profile.city || t("profile.notSet")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1.5">{t("profile.education")}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.education}
                    onChange={(e) => handleInputChange("education", e.target.value)}
                    className="input"
                    placeholder="University"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white">{profile.education || t("profile.notSet")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1.5">{t("profile.occupation")}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.occupation}
                    onChange={(e) => handleInputChange("occupation", e.target.value)}
                    className="input"
                    placeholder="Software Engineer"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white">{profile.occupation || t("profile.notSet")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fitness Section */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t("profile.fitnessDetails")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1.5">{t("profile.height")}</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.height}
                    onChange={(e) => handleInputChange("height", parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="175"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white">{profile.height || t("profile.notSet")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1.5">{t("profile.weight")}</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.weight}
                    onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="70"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white">{profile.weight || t("profile.notSet")}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">{t("profile.fitnessLevel")}</label>
              {isEditing ? (
                <div className="flex gap-2">
                  {fitnessLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleInputChange("fitnessLevel", level)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium capitalize transition-all ${
                        profile.fitnessLevel === level
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  {profile.fitnessLevel ? (
                    <span className={getFitnessBadge(profile.fitnessLevel)}>{profile.fitnessLevel}</span>
                  ) : (
                    <span className="text-zinc-500">{t("profile.notSet")}</span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">{t("profile.goals")}</label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleGoalToggle(goal)}
                      className={`py-2 px-4 rounded-full text-sm font-medium capitalize transition-all ${
                        profile.goals.includes(goal)
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.goals.length > 0 ? (
                    profile.goals.map((goal) => (
                      <span key={goal} className="badge-primary">
                        {goal}
                      </span>
                    ))
                  ) : (
                    <p className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-500">{t("profile.notSet")}</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1.5">{t("profile.hobbies")}</label>
              {isEditing ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hobbyInput}
                      onChange={(e) => setHobbyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addHobby()}
                      className="input"
                      placeholder={t("profile.addHobby")}
                    />
                    <button
                      type="button"
                      onClick={addHobby}
                      className="btn-secondary px-4"
                    >
                      {t("profile.add")}
                    </button>
                  </div>
                  {profile.hobbies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profile.hobbies.map((hobby) => (
                        <span
                          key={hobby}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm"
                        >
                          {hobby}
                          <button type="button" onClick={() => removeHobby(hobby)} className="hover:text-emerald-900">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.length > 0 ? (
                    profile.hobbies.map((hobby) => (
                      <span key={hobby} className="badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {hobby}
                      </span>
                    ))
                  ) : (
                    <p className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-500">{t("profile.notSet")}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Buddy Section */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t("profile.buddy")}
            </h2>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.lookingForBuddy}
                  onChange={(e) => isEditing && handleInputChange("lookingForBuddy", e.target.checked)}
                  disabled={!isEditing}
                  className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{t("profile.lookingBuddy")}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("profile.lookingBuddyDesc")}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Scheduled Workouts Section */}
          <ScheduledWorkoutsSection userId={userId} />

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary flex-1 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {t("profile.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("profile.saving")}
                  </>
                ) : (
                  t("profile.save")
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
