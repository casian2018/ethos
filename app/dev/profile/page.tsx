"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import ScheduledWorkoutsSection from "@/components/ScheduledWorkoutsSection";

const auth = firebaseAuth;
const db = firebaseDb;

interface UserProfileData {
  age: number;
  birthDate?: string;
  gender?: string;
  sex?: string;
  city: string;
  education: string;
  occupation: string;
  hobbies: string[];
  fitnessLevel: string;
  goals: string[];
  height: number;
  weight: number;
  bmi?: number;
  lookingForBuddy: boolean;
  medicalConditions: string[];
  preferredSports?: string[];
  daysPerWeek?: number;
  workoutDuration?: number;
}

const fitnessLevels = ["beginner", "intermediate", "advanced"] as const;
const goalOptions = ["lose fat", "gain muscle", "endurance"] as const;

// Medical condition options for editing
const medicalConditionOptions = [
  { value: "none", emoji: "✅", labelRo: "Niciuna", labelEn: "None" },
  { value: "obesity", emoji: "⚖️", labelRo: "Obezitate", labelEn: "Obesity" },
  { value: "anorexia", emoji: "🍽️", labelRo: "Anorexie", labelEn: "Anorexia" },
  { value: "anemia", emoji: "🩸", labelRo: "Anemie", labelEn: "Anemia" },
  { value: "joint-problems", emoji: "🦴", labelRo: "Probleme articulare", labelEn: "Joint Problems" },
  { value: "hypertension", emoji: "❤️", labelRo: "Hipertensiune", labelEn: "Hypertension" },
  { value: "diabetes", emoji: "💉", labelRo: "Diabet", labelEn: "Diabetes" },
  { value: "back-pain", emoji: "🪑", labelRo: "Dureri de spate", labelEn: "Back Pain" },
  { value: "heart-condition", emoji: "❤️‍🩹", labelRo: "Probleme cardiace", labelEn: "Heart Condition" },
  { value: "asthma", emoji: "😮‍💨", labelRo: "Astm", labelEn: "Asthma" },
  { value: "thyroid", emoji: "🔄", labelRo: "Tiroidă", labelEn: "Thyroid" },
  { value: "kidney-problems", emoji: "🫘", labelRo: "Probleme renale", labelEn: "Kidney Problems" },
];

// Sex options
const sexOptions = [
  { value: "male", emoji: "👨", labelRo: "Masculin", labelEn: "Male" },
  { value: "female", emoji: "👩", labelRo: "Feminin", labelEn: "Female" },
  { value: "intersex", emoji: "⚥", labelRo: "Intersex", labelEn: "Intersex" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfileData>({
    age: 0,
    birthDate: "",
    gender: "",
    sex: "",
    city: "",
    education: "",
    occupation: "",
    hobbies: [],
    fitnessLevel: "",
    goals: [],
    height: 0,
    weight: 0,
    bmi: 0,
    lookingForBuddy: false,
    medicalConditions: [],
    preferredSports: [],
    daysPerWeek: 3,
    workoutDuration: 60,
  });

  const [hobbyInput, setHobbyInput] = useState("");

  useEffect(() => {
    if (!auth || !db) {
      setError(language === "ro" ? "Configurație Firebase lipsă. Contactează administratorul." : "Firebase configuration missing. Contact administrator.");
      setLoading(false);
      return;
    }

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
        const height = data.height || 0;
        const weight = data.weight || 0;
        setProfile({
          age: data.age || 0,
          birthDate: data.birthDate || "",
          gender: data.gender || "",
          sex: data.sex || "",
          city: data.city || "",
          education: data.education || "",
          occupation: data.occupation || "",
          hobbies: data.hobbies || [],
          fitnessLevel: data.fitnessLevel || "",
          goals: data.goals || [],
          height,
          weight,
          bmi: height > 0 && weight > 0 ? Math.round((weight / ((height / 100) ** 2)) * 10) / 10 : 0,
          lookingForBuddy: data.lookingForBuddy || false,
          medicalConditions: data.medicalConditions || [],
          preferredSports: data.preferredSports || [],
          daysPerWeek: data.daysPerWeek || 3,
          workoutDuration: data.workoutDuration || 60,
        });
      }
      
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router, auth, db, language]);

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

  function handleMedicalConditionToggle(condition: string) {
    setProfile(prev => {
      let newConditions: string[];
      
      if (condition === "none") {
        // If selecting "none", clear all other conditions
        newConditions = ["none"];
      } else {
        // Remove "none" if selecting any other condition
        const withoutNone = prev.medicalConditions.filter(c => c !== "none");
        
        if (withoutNone.includes(condition)) {
          newConditions = withoutNone.filter(c => c !== condition);
        } else {
          newConditions = [...withoutNone, condition];
        }
        
        // If no conditions selected, default to none
        if (newConditions.length === 0) {
          newConditions = ["none"];
        }
      }
      
      return { ...prev, medicalConditions: newConditions };
    });
  }

  async function handleSave() {
    if (!userId || !auth || !db) {
      setError("Authentication error. Please refresh and try again.");
      return;
    }
    
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Calculate age from birthDate if provided
      let age = profile.age;
      if (profile.birthDate) {
        const birthYear = new Date(profile.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        age = currentYear - birthYear;
      }

      // Calculate BMI
      const bmi = profile.height > 0 && profile.weight > 0 
        ? Math.round((profile.weight / ((profile.height / 100) ** 2)) * 10) / 10 
        : 0;

      await updateDoc(doc(db, "users", userId), {
        ...profile,
        age,
        bmi,
        updatedAt: new Date(),
      });

      setSuccess(language === "ro" ? "Profil actualizat cu succes!" : "Profile updated successfully!");
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(language === "ro" ? "Eroare la actualizarea profilului. Încearcă din nou." : "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function getFitnessBadge(level: string) {
    switch (level) {
      case "beginner": return "badge-beginner";
      case "intermediate": return "badge-intermediate";
      case "advanced": return "badge-advanced";
      default: return "badge bg-zinc-100 bg-slate-50 text-zinc-600 text-slate-600";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 bg-white transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 text-slate-900">{t("profile.title")}</h1>
            <p className="text-zinc-500 text-slate-500 mt-1">{t("profile.subtitle")}</p>
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
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 bg-emerald-50 border border-emerald-100 border-emerald-200">
            <p className="text-emerald-600 text-emerald-600">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 bg-red-50 border border-red-100 border-red-200">
            <p className="text-red-600 text-red-600">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="card p-6 sm:p-8 space-y-8 bg-white">
          {/* Informații Vitale Section */}
          {(profile.birthDate || profile.gender || profile.sex || profile.medicalConditions.length > 0) && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {language === "ro" ? "Informații Vitale" : "Vital Information"}
              </h2>
              
              {/* Sex Selection in Edit Mode */}
              {isEditing && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === "ro" ? "Sex biologic" : "Biological Sex"}
                  </label>
                  <div className="flex gap-2">
                    {sexOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange("sex", option.value)}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium capitalize transition-all flex items-center justify-center gap-2 ${
                          profile.sex === option.value
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <span>{option.emoji}</span>
                        <span>{language === "ro" ? option.labelRo : option.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Medical Conditions in Edit Mode */}
              {isEditing && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === "ro" ? "Condiții Medicale" : "Medical Conditions"}
                    <span className="text-xs text-slate-500 ml-2">
                      ({language === "ro" ? "Selectează toate care te privesc" : "Select all that apply"})
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {medicalConditionOptions.map((condition) => {
                      const isSelected = profile.medicalConditions.includes(condition.value);
                      return (
                        <button
                          key={condition.value}
                          type="button"
                          onClick={() => handleMedicalConditionToggle(condition.value)}
                          className={`py-2.5 px-3 rounded-xl text-sm font-medium capitalize transition-all flex items-center gap-2 ${
                            isSelected
                              ? "bg-amber-100 text-amber-800 border-2 border-amber-300"
                              : "bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100"
                          }`}
                        >
                          <span>{condition.emoji}</span>
                          <span className="text-xs">{language === "ro" ? condition.labelRo : condition.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    💡 {language === "ro" 
                      ? "Aceste informații ajută AI-ul Ethos să personalizeze antrenamentele pentru tine." 
                      : "This information helps Ethos AI personalize workouts for you."}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Age */}
                {profile.age > 0 && (
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <div className="text-2xl mb-1">🎂</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{language === "ro" ? "Vârstă" : "Age"}</div>
                    <div className="text-lg font-bold text-emerald-700">{profile.age}</div>
                  </div>
                )}
                {/* BMI */}
                {profile.bmi && profile.bmi > 0 && (
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <div className="text-2xl mb-1">⚖️</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">BMI</div>
                    <div className="text-lg font-bold text-blue-700">{profile.bmi}</div>
                  </div>
                )}
                {/* Height */}
                {profile.height > 0 && (
                  <div className="p-3 bg-purple-50 rounded-xl text-center">
                    <div className="text-2xl mb-1">📏</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{language === "ro" ? "Înălțime" : "Height"}</div>
                    <div className="text-lg font-bold text-purple-700">{profile.height}cm</div>
                  </div>
                )}
                {/* Weight */}
                {profile.weight > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl text-center">
                    <div className="text-2xl mb-1">🏋️</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{language === "ro" ? "Greutate" : "Weight"}</div>
                    <div className="text-lg font-bold text-amber-700">{profile.weight}kg</div>
                  </div>
                )}
              </div>
              
              {/* Gender Badge */}
              {profile.gender && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-500">{language === "ro" ? "Gen:" : "Gender:"}</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                    {profile.gender === "male" && "👨 Masculin"}
                    {profile.gender === "female" && "👩 Feminin"}
                    {profile.gender === "non-binary" && "🧑 Non-binar"}
                    {profile.gender === "prefer-not-to-say" && "🤐 Prefer să nu spun"}
                  </span>
                </div>
              )}
              
              {/* Sex Badge */}
              {profile.sex && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-500">{language === "ro" ? "Sex:" : "Sex:"}</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                    {profile.sex === "male" && "👨 Masculin"}
                    {profile.sex === "female" && "👩 Feminin"}
                    {profile.sex === "intersex" && "⚥ Intersex"}
                  </span>
                </div>
              )}
              
              {/* Medical Conditions Badges */}
              {profile.medicalConditions.length > 0 && !profile.medicalConditions.includes("none") && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-500">{language === "ro" ? "Condiții medicale:" : "Medical conditions:"}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                      ⚠️ {language === "ro" ? "Active" : "Active"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.medicalConditions.map((condition) => (
                      <span key={condition} className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200">
                        {condition === "obesity" && "⚖️ Obezitate"}
                        {condition === "anorexia" && "🍽️ Anorexie"}
                        {condition === "anemia" && "🩸 Anemie"}
                        {condition === "joint-problems" && "🦴 Probleme articulare"}
                        {condition === "hypertension" && "❤️ Hipertensiune"}
                        {condition === "diabetes" && "💉 Diabet"}
                        {condition === "back-pain" && "🪑 Dureri de spate"}
                        {condition === "heart-condition" && "❤️‍🩹 Probleme cardiace"}
                        {condition === "asthma" && "😮‍💨 Astm"}
                      </span>
                    ))}
                  </div>
                  {/* Workout Warning */}
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">
                      <strong>⚠️ {language === "ro" ? "Atenționare:" : "Warning:"}</strong>{" "}
                      {language === "ro" 
                        ? `Antrenamentele tale vor fi adaptate pentru: ${profile.medicalConditions.map(c => {
                          if (c === "obesity") return "Obezitate";
                          if (c === "anemia") return "Anemie";
                          if (c === "diabetes") return "Diabet";
                          if (c === "hypertension") return "Hipertensiune";
                          if (c === "back-pain") return "Dureri de spate";
                          if (c === "heart-condition") return "Probleme cardiace";
                          if (c === "asthma") return "Astm";
                          return c;
                        }).join(", ")}`
                        : `Your workouts will be adapted for: ${profile.medicalConditions.join(", ")}`}
                    </p>
                  </div>
                </div>
              )}
              {profile.medicalConditions.includes("none") && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-500">{language === "ro" ? "Condiții medicale:" : "Medical conditions:"}</span>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200">
                    ✅ {language === "ro" ? "Niciuna" : "None"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Basic Info Section */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t("profile.basicInfo")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 text-slate-700 mb-1.5">{t("profile.age")}</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => handleInputChange("age", parseInt(e.target.value) || 0)}
                    className="input"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 bg-slate-50 rounded-xl text-zinc-900 text-slate-900">{profile.age || t("profile.notSet")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 text-slate-700 mb-1.5">{t("profile.city")}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="input"
                    placeholder="New York"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 bg-slate-50 rounded-xl text-zinc-900 text-slate-900">{profile.city || t("profile.notSet")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 text-slate-700 mb-1.5">{t("profile.education")}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.education}
                    onChange={(e) => handleInputChange("education", e.target.value)}
                    className="input"
                    placeholder="University"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 bg-slate-50 rounded-xl text-zinc-900 text-slate-900">{profile.education || t("profile.notSet")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 text-slate-700 mb-1.5">{t("profile.occupation")}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.occupation}
                    onChange={(e) => handleInputChange("occupation", e.target.value)}
                    className="input"
                    placeholder="Software Engineer"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 bg-slate-50 rounded-xl text-zinc-900 text-slate-900">{profile.occupation || t("profile.notSet")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fitness Section */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t("profile.fitnessDetails")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 text-slate-700 mb-1.5">{t("profile.height")}</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.height}
                    onChange={(e) => handleInputChange("height", parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="175"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 bg-slate-50 rounded-xl text-zinc-900 text-slate-900">{profile.height || t("profile.notSet")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 text-slate-700 mb-1.5">{t("profile.weight")}</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.weight}
                    onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="70"
                  />
                ) : (
                  <p className="px-4 py-3 bg-zinc-50 bg-slate-50 rounded-xl text-zinc-900 text-slate-900">{profile.weight || t("profile.notSet")}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 text-slate-700 mb-2">{t("profile.fitnessLevel")}</label>
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
                          : "bg-zinc-100 bg-slate-50 text-zinc-600 text-slate-600 hover:bg-zinc-200 hover:bg-slate-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 bg-zinc-50 bg-slate-50 rounded-xl">
                  {profile.fitnessLevel ? (
                    <span className={getFitnessBadge(profile.fitnessLevel)}>{profile.fitnessLevel}</span>
                  ) : (
                    <span className="text-zinc-500">{t("profile.notSet")}</span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 text-slate-700 mb-2">{t("profile.goals")}</label>
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
                          : "bg-zinc-100 bg-slate-50 text-zinc-600 text-slate-600 hover:bg-zinc-200 hover:bg-slate-200"
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
                    <p className="px-4 py-3 bg-zinc-50 bg-slate-50 rounded-xl text-zinc-500">{t("profile.notSet")}</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 text-slate-700 mb-1.5">{t("profile.hobbies")}</label>
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 bg-emerald-50 text-emerald-700 text-emerald-600 rounded-full text-sm"
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
                      <span key={hobby} className="badge bg-zinc-100 bg-slate-50 text-zinc-600 text-slate-600">
                        {hobby}
                      </span>
                    ))
                  ) : (
                    <p className="px-4 py-3 bg-zinc-50 bg-slate-50 rounded-xl text-zinc-500">{t("profile.notSet")}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Buddy Section */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t("profile.buddy")}
            </h2>
            <div className="p-4 bg-zinc-50 bg-slate-50 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.lookingForBuddy}
                  onChange={(e) => isEditing && handleInputChange("lookingForBuddy", e.target.checked)}
                  disabled={!isEditing}
                  className="w-5 h-5 rounded border-zinc-300 border-slate-200 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                />
                <div>
                  <p className="font-medium text-zinc-900 text-slate-900">{t("profile.lookingBuddy")}</p>
                  <p className="text-sm text-zinc-500 text-slate-500">{t("profile.lookingBuddyDesc")}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Smart AI Tips Section */}
          {(profile.medicalConditions && profile.medicalConditions.length > 0 && !profile.medicalConditions.includes("none")) && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-6 border border-emerald-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                {language === "ro" ? "Sfaturi Personalizate pentru Sănătate" : "Personalized Health Tips"}
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {language === "ro" 
                  ? "Datele tale medicale ajută AI-ul Ethos să creeze antrenamente sigure și eficiente pentru tine:" 
                  : "Your medical data helps Ethos AI create safe and effective workouts for you:"}
              </p>
              <div className="space-y-3">
                {profile.medicalConditions.includes("obesity") && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">⚖️</span>
                    <div>
                      <p className="font-medium text-slate-900">{language === "ro" ? "Obezitate" : "Obesity"}</p>
                      <p className="text-sm text-slate-600">
                        {language === "ro" 
                          ? "AI-ul recomandă antrenamente cu impact redus (înot, cycling, elliptic) și progresie lentă pentru a proteja articulațiile."
                          : "AI recommends low-impact workouts (swimming, cycling, elliptical) and slow progression to protect joints."}
                      </p>
                    </div>
                  </div>
                )}
                {profile.medicalConditions.includes("anemia") && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">🩸</span>
                    <div>
                      <p className="font-medium text-slate-900">{language === "ro" ? "Anemie" : "Anemia"}</p>
                      <p className="text-sm text-slate-600">
                        {language === "ro" 
                          ? "AI-ul sugerează pauze mai lungi între seturi și exerțiiții cu intensitate moderată pentru a preveni amețelile."
                          : "AI suggests longer breaks between sets and moderate-intensity exercises to prevent dizziness."}
                      </p>
                    </div>
                  </div>
                )}
                {profile.medicalConditions.includes("diabetes") && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">💉</span>
                    <div>
                      <p className="font-medium text-slate-900">{language === "ro" ? "Diabet" : "Diabetes"}</p>
                      <p className="text-sm text-slate-600">
                        {language === "ro" 
                          ? "AI-ul monitorizează intensitatea pentru a menține nivelul de zahăr în sânge stabil și sugerează momentele optime de antrenament."
                          : "AI monitors intensity to keep blood sugar stable and suggests optimal workout times."}
                      </p>
                    </div>
                  </div>
                )}
                {profile.medicalConditions.includes("hypertension") && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">❤️</span>
                    <div>
                      <p className="font-medium text-slate-900">{language === "ro" ? "Hipertensiune" : "Hypertension"}</p>
                      <p className="text-sm text-slate-600">
                        {language === "ro" 
                          ? "AI-ul evită exercițiile cu ridicare de greutăți mari și recomandă exerciții cardio cu intensitate controlată."
                          : "AI avoids heavy weightlifting and recommends controlled-intensity cardio exercises."}
                      </p>
                    </div>
                  </div>
                )}
                {profile.medicalConditions.includes("backPain") && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">🪑</span>
                    <div>
                      <p className="font-medium text-slate-900">{language === "ro" ? "Dureri de spate" : "Back Pain"}</p>
                      <p className="text-sm text-slate-600">
                        {language === "ro" 
                          ? "AI-ul evită exercițiile cu impact asupra coloanei și recomandă stretching și exerciții de core."
                          : "AI avoids exercises that impact the spine and recommends stretching and core exercises."}
                      </p>
                    </div>
                  </div>
                )}
                {profile.medicalConditions.includes("asthma") && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">😮‍💨</span>
                    <div>
                      <p className="font-medium text-slate-900">{language === "ro" ? "Astm" : "Asthma"}</p>
                      <p className="text-sm text-slate-600">
                        {language === "ro" 
                          ? "AI-ul recomandă antrenamente în spații bine ventilate și evită exercițiile intense în aer rece."
                          : "AI recommends workouts in well-ventilated spaces and avoids intense exercises in cold air."}
                      </p>
                    </div>
                  </div>
                )}
                {profile.medicalConditions.includes("heartCondition") && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">❤️‍🩹</span>
                    <div>
                      <p className="font-medium text-slate-900">{language === "ro" ? "Probleme cardiace" : "Heart Condition"}</p>
                      <p className="text-sm text-slate-600">
                        {language === "ro" 
                          ? "AI-ul colaborează cu recomandările medicului tău și propune antrenamente cardio ușoare cu monitorizarea frecvenței cardiace."
                          : "AI works with your doctor's recommendations and suggests light cardio with heart rate monitoring."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 p-3 bg-emerald-100 rounded-xl">
                <p className="text-sm text-emerald-800">
                  💡 <strong>{language === "ro" ? "Sfat:" : "Tip:"}</strong> {language === "ro" 
                    ? "Poți actualiza condițiile medicale oricând din profil pentru antrenamente și mai personalizate!"
                    : "You can update your medical conditions anytime from your profile for even more personalized workouts!"}
                </p>
              </div>
            </div>
          )}

          {/* Scheduled Workouts Section */}
          <ScheduledWorkoutsSection userId={userId} />

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-zinc-100 border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary flex-1 bg-slate-50 text-slate-700"
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
