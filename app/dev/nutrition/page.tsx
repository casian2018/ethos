"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useEffectEvent, useRef, useState, type ChangeEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  writeBatch,
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
  estimateBarcodeNutrition,
  buildDailyNutritionInsights,
  fallbackAnalyzeNutrition,
  getDietPlanSuggestions,
  getMealTypeLabel,
  getNutritionPlanDelta,
  getNutritionPlanTotals,
  type BarcodeNutritionProduct,
  type MealType,
  type NutritionAnalysis,
  type NutritionMealPlan,
  type NutritionPlanSource,
  type SavedNutritionPlan,
  normalizeSavedNutritionPlan,
} from "@/lib/nutrition";

const auth = firebaseAuth!;
const db = firebaseDb!;
const storage = firebaseStorage;

interface FoodEntry {
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
  barcode?: string;
  brand?: string;
  imageUrl?: string;
  mealType: MealType;
  timestamp?: Date;
  date?: string;
}

interface FoodEntryRecord extends FoodEntry {
  id: string;
}

type StatusMessage = {
  type: "error" | "success" | "info";
  text: string;
};

type DetectedBarcode = {
  rawValue?: string;
};

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

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
  if (source === "barcode") {
    return language === "ro" ? "Cod de bare" : "Barcode";
  }

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

function parseFirestoreDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function getDateSortValue(value: Date | undefined): number {
  return value instanceof Date ? value.getTime() : 0;
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function formatSavedPlanDate(date: Date, language: "ro" | "en"): string {
  return date.toLocaleDateString(language === "ro" ? "ro-RO" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEntryTime(date: Date | undefined, language: "ro" | "en"): string {
  if (!date) {
    return "";
  }

  return date.toLocaleTimeString(language === "ro" ? "ro-RO" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPlanSourceLabel(source: NutritionPlanSource, language: "ro" | "en"): string {
  if (source === "ai") {
    return language === "ro" ? "AI" : "AI";
  }

  return language === "ro" ? "Fallback" : "Fallback";
}

function buildShoppingListText(plan: NutritionMealPlan, language: "ro" | "en"): string {
  const title = language === "ro" ? "Lista de cumpărături" : "Shopping list";
  return [title, ...plan.shoppingList.map((item) => `- ${item}`)].join("\n");
}

function normalizeBarcode(value: string): string {
  return value.replace(/\D/g, "").trim();
}

function getBarcodeDetectorConstructor(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.BarcodeDetector || null;
}

function formatNutritionNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function cleanupBarcodeScanner({
  videoRef,
  streamRef,
  frameRef,
  detectorRef,
}: {
  videoRef: { current: HTMLVideoElement | null };
  streamRef: { current: MediaStream | null };
  frameRef: { current: number | null };
  detectorRef: { current: BarcodeDetectorInstance | null };
}) {
  if (frameRef.current !== null) {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }

  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  detectorRef.current = null;

  const video = videoRef.current;
  if (video) {
    video.pause();
    video.srcObject = null;
  }
}

export default function NutritionPage() {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeVideoRef = useRef<HTMLVideoElement>(null);
  const barcodeStreamRef = useRef<MediaStream | null>(null);
  const barcodeFrameRef = useRef<number | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetectorInstance | null>(null);

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
  const [todayEntries, setTodayEntries] = useState<FoodEntryRecord[]>([]);
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null);
  const [waterConsumedMl, setWaterConsumedMl] = useState(0);
  const [isUpdatingWater, setIsUpdatingWater] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<NutritionAnalysis | null>(null);
  const [trackerMessage, setTrackerMessage] = useState<StatusMessage | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeProduct, setBarcodeProduct] = useState<BarcodeNutritionProduct | null>(null);
  const [barcodeQuantityGrams, setBarcodeQuantityGrams] = useState("100");
  const [barcodeMessage, setBarcodeMessage] = useState<StatusMessage | null>(null);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
  const [isLoggingBarcode, setIsLoggingBarcode] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStartingScanner, setIsStartingScanner] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<NutritionMealPlan | null>(null);
  const [generatedPlanSource, setGeneratedPlanSource] = useState<NutritionPlanSource>("fallback");
  const [savedPlans, setSavedPlans] = useState<SavedNutritionPlan[]>([]);
  const [selectedSavedPlanId, setSelectedSavedPlanId] = useState<string | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);
  const [copyingShoppingList, setCopyingShoppingList] = useState(false);
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
            const nextGoalType = getGoalModeFromGoals(data.goals, data.priorityGoal);
            const nextTargets = calculateNutritionTargets(data, nextGoalType);
            setProfile(data);
            setGoalType(nextGoalType);
            setTargets(nextTargets);
            const fallbackPlan = buildFallbackMealPlan(data, nextTargets, language);
            await Promise.all([
              loadTodayEntries(currentUser.uid),
              loadTodayHydration(currentUser.uid),
              loadSavedPlans(currentUser.uid, fallbackPlan),
            ]);
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
  }, [language]);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setScannerSupported(Boolean(getBarcodeDetectorConstructor() && navigator.mediaDevices?.getUserMedia));
  }, []);

  const lookupBarcode = async (value = barcodeInput, scanned = false) => {
    const normalizedBarcode = normalizeBarcode(value);
    if (normalizedBarcode.length < 8) {
      setBarcodeMessage({
        type: "error",
        text:
          language === "ro"
            ? "Introdu un cod de bare valid cu cel puțin 8 cifre."
            : "Enter a valid barcode with at least 8 digits.",
      });
      return;
    }

    setIsLookingUpBarcode(true);
    setBarcodeMessage(null);

    try {
      const response = await fetch(
        `/api/nutrition/barcode?code=${encodeURIComponent(normalizedBarcode)}&language=${language}`
      );
      const payload = (await response.json()) as {
        product?: BarcodeNutritionProduct;
        error?: string;
      };

      if (!response.ok || !payload.product) {
        throw new Error(payload.error || "Failed to look up barcode.");
      }

      setBarcodeInput(normalizedBarcode);
      setBarcodeProduct(payload.product);
      setBarcodeQuantityGrams(String(payload.product.quantityHintGrams || 100));
      setBarcodeMessage({
        type: "success",
        text:
          language === "ro"
            ? scanned
              ? "Produsul a fost identificat din scanare."
              : "Produsul a fost găsit."
            : scanned
              ? "The product was identified from the scan."
              : "The product was found.",
      });
    } catch (error) {
      console.error("Error looking up barcode:", error);
      setBarcodeProduct(null);
      setBarcodeMessage({
        type: "error",
        text:
          error instanceof Error && error.message
            ? error.message
            : language === "ro"
              ? "Nu am putut găsi produsul pentru acest cod."
              : "Could not find a product for this barcode.",
      });
    } finally {
      setIsLookingUpBarcode(false);
    }
  };

  const scanBarcodeFrame = useEffectEvent(async () => {
    const video = barcodeVideoRef.current;
    const Detector = getBarcodeDetectorConstructor();

    if (!video || !Detector) {
      return;
    }

    if (!barcodeDetectorRef.current) {
      barcodeDetectorRef.current = new Detector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
      });
    }

    try {
      if (video.readyState >= 2) {
        const detected = await barcodeDetectorRef.current.detect(video);
        const code = normalizeBarcode(detected.find((item) => item.rawValue)?.rawValue || "");
        if (code) {
          cleanupBarcodeScanner({
            videoRef: barcodeVideoRef,
            streamRef: barcodeStreamRef,
            frameRef: barcodeFrameRef,
            detectorRef: barcodeDetectorRef,
          });
          setIsScannerOpen(false);
          setBarcodeInput(code);
          void lookupBarcode(code, true);
          return;
        }
      }

      barcodeFrameRef.current = requestAnimationFrame(() => {
        void scanBarcodeFrame();
      });
    } catch (error) {
      console.error("Error scanning barcode:", error);
      cleanupBarcodeScanner({
        videoRef: barcodeVideoRef,
        streamRef: barcodeStreamRef,
        frameRef: barcodeFrameRef,
        detectorRef: barcodeDetectorRef,
      });
      setIsScannerOpen(false);
      setBarcodeMessage({
        type: "error",
        text:
          language === "ro"
            ? "Scanarea nu a putut continua. Încearcă din nou sau introdu codul manual."
            : "Scanning could not continue. Try again or enter the barcode manually.",
      });
    }
  });

  useEffect(() => {
    if (!isScannerOpen) {
      return;
    }

    let disposed = false;

    const startScanner = async () => {
      const Detector = getBarcodeDetectorConstructor();
      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
        setBarcodeMessage({
          type: "info",
          text:
            language === "ro"
              ? "Browserul curent nu suportă scanarea directă. Poți introduce codul manual."
              : "This browser does not support direct scanning. You can enter the barcode manually.",
        });
        setIsScannerOpen(false);
        return;
      }

      setIsStartingScanner(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        barcodeStreamRef.current = stream;

        const video = barcodeVideoRef.current;
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          setIsScannerOpen(false);
          return;
        }

        video.srcObject = stream;
        await video.play();
        setIsStartingScanner(false);
        barcodeFrameRef.current = requestAnimationFrame(() => {
          void scanBarcodeFrame();
        });
      } catch (error) {
        console.error("Error starting barcode scanner:", error);
        setIsStartingScanner(false);
        setIsScannerOpen(false);
        setBarcodeMessage({
          type: "error",
          text:
            language === "ro"
              ? "Camera nu a putut fi pornită. Verifică permisiunea și încearcă din nou."
              : "The camera could not be started. Check permissions and try again.",
        });
      }
    };

    void startScanner();

    return () => {
      disposed = true;
      setIsStartingScanner(false);
      cleanupBarcodeScanner({
        videoRef: barcodeVideoRef,
        streamRef: barcodeStreamRef,
        frameRef: barcodeFrameRef,
        detectorRef: barcodeDetectorRef,
      });
    };
  }, [isScannerOpen, language]);

  useEffect(() => {
    return () => {
      cleanupBarcodeScanner({
        videoRef: barcodeVideoRef,
        streamRef: barcodeStreamRef,
        frameRef: barcodeFrameRef,
        detectorRef: barcodeDetectorRef,
      });
    };
  }, []);

  const loadTodayEntries = async (userId: string) => {
    try {
      const entriesQuery = query(
        collection(db, "food_entries"),
        where("userId", "==", userId),
        where("date", "==", getTodayKey())
      );

      const snapshot = await getDocs(entriesQuery);
      const entries: FoodEntryRecord[] = [];
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      snapshot.forEach((entryDoc) => {
        const data = entryDoc.data() as FoodEntry & { timestamp?: unknown };
        entries.push({
          id: entryDoc.id,
          ...data,
          timestamp: data.timestamp ? parseFirestoreDate(data.timestamp) : undefined,
        });
        totalCalories += data.calories || 0;
        totalProtein += data.protein || 0;
        totalCarbs += data.carbs || 0;
        totalFat += data.fat || 0;
      });

      entries.sort((left, right) => getDateSortValue(right.timestamp) - getDateSortValue(left.timestamp));

      setTodayEntries(entries);
      setCaloriesConsumed(totalCalories);
      setMacrosConsumed({ protein: totalProtein, carbs: totalCarbs, fat: totalFat });
    } catch (err) {
      console.error("Error loading food entries:", err);
    }
  };

  const loadTodayHydration = async (userId: string) => {
    try {
      const hydrationDoc = await getDoc(doc(db, "users", userId, "hydration_logs", getTodayKey()));
      if (!hydrationDoc.exists()) {
        setWaterConsumedMl(0);
        return;
      }

      const amountMl = Number(hydrationDoc.data().amountMl || 0);
      setWaterConsumedMl(Number.isFinite(amountMl) ? amountMl : 0);
    } catch (err) {
      console.error("Error loading hydration log:", err);
      setWaterConsumedMl(0);
    }
  };

  const loadSavedPlans = async (userId: string, fallbackPlan: NutritionMealPlan) => {
    setIsLoadingPlans(true);

    try {
      const plansQuery = query(collection(db, "users", userId, "nutrition_plans"), orderBy("updatedAt", "desc"));
      const snapshot = await getDocs(plansQuery);
      const plans = snapshot.docs.map((planDoc) =>
        normalizeSavedNutritionPlan(
          planDoc.id,
          planDoc.data() as Record<string, unknown>,
          fallbackPlan
        )
      );

      setSavedPlans(plans);

      const activePlan = plans.find((plan) => plan.isActive) || plans[0] || null;
      if (activePlan) {
        setGeneratedPlan(activePlan.plan);
        setGeneratedPlanSource(activePlan.source);
        setSelectedSavedPlanId(activePlan.id);
      } else {
        setGeneratedPlan(null);
        setSelectedSavedPlanId(null);
      }
    } catch (err) {
      console.error("Error loading saved nutrition plans:", err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const savePlanSnapshot = async (plan: NutritionMealPlan, source: NutritionPlanSource) => {
    if (!user) {
      return null;
    }

    setIsSavingPlan(true);

    try {
      const plansRef = collection(db, "users", user.uid, "nutrition_plans");
      const existingPlans = await getDocs(plansRef);
      const batch = writeBatch(db);
      const newPlanRef = doc(plansRef);

      existingPlans.docs.forEach((savedDoc) => {
        if (savedDoc.data().isActive) {
          batch.update(savedDoc.ref, {
            isActive: false,
            updatedAt: serverTimestamp(),
          });
        }
      });

      batch.set(newPlanRef, {
        title: plan.title,
        summary: plan.summary,
        goalMode: goalType,
        language,
        source,
        isActive: true,
        plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      setSelectedSavedPlanId(newPlanRef.id);
      return newPlanRef.id;
    } catch (err) {
      console.error("Error saving nutrition plan:", err);
      throw err;
    } finally {
      setIsSavingPlan(false);
    }
  };

  const activateSavedPlan = async (planId: string) => {
    if (!user) {
      return;
    }

    setChangingPlanId(planId);

    try {
      const plansRef = collection(db, "users", user.uid, "nutrition_plans");
      const snapshot = await getDocs(plansRef);
      const batch = writeBatch(db);

      snapshot.docs.forEach((savedDoc) => {
        batch.update(savedDoc.ref, {
          isActive: savedDoc.id === planId,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      const plan = savedPlans.find((item) => item.id === planId);
      if (plan) {
        setGeneratedPlan(plan.plan);
        setGeneratedPlanSource(plan.source);
        setSelectedSavedPlanId(plan.id);
      }

      setSavedPlans((currentPlans) =>
        currentPlans.map((plan) => ({
          ...plan,
          isActive: plan.id === planId,
        }))
      );
      setPlanMessage({
        type: "success",
        text:
          language === "ro"
            ? "Planul salvat a fost setat ca activ."
            : "The saved plan was set as active.",
      });
    } catch (err) {
      console.error("Error activating nutrition plan:", err);
      setPlanMessage({
        type: "error",
        text:
          language === "ro"
            ? "Nu am putut activa planul selectat."
            : "Could not activate the selected plan.",
      });
    } finally {
      setChangingPlanId(null);
    }
  };

  const deleteSavedPlan = async (planId: string) => {
    if (!user || !profile || !targets) {
      return;
    }

    setChangingPlanId(planId);

    try {
      await deleteDoc(doc(db, "users", user.uid, "nutrition_plans", planId));
      const remainingPlans = savedPlans.filter((plan) => plan.id !== planId);
      const deletedPlan = savedPlans.find((plan) => plan.id === planId);

      setSavedPlans(remainingPlans);

      if (deletedPlan?.isActive && remainingPlans.length > 0) {
        await activateSavedPlan(remainingPlans[0].id);
      } else if (remainingPlans.length === 0) {
        setGeneratedPlan(null);
        setSelectedSavedPlanId(null);
      }

      if (!deletedPlan?.isActive) {
        setPlanMessage({
          type: "success",
          text:
            language === "ro"
              ? "Planul salvat a fost șters."
              : "The saved plan was deleted.",
        });
      }
    } catch (err) {
      console.error("Error deleting nutrition plan:", err);
      setPlanMessage({
        type: "error",
        text:
          language === "ro"
            ? "Nu am putut șterge planul."
            : "Could not delete the plan.",
      });
    } finally {
      setChangingPlanId(null);
    }
  };

  const updateHydration = async (nextAmountMl: number) => {
    if (!user) {
      return;
    }

    setIsUpdatingWater(true);

    try {
      const safeAmount = Math.max(0, nextAmountMl);
      await setDoc(
        doc(db, "users", user.uid, "hydration_logs", getTodayKey()),
        {
          date: getTodayKey(),
          amountMl: safeAmount,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setWaterConsumedMl(safeAmount);
    } catch (err) {
      console.error("Error updating hydration log:", err);
      setTrackerMessage({
        type: "error",
        text:
          language === "ro"
            ? "Nu am putut actualiza hidratarea."
            : "Could not update hydration.",
      });
    } finally {
      setIsUpdatingWater(false);
    }
  };

  const deleteFoodEntry = async (entryId: string) => {
    if (!user) {
      return;
    }

    setRemovingEntryId(entryId);

    try {
      await deleteDoc(doc(db, "food_entries", entryId));
      await loadTodayEntries(user.uid);
      setTrackerMessage({
        type: "success",
        text:
          language === "ro"
            ? "Masa a fost ștearsă din jurnal."
            : "The meal was removed from the log.",
      });
    } catch (err) {
      console.error("Error deleting food entry:", err);
      setTrackerMessage({
        type: "error",
        text:
          language === "ro"
            ? "Nu am putut șterge masa."
            : "Could not remove the meal.",
      });
    } finally {
      setRemovingEntryId(null);
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

  const closeScanner = () => {
    cleanupBarcodeScanner({
      videoRef: barcodeVideoRef,
      streamRef: barcodeStreamRef,
      frameRef: barcodeFrameRef,
      detectorRef: barcodeDetectorRef,
    });
    setIsStartingScanner(false);
    setIsScannerOpen(false);
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

  const logBarcodeProduct = async () => {
    if (!user || !barcodeProduct) {
      return;
    }

    const grams = Number.parseInt(barcodeQuantityGrams, 10);
    if (!Number.isFinite(grams) || grams <= 0) {
      setBarcodeMessage({
        type: "error",
        text:
          language === "ro"
            ? "Introdu un gramaj valid pentru produs."
            : "Enter a valid gram amount for the product.",
      });
      return;
    }

    setIsLoggingBarcode(true);
    setBarcodeMessage(null);

    try {
      const estimate = estimateBarcodeNutrition(barcodeProduct, grams);
      const notes = [
        language === "ro"
          ? `Valori estimate din Open Food Facts pentru ${estimate.grams} g.`
          : `Estimated from Open Food Facts for ${estimate.grams} g.`,
      ];

      if (barcodeProduct.nutriscore) {
        notes.push(`Nutri-Score ${barcodeProduct.nutriscore}`);
      }

      if (barcodeProduct.novaGroup) {
        notes.push(`NOVA ${barcodeProduct.novaGroup}`);
      }

      await addDoc(collection(db, "food_entries"), {
        userId: user.uid,
        name: barcodeProduct.name,
        brand: barcodeProduct.brand,
        barcode: barcodeProduct.barcode,
        rawDescription: `${barcodeProduct.brand} ${barcodeProduct.name}`.trim(),
        quantityText: `${estimate.grams} g`,
        estimatedWeightGrams: estimate.grams,
        calories: estimate.calories,
        protein: estimate.protein,
        carbs: estimate.carbs,
        fat: estimate.fat,
        fiber: estimate.fiber,
        sugar: estimate.sugar,
        sodiumMg: estimate.sodiumMg,
        hydrationMl: 0,
        recognizedFoods: [barcodeProduct.name, barcodeProduct.brand].filter(Boolean),
        warnings: [],
        analysisNotes: notes.join(" • "),
        analysisConfidence: "high",
        analysisSource: "barcode",
        imageUrl: barcodeProduct.imageUrl || "",
        mealType: selectedMealType,
        date: getTodayKey(),
        timestamp: serverTimestamp(),
      });

      setLastAnalysis({
        displayName: barcodeProduct.name,
        recognizedFoods: [barcodeProduct.name, barcodeProduct.brand].filter(Boolean),
        portionDescription: `${estimate.grams} g`,
        estimatedWeightGrams: estimate.grams,
        calories: estimate.calories,
        protein: estimate.protein,
        carbs: estimate.carbs,
        fat: estimate.fat,
        fiber: estimate.fiber,
        sugar: estimate.sugar,
        sodiumMg: estimate.sodiumMg,
        hydrationMl: 0,
        reasoning: notes.join(". "),
        warnings: [],
        confidence: "high",
        analysisSource: "barcode",
      });

      await loadTodayEntries(user.uid);
      setBarcodeMessage({
        type: "success",
        text:
          language === "ro"
            ? "Produsul scanat a fost logat în jurnalul de azi."
            : "The scanned product was logged to today’s journal.",
      });
    } catch (error) {
      console.error("Error logging barcode product:", error);
      setBarcodeMessage({
        type: "error",
        text:
          language === "ro"
            ? "Nu am putut salva produsul scanat."
            : "Could not save the scanned product.",
      });
    } finally {
      setIsLoggingBarcode(false);
    }
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
    if (!user || !profile || !targets) {
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

      const source: NutritionPlanSource = payload.usedFallback ? "fallback" : "ai";
      setGeneratedPlan(payload.plan);
      setGeneratedPlanSource(source);
      const savedPlanId = await savePlanSnapshot(payload.plan, source);
      if (savedPlanId) {
        setSavedPlans((currentPlans) =>
          currentPlans.map((plan) => ({ ...plan, isActive: false }))
        );
        setSavedPlans((currentPlans) => [
          {
            id: savedPlanId,
            title: payload.plan!.title,
            summary: payload.plan!.summary,
            goalMode: goalType,
            language,
            source,
            isActive: true,
            plan: payload.plan!,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...currentPlans,
        ]);
        setSelectedSavedPlanId(savedPlanId);
      }
      setPlanMessage(
        payload.warning
          ? { type: "info", text: payload.warning }
          : {
              type: "success",
              text:
                language === "ro"
                  ? "Planul alimentar a fost generat și salvat din profilul tău."
                  : "The meal plan was generated and saved from your profile.",
            }
      );
    } catch (err) {
      console.error("Error generating meal plan:", err);
      const fallbackPlan = buildFallbackMealPlan(profile, targets, language);
      setGeneratedPlan(fallbackPlan);
      setGeneratedPlanSource("fallback");
      try {
        const savedPlanId = await savePlanSnapshot(fallbackPlan, "fallback");
        if (savedPlanId) {
          setSavedPlans((currentPlans) =>
            currentPlans.map((plan) => ({ ...plan, isActive: false }))
          );
          setSavedPlans((currentPlans) => [
            {
              id: savedPlanId,
              title: fallbackPlan.title,
              summary: fallbackPlan.summary,
              goalMode: goalType,
              language,
              source: "fallback",
              isActive: true,
              plan: fallbackPlan,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...currentPlans,
          ]);
          setSelectedSavedPlanId(savedPlanId);
        }
      } catch (saveError) {
        console.error("Error saving fallback nutrition plan:", saveError);
      }
      setPlanMessage({
        type: "info",
        text:
          language === "ro"
            ? "Gemini nu a fost disponibil, așa că am afișat și salvat planul fallback din profil."
            : "Gemini was unavailable, so the profile-based fallback plan was shown and saved.",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const copyShoppingList = async () => {
    if (!generatedPlan) {
      return;
    }

    if (!navigator?.clipboard) {
      setPlanMessage({
        type: "error",
        text:
          language === "ro"
            ? "Clipboard nu este disponibil în acest browser."
            : "Clipboard is not available in this browser.",
      });
      return;
    }

    setCopyingShoppingList(true);

    try {
      await navigator.clipboard.writeText(buildShoppingListText(generatedPlan, language));
      setPlanMessage({
        type: "success",
        text:
          language === "ro"
            ? "Lista de cumpărături a fost copiată."
            : "The shopping list was copied.",
      });
    } catch (err) {
      console.error("Error copying shopping list:", err);
      setPlanMessage({
        type: "error",
        text:
          language === "ro"
            ? "Nu am putut copia lista de cumpărături."
            : "Could not copy the shopping list.",
      });
    } finally {
      setCopyingShoppingList(false);
    }
  };

  if (loading) {
    return (
      <div className="ethos-shell-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (needsProfile || !profile || !targets) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">🥗 Nutrition</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            {language === "ro" ? "Completează profilul detaliat" : "Complete the detailed profile"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {language === "ro"
              ? "Nutriția folosește acum profilul complet pentru ținte calorice, analiză cu Gemini și generare de plan alimentar."
              : "Nutrition now uses your full profile for calorie targets, Gemini analysis, and meal-plan generation."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
  const waterTargetMl = Math.round(targets.waterLiters * 1000);
  const waterRemainingMl = Math.max(waterTargetMl - waterConsumedMl, 0);
  const waterProgressPercent = Math.min((waterConsumedMl / Math.max(waterTargetMl, 1)) * 100, 100);
  const goalTags = formatTagList(profile.goals, goalOptions, language);
  const dietSuggestions = getDietPlanSuggestions(profile, language);
  const dailyInsights = buildDailyNutritionInsights({
    language,
    targets,
    consumed: {
      calories: caloriesConsumed,
      protein: macrosConsumed.protein,
      carbs: macrosConsumed.carbs,
      fat: macrosConsumed.fat,
    },
    waterConsumedMl,
  });
  const activeSavedPlan = savedPlans.find((plan) => plan.id === selectedSavedPlanId) || null;
  const planTotals = generatedPlan ? getNutritionPlanTotals(generatedPlan) : null;
  const planDelta = generatedPlan ? getNutritionPlanDelta(generatedPlan) : null;
  const barcodeEstimate = barcodeProduct
    ? estimateBarcodeNutrition(
        barcodeProduct,
        Number.parseInt(barcodeQuantityGrams, 10) || barcodeProduct.quantityHintGrams || 100
      )
    : null;

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
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
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="ethos-chip">📷 {language === "ro" ? "poză" : "photo"}</span>
          <span className="ethos-chip">🧾 {language === "ro" ? "barcode" : "barcode"}</span>
          <span className="ethos-chip">💧 {language === "ro" ? "hidratare" : "hydration"}</span>
        </div>
      </header>

      <div className="mb-6 rounded-[32px] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/40 sm:p-6">
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
          <div className="-mx-1 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible sm:pb-0">
            <div className="grid min-w-max grid-flow-col auto-cols-[148px] gap-3 sm:min-w-0 sm:grid-flow-row sm:grid-cols-4">
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
      </div>

      <div className="mb-6 grid w-full max-w-md grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab("tracker")}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition sm:px-6 ${
            activeTab === "tracker" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          {language === "ro" ? "Tracker" : "Tracker"}
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition sm:px-6 ${
            activeTab === "plan" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          {language === "ro" ? "Plan alimentar" : "Meal plan"}
        </button>
      </div>

      {activeTab === "tracker" ? (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
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

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-sky-500" />
                <h3 className="font-semibold text-slate-900">{language === "ro" ? "Obiectiv" : "Goal"}</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "lose", labelRo: "Slăbește", labelEn: "Lose" },
                  { value: "maintain", labelRo: "Menține", labelEn: "Maintain" },
                  { value: "gain", labelRo: "Crește", labelEn: "Gain" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGoalType(option.value as GoalMode)}
                    className={`rounded-xl px-2 py-2 text-xs font-medium transition sm:px-3 sm:text-sm ${
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

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
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

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-sky-500" />
                <h3 className="font-semibold text-slate-900">{language === "ro" ? "Hidratare" : "Hydration"}</h3>
              </div>
              <div className="mb-1 text-3xl font-bold text-slate-900">
                {(waterConsumedMl / 1000).toFixed(1)}
                <span className="text-lg font-normal text-slate-500"> / {targets.waterLiters}L</span>
              </div>
              <div className="mb-2 h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-sky-500 transition-all"
                  style={{ width: `${waterProgressPercent}%` }}
                />
              </div>
              <p className="text-sm text-slate-500">
                {waterRemainingMl > 0
                  ? `${(waterRemainingMl / 1000).toFixed(1)}L ${language === "ro" ? "rămase" : "remaining"}`
                  : language === "ro"
                    ? "Ținta de apă este atinsă"
                    : "Water target reached"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[250, 500, 750].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => updateHydration(waterConsumedMl + amount)}
                    disabled={isUpdatingWater}
                    className="rounded-xl bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    +{amount}ml
                  </button>
                ))}
                <button
                  onClick={() => updateHydration(0)}
                  disabled={isUpdatingWater || waterConsumedMl === 0}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:text-slate-300"
                >
                  {language === "ro" ? "Reset" : "Reset"}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dailyInsights.map((insight) => (
              <div
                key={insight.title}
                className={`rounded-3xl border p-4 sm:p-5 ${
                  insight.tone === "good"
                    ? "border-emerald-200 bg-emerald-50/40"
                    : insight.tone === "warning"
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-sky-200 bg-sky-50/40"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{insight.description}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                      className="h-40 w-full rounded-2xl object-cover sm:h-48"
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="break-all text-sm text-slate-500">{selectedImage?.name}</p>
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
                    className="flex h-full min-h-[176px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-center text-sm text-slate-500 transition hover:border-emerald-300 hover:text-slate-700 sm:min-h-[192px]"
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
              <div className="w-full sm:w-auto">
                <button
                  onClick={logFood}
                  disabled={isLogging || (!foodDescription.trim() && !selectedImage)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300 sm:w-auto"
                >
                  {isLogging ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  {language === "ro" ? "Analizează și loghează" : "Analyze and log"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <StatusBanner message={trackerMessage} />
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {language === "ro" ? "Scanează un produs ambalat" : "Scan a packaged product"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {language === "ro"
                    ? "Caută după cod de bare sau scanează cu camera, apoi loghează produsul cu gramajul corect."
                    : "Look up a product by barcode or scan it with the camera, then log it with the right amount."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void lookupBarcode()}
                  disabled={isLookingUpBarcode || barcodeInput.trim().length < 8}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                >
                  {isLookingUpBarcode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {language === "ro" ? "Caută produsul" : "Find product"}
                </button>
                <button
                  onClick={() => {
                    if (!scannerSupported) {
                      setBarcodeMessage({
                        type: "info",
                        text:
                          language === "ro"
                            ? "Browserul curent nu suportă scanarea directă. Folosește introducerea manuală."
                            : "This browser does not support direct scanning. Use manual entry instead.",
                      });
                      return;
                    }

                    setBarcodeMessage(null);
                    setIsScannerOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Camera className="h-4 w-4" />
                  {language === "ro" ? "Scanează" : "Scan"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={barcodeInput}
                    onChange={(event) => {
                      const nextBarcode = normalizeBarcode(event.target.value);
                      setBarcodeInput(nextBarcode);
                      setBarcodeMessage(null);
                      if (barcodeProduct && barcodeProduct.barcode !== nextBarcode) {
                        setBarcodeProduct(null);
                      }
                    }}
                    placeholder={language === "ro" ? "Ex: 5941234567890" : "Example: 5941234567890"}
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

                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">
                    {language === "ro" ? "Cum funcționează" : "How it works"}
                  </p>
                  <p className="mt-2 leading-6">
                    {language === "ro"
                      ? "Datele nutriționale vin din Open Food Facts, apoi sunt scalate la gramajul pe care îl mănânci."
                      : "Nutrition data comes from Open Food Facts, then it is scaled to the amount you actually eat."}
                  </p>
                  <p className="mt-2 leading-6">
                    {scannerSupported
                      ? language === "ro"
                        ? "Pe device-urile compatibile poți scana direct cu camera."
                        : "On supported devices you can scan directly with the camera."
                      : language === "ro"
                        ? "Dacă browserul nu suportă scanare directă, lookup-ul manual rămâne disponibil."
                        : "If the browser does not support direct scanning, manual lookup remains available."}
                  </p>
                </div>

                <StatusBanner message={barcodeMessage} />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                {barcodeProduct && barcodeEstimate ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      {barcodeProduct.imageUrl ? (
                        <img
                          src={barcodeProduct.imageUrl}
                          alt={barcodeProduct.name}
                          className="h-20 w-20 rounded-2xl border border-slate-200 bg-white object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                          <Apple className="h-8 w-8 text-emerald-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {language === "ro" ? "Produs identificat" : "Detected product"}
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">{barcodeProduct.name}</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {barcodeProduct.brand} • {barcodeProduct.barcode}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {barcodeProduct.servingSize ? (
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                              {barcodeProduct.servingSize}
                            </span>
                          ) : null}
                          {barcodeProduct.nutriscore ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium uppercase text-emerald-700">
                              Nutri-Score {barcodeProduct.nutriscore}
                            </span>
                          ) : null}
                          {barcodeProduct.novaGroup ? (
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                              NOVA {barcodeProduct.novaGroup}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[140px_1fr] sm:items-end">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          {language === "ro" ? "Gramaj logat" : "Logged amount"}
                        </span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={barcodeQuantityGrams}
                          onChange={(event) => setBarcodeQuantityGrams(event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setBarcodeQuantityGrams("100")}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                          100 g
                        </button>
                        {barcodeProduct.quantityHintGrams ? (
                          <button
                            onClick={() => setBarcodeQuantityGrams(String(barcodeProduct.quantityHintGrams))}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                          >
                            {language === "ro" ? "1 porție" : "1 serving"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Calories</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{barcodeEstimate.calories}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Protein</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatNutritionNumber(barcodeEstimate.protein)}g</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Carbs</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatNutritionNumber(barcodeEstimate.carbs)}g</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Fat</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{formatNutritionNumber(barcodeEstimate.fat)}g</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white p-4 text-sm">
                      <div>
                        <p className="text-slate-400">{language === "ro" ? "Fibre" : "Fiber"}</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatNutritionNumber(barcodeEstimate.fiber)}g</p>
                      </div>
                      <div>
                        <p className="text-slate-400">{language === "ro" ? "Zahăr" : "Sugar"}</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatNutritionNumber(barcodeEstimate.sugar)}g</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Sodium</p>
                        <p className="mt-1 font-semibold text-slate-900">{barcodeEstimate.sodiumMg}mg</p>
                      </div>
                    </div>

                    <button
                      onClick={logBarcodeProduct}
                      disabled={isLoggingBarcode}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                    >
                      {isLoggingBarcode ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                      {language === "ro" ? "Loghează produsul" : "Log product"}
                    </button>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
                    <Apple className="h-10 w-10 text-slate-300" />
                    <p className="mt-4 font-medium text-slate-900">
                      {language === "ro" ? "Aștept un cod de bare" : "Waiting for a barcode"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {language === "ro"
                        ? "După lookup vei vedea valorile per gramaj și poți salva imediat produsul."
                        : "After lookup you will see the nutrition for the selected amount and can save it immediately."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {lastAnalysis && (
            <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
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
                <div className="-mx-1 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible sm:pb-0">
                  <div className="grid min-w-max grid-flow-col auto-cols-[132px] gap-3 sm:min-w-0 sm:grid-flow-row sm:grid-cols-4">
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
                      <div className="flex min-w-0 items-start gap-3">
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
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-slate-900">{entry.name}</p>
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                              {getAnalysisSourceLabel(entry.analysisSource, language)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {getMealTypeLabel(entry.mealType, language)}
                            {entry.brand ? ` • ${entry.brand}` : ""}
                            {entry.quantityText ? ` • ${entry.quantityText}` : ""}
                            {entry.estimatedWeightGrams ? ` • ~${entry.estimatedWeightGrams} g` : ""}
                            {entry.timestamp ? ` • ${formatEntryTime(entry.timestamp, language)}` : ""}
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
                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        <button
                          onClick={() => deleteFoodEntry(entry.id)}
                          disabled={removingEntryId === entry.id}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:text-slate-300"
                        >
                          {removingEntryId === entry.id
                            ? language === "ro"
                              ? "Se șterge..."
                              : "Removing..."
                            : language === "ro"
                              ? "Șterge"
                              : "Delete"}
                        </button>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{entry.calories} kcal</p>
                          <p className="text-sm capitalize text-slate-500">
                            {getConfidenceLabel(entry.analysisConfidence, language)}
                          </p>
                        </div>
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
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
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
              <div className="w-full sm:w-auto">
                <button
                  onClick={generateMealPlan}
                  disabled={isGeneratingPlan || isSavingPlan}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300 sm:w-auto"
                >
                  {isGeneratingPlan || isSavingPlan ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {language === "ro" ? "Generează cu Gemini" : "Generate with Gemini"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <StatusBanner message={planMessage} />
            </div>
          </div>

          <div className="mb-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {language === "ro" ? "Istoric planuri salvate" : "Saved plan history"}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {language === "ro"
                      ? "Fiecare plan generat este salvat automat și poate fi reactivat."
                      : "Every generated plan is saved automatically and can be reactivated."}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
                  {savedPlans.length}
                </span>
              </div>

              {isLoadingPlans ? (
                <div className="mt-4 flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
              ) : savedPlans.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  {language === "ro"
                    ? "Nu ai încă planuri salvate. Generează primul plan și îl vom păstra aici."
                    : "You do not have saved plans yet. Generate the first plan and it will appear here."}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {savedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-4 ${
                        plan.isActive
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-slate-200 bg-slate-50/60"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{plan.title}</p>
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                              {getPlanSourceLabel(plan.source, language)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                              {plan.goalMode}
                            </span>
                            {plan.isActive ? (
                              <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
                                {language === "ro" ? "Activ" : "Active"}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {formatSavedPlanDate(plan.updatedAt, language)} • {plan.plan.meals.length}{" "}
                            {language === "ro" ? "mese" : "meals"}
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{plan.summary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!plan.isActive ? (
                            <button
                              onClick={() => activateSavedPlan(plan.id)}
                              disabled={changingPlanId === plan.id}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                            >
                              {changingPlanId === plan.id
                                ? language === "ro"
                                  ? "Se activează..."
                                  : "Activating..."
                                : language === "ro"
                                  ? "Activează"
                                  : "Activate"}
                            </button>
                          ) : null}
                          <button
                            onClick={() => {
                              setGeneratedPlan(plan.plan);
                              setGeneratedPlanSource(plan.source);
                              setSelectedSavedPlanId(plan.id);
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
                          >
                            {language === "ro" ? "Deschide" : "Open"}
                          </button>
                          <button
                            onClick={() => deleteSavedPlan(plan.id)}
                            disabled={changingPlanId === plan.id}
                            className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:text-rose-300"
                          >
                            {changingPlanId === plan.id
                              ? language === "ro"
                                ? "Se șterge..."
                                : "Deleting..."
                              : language === "ro"
                                ? "Șterge"
                                : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <h4 className="font-semibold text-slate-900">
                {language === "ro" ? "De ce este util acum" : "Why this is useful now"}
              </h4>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  {language === "ro"
                    ? "Planul generat se salvează automat în Firestore și se reîncarcă la următoarea intrare."
                    : "Generated plans are automatically saved in Firestore and restored on the next visit."}
                </p>
                <p>
                  {language === "ro"
                    ? "Poți reactiva rapid un plan mai vechi dacă schimbi obiectivul sau vrei o zi mai simplă."
                    : "You can quickly reactivate an older plan if you switch goals or want a simpler day."}
                </p>
                <p>
                  {language === "ro"
                    ? "Tracker-ul și hidratarea rămân separate de plan, ca să poți compara intenția cu execuția."
                    : "Tracker and hydration stay separate from the plan so you can compare intention with execution."}
                </p>
              </div>
            </div>
          </div>

          {generatedPlan ? (
            <>
              <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      {language === "ro" ? "Plan generat" : "Generated plan"}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">{generatedPlan.title}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{generatedPlan.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                        {getPlanSourceLabel(generatedPlanSource, language)}
                      </span>
                      {activeSavedPlan ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                          {language === "ro" ? "Salvat" : "Saved"} • {formatSavedPlanDate(activeSavedPlan.updatedAt, language)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="-mx-1 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible sm:pb-0">
                    <div className="grid min-w-max grid-flow-col auto-cols-[148px] gap-3 sm:min-w-0 sm:grid-flow-row sm:grid-cols-4">
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
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    onClick={copyShoppingList}
                    disabled={copyingShoppingList}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:text-slate-300 sm:w-auto"
                  >
                    {copyingShoppingList
                      ? language === "ro"
                        ? "Se copiază..."
                        : "Copying..."
                      : language === "ro"
                        ? "Copiază lista de cumpărături"
                        : "Copy shopping list"}
                  </button>
                  {activeSavedPlan && !activeSavedPlan.isActive ? (
                    <button
                      onClick={() => activateSavedPlan(activeSavedPlan.id)}
                      className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                    >
                      {language === "ro" ? "Setează ca activ" : "Set as active"}
                    </button>
                  ) : null}
                </div>
              </div>

              {planTotals && planDelta ? (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Calories", total: planTotals.calories, delta: planDelta.calories, suffix: "" },
                    { label: "Protein", total: planTotals.protein, delta: planDelta.protein, suffix: "g" },
                    { label: "Carbs", total: planTotals.carbs, delta: planDelta.carbs, suffix: "g" },
                    { label: "Fat", total: planTotals.fat, delta: planDelta.fat, suffix: "g" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                      <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {item.total}
                        {item.suffix}
                      </p>
                      <p className={`mt-2 text-sm ${Math.abs(item.delta) <= 10 || (item.label === "Calories" && Math.abs(item.delta) <= 120) ? "text-emerald-600" : "text-amber-600"}`}>
                        {item.delta === 0
                          ? language === "ro"
                            ? "perfect pe target"
                            : "right on target"
                          : `${item.delta > 0 ? "+" : ""}${item.delta}${item.suffix} ${
                              language === "ro" ? "vs target" : "vs target"
                            }`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                {generatedPlan.meals.map((meal, index) => {
                  const Icon = getMealIcon(meal.slot);

                  return (
                    <div key={`${meal.slot}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
                            <Icon className="h-5 w-5 text-emerald-700" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">{getMealTypeLabel(meal.slot, language)} • {meal.time}</p>
                            <h3 className="font-semibold text-slate-900">{meal.title}</h3>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 sm:text-right">{meal.calories} kcal</p>
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
                <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                  <h4 className="mb-3 font-semibold text-slate-900">
                    {language === "ro" ? "Recomandări" : "Coaching tips"}
                  </h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    {generatedPlan.coachingTips.map((tip) => (
                      <p key={tip}>• {tip}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
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
                <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
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

      {isScannerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/70 p-3 sm:items-center sm:justify-center sm:p-6">
          <div className="w-full max-w-xl rounded-[32px] border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl shadow-black/40 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  {language === "ro" ? "Barcode scan" : "Barcode scan"}
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  {language === "ro" ? "Aliniază codul în cadru" : "Align the barcode in the frame"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {language === "ro"
                    ? "Ține camera stabilă. Când este detectat un cod valid, produsul va fi căutat automat."
                    : "Keep the camera stable. Once a valid code is detected, the product will be looked up automatically."}
                </p>
              </div>
              <button
                onClick={closeScanner}
                className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-5 overflow-hidden rounded-[28px] border border-slate-800 bg-black">
              <video
                ref={barcodeVideoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-28 w-[78%] rounded-[28px] border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.4)]" />
              </div>
              {isStartingScanner ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55">
                  <div className="inline-flex items-center gap-3 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {language === "ro" ? "Pornesc camera..." : "Starting camera..."}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={closeScanner}
                className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
              >
                {language === "ro" ? "Închide" : "Close"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
