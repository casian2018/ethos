"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  Apple,
  Camera,
  CheckCircle2,
  ChefHat,
  Coffee,
  Droplets,
  Flame,
  Loader2,
  Moon,
  Plus,
  ShieldAlert,
  Sparkles,
  Sun,
  Target,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { auth as firebaseAuth, db as firebaseDb, storage as firebaseStorage } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
  calculateNutritionTargets,
  dietaryPreferenceOptions,
  formatTagList,
  getGoalModeFromGoals,
  getOptionLabel,
  goalOptions,
  profileNeedsOnboarding,
  type DetailedUserProfile,
  type GoalMode,
  type NutritionTargets,
} from "@/lib/profile";
import {
  buildFallbackMealPlan,
  fallbackAnalyzeNutrition,
  getDietPlanSuggestions,
  getMealTypeLabel,
  type MealType,
  type NutritionAnalysis,
  type NutritionMealPlan,
} from "@/lib/nutrition";

const auth = firebaseAuth!;
const db = firebaseDb!;
const storage = firebaseStorage;

interface FoodEntry {
  id?: string;
  name: string;
  rawDescription?: string;
  quantityText?: string;
  estimatedWeightGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
  hydrationMl?: number;
  recognizedFoods?: string[];
  warnings?: string[];
  analysisNotes?: string;
  analysisConfidence?: "low" | "medium" | "high";
  analysisSource?: string;
  imageUrl?: string;
  mealType: MealType;
  timestamp: unknown;
}

type StatusMessage = {
  type: "error" | "success" | "info";
  text: string;
};

function StatusBanner({ message }: { message: StatusMessage | null }) {
  if (!message) {
    return null;
  }

  const styles =
    message.type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : message.type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  const Icon = message.type === "error" ? ShieldAlert : message.type === "success" ? CheckCircle2 : Sparkles;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message.text}</p>
    </div>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAnalysisSourceLabel(source: string | undefined, language: "ro" | "en"): string {
  if (source === "gemini-image") {
    return language === "ro" ? "AI foto" : "AI photo";
  }

  if (source === "gemini-multimodal") {
    return language === "ro" ? "AI foto + text" : "AI photo + text";
  }

  if (source === "gemini-text") {
    return language === "ro" ? "AI text" : "AI text";
  }

  return language === "ro" ? "Fallback" : "Fallback";
}

function getConfidenceLabel(confidence: string | undefined, language: "ro" | "en"): string {
  if (confidence === "high") {
    return language === "ro" ? "încredere mare" : "high confidence";
  }

  if (confidence === "low") {
    return language === "ro" ? "încredere redusă" : "low confidence";
  }

  return language === "ro" ? "încredere medie" : "medium confidence";
}

function getMealIcon(slot: MealType) {
  if (slot === "breakfast") {
    return Coffee;
  }

  if (slot === "lunch") {
    return Sun;
  }

  if (slot === "dinner") {
    return Moon;
  }

  return Apple;
}

export default function NutritionPage() {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DetailedUserProfile | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tracker" | "plan">("tracker");
  const [goalType, setGoalType] = useState<GoalMode>("maintain");
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [macrosConsumed, setMacrosConsumed] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [foodDescription, setFoodDescription] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<NutritionAnalysis | null>(null);
  const [trackerMessage, setTrackerMessage] = useState<StatusMessage | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<NutritionMealPlan | null>(null);
  const [planMessage, setPlanMessage] = useState<StatusMessage | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        setNeedsProfile(true);
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
            setGoalType(getGoalModeFromGoals(data.goals, data.priorityGoal));
            await loadTodayEntries(currentUser.uid);
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
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setTargets(calculateNutritionTargets(profile, goalType));
  }, [goalType, profile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadTodayEntries = async (userId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const entriesQuery = query(
        collection(db, "food_entries"),
        where("userId", "==", userId),
        where("date", "==", today.toISOString().split("T")[0]),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(entriesQuery);
      const entries: FoodEntry[] = [];
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      snapshot.forEach((entryDoc) => {
        const data = entryDoc.data() as FoodEntry;
        entries.push({ id: entryDoc.id, ...data });
        totalCalories += data.calories || 0;
        totalProtein += data.protein || 0;
        totalCarbs += data.carbs || 0;
        totalFat += data.fat || 0;
      });

      setTodayEntries(entries);
      setCaloriesConsumed(totalCalories);
      setMacrosConsumed({ protein: totalProtein, carbs: totalCarbs, fat: totalFat });
    } catch (err) {
      console.error("Error loading food entries:", err);
    }
  };

  const clearSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setTrackerMessage({
        type: "error",
        text: language === "ro" ? "Selectează un fișier imagine." : "Select an image file.",
      });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setTrackerMessage({
        type: "error",
        text: language === "ro" ? "Imaginea trebuie să aibă sub 8MB." : "The image must be smaller than 8MB.",
      });
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setTrackerMessage(null);
  };

  const logFood = async () => {
    if (!user || !profile) {
      return;
    }

    if (!foodDescription.trim() && !selectedImage) {
      setTrackerMessage({
        type: "error",
        text: language === "ro" ? "Adaugă descrierea mesei sau o poză." : "Add a meal description or a photo.",
      });
      return;
    }

    setIsLogging(true);
    setTrackerMessage(null);

    try {
      let analysis: NutritionAnalysis;
      let infoMessage = "";

      try {
        const imageBase64 = selectedImage ? await readFileAsBase64(selectedImage) : "";
        const response = await fetch("/api/nutrition/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: foodDescription.trim(),
            quantityText: quantityText.trim(),
            imageBase64,
            imageMimeType: selectedImage?.type || "",
            language,
            dietaryPreference: profile.dietaryPreference,
            allergies: profile.foodAllergies,
            foodsToAvoid: profile.foodsToAvoid,
          }),
        });

        const payload = (await response.json()) as {
          analysis?: NutritionAnalysis;
          warning?: string;
          error?: string;
          usedFallback?: boolean;
        };

        if (!response.ok || !payload.analysis) {
          throw new Error(payload.error || "Failed to analyze meal.");
        }

        analysis = payload.analysis;
        infoMessage = payload.warning || "";
      } catch (error) {
        if (!foodDescription.trim()) {
          throw error;
        }

        analysis = fallbackAnalyzeNutrition({
          description: foodDescription.trim(),
          quantityText: quantityText.trim(),
          language,
        });
        infoMessage =
          language === "ro"
            ? "Gemini nu a fost disponibil. A fost folosită estimarea fallback din text."
            : "Gemini was unavailable. A fallback text estimate was used.";
      }

      let imageUrl = "";
      if (selectedImage && storage) {
        const safeName = selectedImage.name.replace(/\s+/g, "_");
        const storageRef = ref(storage, `nutrition/${user.uid}/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, selectedImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      const today = new Date().toISOString().split("T")[0];
      await addDoc(collection(db, "food_entries"), {
        userId: user.uid,
        name: analysis.displayName,
        rawDescription: foodDescription.trim() || analysis.displayName,
        quantityText: analysis.portionDescription || quantityText.trim(),
        estimatedWeightGrams: analysis.estimatedWeightGrams,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
        fiber: analysis.fiber,
        sugar: analysis.sugar,
        sodiumMg: analysis.sodiumMg,
        hydrationMl: analysis.hydrationMl,
        recognizedFoods: analysis.recognizedFoods,
        warnings: analysis.warnings,
        analysisNotes: analysis.reasoning,
        analysisConfidence: analysis.confidence,
        analysisSource: analysis.analysisSource,
        mealType: selectedMealType,
        imageUrl,
        date: today,
        timestamp: serverTimestamp(),
      });

      setLastAnalysis(analysis);
      setFoodDescription("");
      setQuantityText("");
      clearSelectedImage();
      await loadTodayEntries(user.uid);

      setTrackerMessage(
        infoMessage
          ? { type: "info", text: infoMessage }
          : {
              type: "success",
              text:
                language === "ro"
                  ? "Masa a fost analizată și logată cu succes."
                  : "The meal was analyzed and logged successfully.",
            }
      );
    } catch (err) {
      console.error("Error logging food:", err);
      setTrackerMessage({
        type: "error",
        text:
          language === "ro"
            ? "Nu am putut analiza masa. Încearcă o descriere mai clară sau o poză mai bună."
            : "The meal could not be analyzed. Try a clearer description or a better photo.",
      });
    } finally {
      setIsLogging(false);
    }
  };

  const generateMealPlan = async () => {
    if (!profile || !targets) {
      return;
    }

    setIsGeneratingPlan(true);
    setPlanMessage(null);

    try {
      const response = await fetch("/api/nutrition/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { ...profile, mealsPerDay: Math.max(3, Math.min(profile.mealsPerDay || 4, 6)) },
          targets,
          language,
        }),
      });

      const payload = (await response.json()) as {
        plan?: NutritionMealPlan;
        warning?: string;
        error?: string;
        usedFallback?: boolean;
      };

      if (!response.ok || !payload.plan) {
        throw new Error(payload.error || "Failed to generate meal plan.");
      }

      setGeneratedPlan(payload.plan);
      setPlanMessage(
        payload.warning
          ? { type: "info", text: payload.warning }
          : {
              type: "success",
              text:
                language === "ro"
                  ? "Planul alimentar a fost generat din profilul tău."
                  : "The meal plan was generated from your profile.",
            }
      );
    } catch (err) {
      console.error("Error generating meal plan:", err);
      setGeneratedPlan(buildFallbackMealPlan(profile, targets, language));
      setPlanMessage({
        type: "info",
        text:
          language === "ro"
            ? "Gemini nu a fost disponibil, așa că am afișat planul fallback din profil."
            : "Gemini was unavailable, so the profile-based fallback plan is shown.",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (needsProfile || !profile || !targets) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Nutrition</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            {language === "ro" ? "Completează profilul detaliat" : "Complete the detailed profile"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {language === "ro"
              ? "Nutriția folosește acum profilul complet pentru ținte calorice, analiză cu Gemini și generare de plan alimentar."
              : "Nutrition now uses your full profile for calorie targets, Gemini analysis, and meal-plan generation."}
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/dev/profile/setup"
              className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              {language === "ro" ? "Completează profilul" : "Complete profile"}
            </Link>
            <Link
              href="/dev/profile"
              className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {language === "ro" ? "Vezi profilul" : "View profile"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const caloriesRemaining = targets.targetCalories - caloriesConsumed;
  const progressPercent = Math.min((caloriesConsumed / targets.targetCalories) * 100, 100);
  const goalTags = formatTagList(profile.goals, goalOptions, language);
  const dietSuggestions = getDietPlanSuggestions(profile, language);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
          <Apple className="h-8 w-8 text-emerald-500" />
          {language === "ro" ? "Nutriție" : "Nutrition"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {language === "ro"
            ? "Loghezi mese din text sau poză, iar Gemini estimează cantitatea și valorile nutriționale."
            : "Log meals from text or photo, and Gemini estimates the portion and nutritional values."}
        </p>
      </header>

      <div className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {language === "ro" ? "Profil nutrițional activ" : "Active nutrition profile"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {getOptionLabel(dietaryPreferenceOptions, profile.dietaryPreference, language)} • {goalTags.join(", ")}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {language === "ro" ? "Alergii" : "Allergies"}:{" "}
              {profile.foodAllergies.length > 0 ? profile.foodAllergies.join(", ") : language === "ro" ? "niciuna" : "none"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Calories</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{targets.targetCalories}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Protein</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{targets.proteinGrams}g</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Carbs</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{targets.carbsGrams}g</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Water</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{targets.waterLiters}L</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex w-fit gap-2 rounded-2xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab("tracker")}
          className={`rounded-xl px-6 py-2.5 font-medium transition ${
            activeTab === "tracker" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          {language === "ro" ? "Tracker" : "Tracker"}
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`rounded-xl px-6 py-2.5 font-medium transition ${
            activeTab === "plan" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          {language === "ro" ? "Plan alimentar" : "Meal plan"}
        </button>
      </div>

      {activeTab === "tracker" ? (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-slate-900">{language === "ro" ? "Calorii" : "Calories"}</h3>
              </div>
              <div className="mb-1 text-3xl font-bold text-slate-900">
                {caloriesConsumed}
                <span className="text-lg font-normal text-slate-500"> / {targets.targetCalories}</span>
              </div>
              <div className="mb-2 h-2 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full transition-all ${caloriesRemaining < 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className={`text-sm ${caloriesRemaining < 0 ? "text-rose-500" : "text-slate-500"}`}>
                {caloriesRemaining >= 0
                  ? `${caloriesRemaining} ${language === "ro" ? "rămase" : "remaining"}`
                  : `${Math.abs(caloriesRemaining)} ${language === "ro" ? "peste țintă" : "over target"}`}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-sky-500" />
                <h3 className="font-semibold text-slate-900">{language === "ro" ? "Obiectiv" : "Goal"}</h3>
              </div>
              <div className="flex gap-2">
                {[
                  { value: "lose", labelRo: "Slăbește", labelEn: "Lose" },
                  { value: "maintain", labelRo: "Menține", labelEn: "Maintain" },
                  { value: "gain", labelRo: "Crește", labelEn: "Gain" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGoalType(option.value as GoalMode)}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      goalType === option.value
                        ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {language === "ro" ? option.labelRo : option.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-violet-500" />
                <h3 className="font-semibold text-slate-900">{language === "ro" ? "Consumat" : "Consumed"}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Protein</span>
                  <span className="font-medium text-slate-900">
                    {macrosConsumed.protein}g / {targets.proteinGrams}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Carbs</span>
                  <span className="font-medium text-slate-900">
                    {macrosConsumed.carbs}g / {targets.carbsGrams}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fat</span>
                  <span className="font-medium text-slate-900">
                    {macrosConsumed.fat}g / {targets.fatGrams}g
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {language === "ro" ? "Adaugă aliment" : "Add food"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {language === "ro"
                    ? "Poți folosi text, poză sau ambele. Gemini estimează alimentul, cantitatea și valorile."
                    : "Use text, a photo, or both. Gemini estimates the food, portion, and nutrition values."}
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <textarea
                  value={foodDescription}
                  onChange={(event) => {
                    setFoodDescription(event.target.value);
                    setTrackerMessage(null);
                  }}
                  placeholder={
                    language === "ro"
                      ? "Ex: pui cu orez și salată sau iaurt grecesc cu fructe"
                      : "Example: chicken with rice and salad or Greek yogurt with fruit"
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={quantityText}
                    onChange={(event) => {
                      setQuantityText(event.target.value);
                      setTrackerMessage(null);
                    }}
                    placeholder={language === "ro" ? "Cantitate, ex: 250 g / 2 felii" : "Quantity, e.g. 250 g / 2 slices"}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  <select
                    value={selectedMealType}
                    onChange={(event) => setSelectedMealType(event.target.value as MealType)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                  >
                    <option value="breakfast">{language === "ro" ? "Mic dejun" : "Breakfast"}</option>
                    <option value="lunch">{language === "ro" ? "Prânz" : "Lunch"}</option>
                    <option value="dinner">{language === "ro" ? "Cină" : "Dinner"}</option>
                    <option value="snack">{language === "ro" ? "Gustare" : "Snack"}</option>
                  </select>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Meal preview"
                      className="h-48 w-full rounded-2xl object-cover"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">{selectedImage?.name}</p>
                      <button
                        onClick={clearSelectedImage}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <X className="h-4 w-4" />
                        {language === "ro" ? "Șterge" : "Remove"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-full min-h-[192px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-center text-sm text-slate-500 transition hover:border-emerald-300 hover:text-slate-700"
                  >
                    <Camera className="h-8 w-8 text-emerald-500" />
                    <span>
                      {language === "ro"
                        ? "Încarcă o poză cu masa pentru estimare de cantitate și aliment."
                        : "Upload a meal photo for food and portion estimation."}
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {language === "ro"
                  ? "Pentru rezultate mai bune, descrie preparatul și adaugă și cantitatea."
                  : "For better results, describe the meal and include the quantity."}
              </p>
              <button
                onClick={logFood}
                disabled={isLogging || (!foodDescription.trim() && !selectedImage)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
              >
                {isLogging ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                {language === "ro" ? "Analizează și loghează" : "Analyze and log"}
              </button>
            </div>

            <div className="mt-4">
              <StatusBanner message={trackerMessage} />
            </div>
          </div>

          {lastAnalysis && (
            <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    {language === "ro" ? "Ultima analiză" : "Latest analysis"}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">{lastAnalysis.displayName}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {lastAnalysis.portionDescription} • {getConfidenceLabel(lastAnalysis.confidence, language)}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{lastAnalysis.reasoning}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Calories</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{lastAnalysis.calories}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Protein</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{lastAnalysis.protein}g</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Carbs</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{lastAnalysis.carbs}g</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Fat</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{lastAnalysis.fat}g</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {language === "ro" ? "Componente detectate" : "Detected components"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lastAnalysis.recognizedFoods.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {language === "ro" ? "Atenționări" : "Warnings"}
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    {lastAnalysis.warnings.length > 0 ? (
                      lastAnalysis.warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))
                    ) : (
                      <p>{language === "ro" ? "Nu există avertizări majore." : "No major warnings."}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h3 className="font-semibold text-slate-900">{language === "ro" ? "Astăzi" : "Today"}</h3>
            </div>
            {todayEntries.length === 0 ? (
              <div className="p-10 text-center">
                <Apple className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="text-slate-500">
                  {language === "ro" ? "Nu ai logat nimic astăzi." : "No food logged today."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayEntries.map((entry) => {
                  const Icon = getMealIcon(entry.mealType);

                  return (
                    <div key={entry.id} className="flex flex-col gap-4 p-4 hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                          <Icon className="h-5 w-5 text-emerald-700" />
                        </div>
                        {entry.imageUrl ? (
                          <img
                            src={entry.imageUrl}
                            alt={entry.name}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                        ) : null}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">{entry.name}</p>
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                              {getAnalysisSourceLabel(entry.analysisSource, language)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {getMealTypeLabel(entry.mealType, language)}
                            {entry.quantityText ? ` • ${entry.quantityText}` : ""}
                            {entry.estimatedWeightGrams ? ` • ~${entry.estimatedWeightGrams} g` : ""}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {entry.protein}g P • {entry.carbs}g C • {entry.fat}g F
                            {entry.fiber ? ` • ${entry.fiber}g fibre` : ""}
                          </p>
                          {entry.warnings && entry.warnings.length > 0 ? (
                            <p className="mt-2 text-sm text-amber-600">{entry.warnings[0]}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{entry.calories} kcal</p>
                        <p className="text-sm capitalize text-slate-500">
                          {getConfidenceLabel(entry.analysisConfidence, language)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <ChefHat className="h-5 w-5 text-emerald-500" />
                  {language === "ro" ? "Plan alimentar personalizat" : "Personalized meal plan"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {language === "ro"
                    ? `Gemini folosește profilul tău, țintele actuale și ${profile.mealsPerDay} mese pe zi pentru a genera planul.`
                    : `Gemini uses your profile, current targets, and ${profile.mealsPerDay} meals per day to generate the plan.`}
                </p>
              </div>
              <button
                onClick={generateMealPlan}
                disabled={isGeneratingPlan}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
              >
                {isGeneratingPlan ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {language === "ro" ? "Generează cu Gemini" : "Generate with Gemini"}
              </button>
            </div>

            <div className="mt-4">
              <StatusBanner message={planMessage} />
            </div>
          </div>

          {generatedPlan ? (
            <>
              <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      {language === "ro" ? "Plan generat" : "Generated plan"}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">{generatedPlan.title}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{generatedPlan.summary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Calories</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">{generatedPlan.dailyTargets.calories}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Protein</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">{generatedPlan.dailyTargets.protein}g</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Carbs</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">{generatedPlan.dailyTargets.carbs}g</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Water</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">{generatedPlan.dailyTargets.waterLiters}L</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                {generatedPlan.meals.map((meal, index) => {
                  const Icon = getMealIcon(meal.slot);

                  return (
                    <div key={`${meal.slot}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
                            <Icon className="h-5 w-5 text-emerald-700" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">{getMealTypeLabel(meal.slot, language)} • {meal.time}</p>
                            <h3 className="font-semibold text-slate-900">{meal.title}</h3>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{meal.calories} kcal</p>
                      </div>

                      <p className="mt-3 text-sm text-slate-500">{meal.quantity}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {meal.foods.map((food) => (
                          <span
                            key={food}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                          >
                            {food}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                        <div>
                          <p className="text-slate-400">Protein</p>
                          <p className="mt-1 font-semibold text-slate-900">{meal.protein}g</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Carbs</p>
                          <p className="mt-1 font-semibold text-slate-900">{meal.carbs}g</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Fat</p>
                          <p className="mt-1 font-semibold text-slate-900">{meal.fat}g</p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">{meal.reason}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <h4 className="mb-3 font-semibold text-slate-900">
                    {language === "ro" ? "Recomandări" : "Coaching tips"}
                  </h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    {generatedPlan.coachingTips.map((tip) => (
                      <p key={tip}>• {tip}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <h4 className="mb-3 font-semibold text-slate-900">
                    {language === "ro" ? "Lista de cumpărături" : "Shopping list"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedPlan.shoppingList.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                    <Droplets className="h-4 w-4 text-sky-500" />
                    {language === "ro" ? "Hidratare" : "Hydration"}
                  </h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    {generatedPlan.hydrationPlan.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                  <Coffee className="h-5 w-5 text-yellow-500" />
                  {language === "ro" ? "Mic dejun" : "Breakfast"}
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  {dietSuggestions.breakfast.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                  <Sun className="h-5 w-5 text-orange-500" />
                  {language === "ro" ? "Prânz" : "Lunch"}
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  {dietSuggestions.lunch.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                  <Moon className="h-5 w-5 text-violet-500" />
                  {language === "ro" ? "Cină" : "Dinner"}
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  {dietSuggestions.dinner.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                  <Apple className="h-5 w-5 text-emerald-500" />
                  {language === "ro" ? "Gustări" : "Snacks"}
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  {dietSuggestions.snacks.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
