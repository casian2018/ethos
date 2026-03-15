/**
 * Nutrition Page - Meal Planning & Calorie Tracking
 * 
 * Features:
 * - Daily calorie calculator based on user profile
 * - Food logging with Gemini API for calorie estimation
 * - Meal plan generation based on goals
 * - Daily nutrition summary
 */

"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { 
  Apple, 
  UtensilsCrossed, 
  Plus, 
  Flame, 
  Target, 
  ChefHat,
  Loader2,
  Save,
  Trash2,
  Coffee,
  Sun,
  Moon,
} from "lucide-react";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface UserProfile {
  birthDate: string;
  gender: "male" | "female" | "other";
  height: number;
  weight: number;
  goals: string[];
  priorityGoal: string;
}

interface FoodEntry {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  timestamp: any;
}

interface MealPlan {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snacks: string[];
}

export default function NutritionPage() {
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tracker" | "plan">("tracker");
  
  // Calorie calculations
  const [dailyCalories, setDailyCalories] = useState(2000);
  const [goalType, setGoalType] = useState<"lose" | "maintain" | "gain">("maintain");
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  
  // Food logging
  const [foodInput, setFoodInput] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [isLogging, setIsLogging] = useState(false);
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  
  // Meal plan
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [generatedPlanText, setGeneratedPlanText] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserProfile(currentUser.uid);
        await loadTodayEntries(currentUser.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, "users", userId));
      if (profileDoc.exists()) {
        const data = profileDoc.data() as UserProfile;
        setProfile(data);
        calculateCalories(data);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      // Use default values
      calculateCalories({
        birthDate: "1990-01-01",
        gender: "male",
        height: 175,
        weight: 75,
        goals: ["fitness"],
        priorityGoal: "fitness"
      });
    }
  };

  const calculateCalories = (profile: UserProfile) => {
    // Calculate age from birthDate
    const birthDate = new Date(profile.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Mifflin-St Jeor Equation
    let bmr: number;
    if (profile.gender === "male") {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age + 5;
    } else {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age - 161;
    }

    // Base daily calories (sedentary to lightly active)
    const tdee = Math.round(bmr * 1.4);
    
    // Adjust based on goal
    let targetCalories: number;
    switch (goalType) {
      case "lose":
        targetCalories = tdee - 500;
        break;
      case "gain":
        targetCalories = tdee + 300;
        break;
      default:
        targetCalories = tdee;
    }
    
    setDailyCalories(targetCalories);
  };

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
      let totalCals = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data() as FoodEntry;
        entries.push({ id: doc.id, ...data });
        totalCals += data.calories || 0;
        totalProtein += data.protein || 0;
        totalCarbs += data.carbs || 0;
        totalFat += data.fat || 0;
      });
      
      setTodayEntries(entries);
      setCaloriesConsumed(totalCals);
      setMacros({ protein: totalProtein, carbs: totalCarbs, fat: totalFat });
    } catch (err) {
      console.error("Error loading entries:", err);
    }
  };

  const logFood = async () => {
    if (!foodInput.trim() || !user) return;
    
    setIsLogging(true);
    try {
      // Use Gemini API to estimate calories (simulated for now)
      // In production, this would call the actual Gemini API
      const estimatedCalories = estimateCalories(foodInput);
      const estimatedMacros = estimateMacros(foodInput, estimatedCalories);
      
      const today = new Date().toISOString().split("T")[0];
      
      await addDoc(collection(db, "food_entries"), {
        userId: user.uid,
        name: foodInput,
        calories: estimatedCalories,
        protein: estimatedMacros.protein,
        carbs: estimatedMacros.carbs,
        fat: estimatedMacros.fat,
        mealType: selectedMealType,
        date: today,
        timestamp: serverTimestamp(),
      });
      
      setFoodInput("");
      await loadTodayEntries(user.uid);
    } catch (err) {
      console.error("Error logging food:", err);
    } finally {
      setIsLogging(false);
    }
  };

  // Simple calorie estimation based on common foods
  const estimateCalories = (food: string): number => {
    const foodLower = food.toLowerCase();
    
    // Common foods database (simplified)
    const foodDatabase: Record<string, number> = {
      "ou": 70,
      "oua": 70,
      "egg": 70,
      "pain": 80,
      "bread": 80,
      "lapte": 150,
      "milk": 150,
      "carne": 200,
      "meat": 200,
      "pui": 165,
      "chicken": 165,
      "rice": 130,
      "orez": 130,
      "paste": 130,
      "pasta": 130,
      "salata": 30,
      "salad": 30,
      "banana": 105,
      "mar": 95,
      "apple": 95,
      "iaurt": 100,
      "yogurt": 100,
      "branza": 110,
      "cheese": 110,
      "cartofi": 80,
      "potatoes": 80,
      "legume": 50,
      "vegetables": 50,
      "ulei": 120,
      "oil": 120,
      "unt": 100,
      "butter": 100,
      "avocado": 160,
      "nuci": 180,
      "nuts": 180,
      "miere": 60,
      "honey": 60,
      "ciocolata": 230,
      "chocolate": 230,
    };
    
    // Check for partial matches
    for (const [key, value] of Object.entries(foodDatabase)) {
      if (foodLower.includes(key)) {
        return value;
      }
    }
    
    // Default estimation
    return 150;
  };

  const estimateMacros = (food: string, calories: number) => {
    const foodLower = food.toLowerCase();
    
    // Protein-rich foods
    if (foodLower.includes("ou") || foodLower.includes("egg") || 
        foodLower.includes("carne") || foodLower.includes("meat") ||
        foodLower.includes("pui") || foodLower.includes("chicken") ||
        foodLower.includes("branza") || foodLower.includes("cheese")) {
      return { protein: Math.round(calories * 0.4), carbs: Math.round(calories * 0.1), fat: Math.round(calories * 0.2) };
    }
    
    // Carb-rich foods
    if (foodLower.includes("pain") || foodLower.includes("bread") ||
        foodLower.includes("rice") || foodLower.includes("orez") ||
        foodLower.includes("paste") || foodLower.includes("pasta") ||
        foodLower.includes("cartofi") || foodLower.includes("potatoes")) {
      return { protein: Math.round(calories * 0.1), carbs: Math.round(calories * 0.6), fat: Math.round(calories * 0.1) };
    }
    
    // Fat-rich foods
    if (foodLower.includes("avocado") || foodLower.includes("nuci") ||
        foodLower.includes("nuts") || foodLower.includes("ulei") ||
        foodLower.includes("oil") || foodLower.includes("unt") ||
        foodLower.includes("butter")) {
      return { protein: Math.round(calories * 0.05), carbs: Math.round(calories * 0.1), fat: Math.round(calories * 0.7) };
    }
    
    // Default balanced
    return { protein: Math.round(calories * 0.2), carbs: Math.round(calories * 0.4), fat: Math.round(calories * 0.2) };
  };

  const generateMealPlan = async () => {
    if (!profile) return;
    
    setIsGeneratingPlan(true);
    try {
      // Generate a simple meal plan based on goal
      const plan: MealPlan = {
        breakfast: language === "ro" 
          ? ["Ovăz cu lapte și fructe", "Ouă brăzate cu pâine integrală", "Iaurt greek cu nuci"]
          : ["Oatmeal with milk and fruits", "Scrambled eggs with whole grain bread", "Greek yogurt with nuts"],
        lunch: language === "ro"
          ? ["Piept de pui cu orez și legume", "Salată cu carne și quinoa", "Pește la cuptor cu cartofi"]
          : ["Chicken breast with rice and vegetables", "Salad with meat and quinoa", "Baked fish with potatoes"],
        dinner: language === "ro"
          ? ["Supă de legume", "Salată verde cu brânză", "Legume la grătar cu iaurt"]
          : ["Vegetable soup", "Green salad with cheese", "Grilled vegetables with yogurt"],
        snacks: language === "ro"
          ? ["Banana", "Mere cu arahide", "Iaurt"]
          : ["Banana", "Apple with peanuts", "Yogurt"]
      };
      
      setMealPlan(plan);
      
      // Generate detailed plan text with Gemini-style formatting
      const planText = language === "ro"
        ? `# Plan Alimentar Zilnic (${dailyCalories} kcal)\n\n## Mic Dejun\n${plan.breakfast.join("\n")}\n\n## Prânz\n${plan.lunch.join("\n")}\n\n## Cină\n${plan.dinner.join("\n")}\n\n## Gustări\n${plan.snacks.join("\n")}\n\n---\n\n**Nutriție:**\n- Proteine: ${Math.round(dailyCalories * 0.3 / 4)}g\n- Carbohidrați: ${Math.round(dailyCalories * 0.4 / 4)}g\n- Grăsimi: ${Math.round(dailyCalories * 0.3 / 9)}g`
        : `# Daily Meal Plan (${dailyCalories} kcal)\n\n## Breakfast\n${plan.breakfast.join("\n")}\n\n## Lunch\n${plan.lunch.join("\n")}\n\n## Dinner\n${plan.dinner.join("\n")}\n\n## Snacks\n${plan.snacks.join("\n")}\n\n---\n\n**Nutrition:**\n- Protein: ${Math.round(dailyCalories * 0.3 / 4)}g\n- Carbs: ${Math.round(dailyCalories * 0.4 / 4)}g\n- Fat: ${Math.round(dailyCalories * 0.3 / 9)}g`;
      
      setGeneratedPlanText(planText);
    } catch (err) {
      console.error("Error generating meal plan:", err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const updateGoal = (goal: "lose" | "maintain" | "gain") => {
    setGoalType(goal);
    if (profile) {
      const newGoalType = goal;
      let adjustedCalories = dailyCalories;
      
      // Recalculate based on new goal
      const birthDate = new Date(profile.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      let bmr: number;
      if (profile.gender === "male") {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age + 5;
      } else {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age - 161;
      }
      
      const tdee = Math.round(bmr * 1.4);
      
      switch (newGoalType) {
        case "lose":
          adjustedCalories = tdee - 500;
          break;
        case "gain":
          adjustedCalories = tdee + 300;
          break;
        default:
          adjustedCalories = tdee;
      }
      
      setDailyCalories(adjustedCalories);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const caloriesRemaining = dailyCalories - caloriesConsumed;
  const progressPercent = Math.min((caloriesConsumed / dailyCalories) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Apple className="w-8 h-8 text-emerald-500" />
          {language === "ro" ? "Nutriție" : "Nutrition"}
        </h1>
        <p className="text-slate-500 mt-1">
          {language === "ro" 
            ? "Planifică-ți mesele și urmărește caloriile" 
            : "Plan your meals and track calories"}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("tracker")}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === "tracker"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {language === "ro" ? "Tracker" : "Tracker"}
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === "plan"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {language === "ro" ? "Plan de Masă" : "Meal Plan"}
        </button>
      </div>

      {activeTab === "tracker" ? (
        <>
          {/* Calorie Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Daily Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-slate-900">
                  {language === "ro" ? "Calorii" : "Calories"}
                </h3>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {caloriesConsumed}
                <span className="text-lg font-normal text-slate-500"> / {dailyCalories}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    caloriesRemaining < 0 ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className={`text-sm ${caloriesRemaining < 0 ? "text-red-500" : "text-slate-500"}`}>
                {caloriesRemaining >= 0 
                  ? `${caloriesRemaining} ${language === "ro" ? "rămase" : "remaining"}`
                  : `${Math.abs(caloriesRemaining)} ${language === "ro" ? "exces" : "over"}`}
              </p>
            </div>

            {/* Goal Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-slate-900">
                  {language === "ro" ? "Obiectiv" : "Goal"}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateGoal("lose")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    goalType === "lose"
                      ? "bg-red-100 text-red-600 border border-red-200"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {language === "ro" ? "Slăbește" : "Lose"}
                </button>
                <button
                  onClick={() => updateGoal("maintain")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    goalType === "maintain"
                      ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {language === "ro" ? "Menține" : "Maintain"}
                </button>
                <button
                  onClick={() => updateGoal("gain")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    goalType === "gain"
                      ? "bg-blue-100 text-blue-600 border border-blue-200"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {language === "ro" ? "肌肉" : "Gain"}
                </button>
              </div>
            </div>

            {/* Macros */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-slate-900">
                  {language === "ro" ? "Macronutrienți" : "Macros"}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Protein</span>
                  <span className="font-medium">{macros.protein}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Carbs</span>
                  <span className="font-medium">{macros.carbs}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fat</span>
                  <span className="font-medium">{macros.fat}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Food Log Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              {language === "ro" ? "Adaugă Aliment" : "Add Food"}
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  placeholder={language === "ro" ? "Ce ai mâncat?" : "What did you eat?"}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedMealType}
                onChange={(e) => setSelectedMealType(e.target.value as any)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="breakfast">
                  {language === "ro" ? "Mic Dejun" : "Breakfast"}
                </option>
                <option value="lunch">
                  {language === "ro" ? "Prânz" : "Lunch"}
                </option>
                <option value="dinner">
                  {language === "ro" ? "Cină" : "Dinner"}
                </option>
                <option value="snack">
                  {language === "ro" ? "Gustare" : "Snack"}
                </option>
              </select>
              <button
                onClick={logFood}
                disabled={!foodInput.trim() || isLogging}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLogging ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Today's Entries */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                {language === "ro" ? "Astăzi" : "Today"}
              </h3>
            </div>
            {todayEntries.length === 0 ? (
              <div className="p-8 text-center">
                <Apple className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {language === "ro" 
                    ? "Nu ai logged niciun aliment astăzi" 
                    : "No food logged today"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayEntries.map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        entry.mealType === "breakfast" ? "bg-yellow-100" :
                        entry.mealType === "lunch" ? "bg-orange-100" :
                        entry.mealType === "dinner" ? "bg-purple-100" :
                        "bg-green-100"
                      }`}>
                        {entry.mealType === "breakfast" ? <Coffee className="w-5 h-5 text-yellow-600" /> :
                         entry.mealType === "lunch" ? <Sun className="w-5 h-5 text-orange-600" /> :
                         entry.mealType === "dinner" ? <Moon className="w-5 h-5 text-purple-600" /> :
                         <Apple className="w-5 h-5 text-green-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{entry.name}</p>
                        <p className="text-sm text-slate-500">
                          {entry.protein}g P • {entry.carbs}g C • {entry.fat}g F
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{entry.calories} kcal</p>
                      <p className="text-sm text-slate-500 capitalize">
                        {entry.mealType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Meal Plan Generator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-emerald-500" />
                  {language === "ro" ? "Plan Alimentar Personalizat" : "Personalized Meal Plan"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {language === "ro" 
                    ? `Bazat pe obiectivul tău: ${dailyCalories} kcal/zi`
                    : `Based on your goal: ${dailyCalories} kcal/day`}
                </p>
              </div>
              <button
                onClick={generateMealPlan}
                disabled={isGeneratingPlan}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingPlan ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ChefHat className="w-5 h-5" />
                )}
                {language === "ro" ? "Generează Plan" : "Generate Plan"}
              </button>
            </div>

            {generatedPlanText && (
              <div className="bg-slate-50 rounded-xl p-4 whitespace-pre-wrap text-sm text-slate-700">
                {generatedPlanText}
              </div>
            )}
          </div>

          {/* Quick Meal Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-yellow-500" />
                {language === "ro" ? "Mic Dejun (300-400 kcal)" : "Breakfast (300-400 kcal)"}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• {language === "ro" ? "Ovăz cu lapte și fructe" : "Oatmeal with milk and fruits"}</li>
                <li>• {language === "ro" ? "Ouă + pâine integrală" : "Eggs + whole grain bread"}</li>
                <li>• {language === "ro" ? "Iaurt greek cu granola" : "Greek yogurt with granola"}</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Sun className="w-5 h-5 text-orange-500" />
                {language === "ro" ? "Prânz (600-800 kcal)" : "Lunch (600-800 kcal)"}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• {language === "ro" ? "Pui + orez + legume" : "Chicken + rice + vegetables"}</li>
                <li>• {language === "ro" ? "Salată cu carne" : "Salad with meat"}</li>
                <li>• {language === "ro" ? "Pește + cartofi" : "Fish + potatoes"}</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Moon className="w-5 h-5 text-purple-500" />
                {language === "ro" ? "Cină (400-600 kcal)" : "Dinner (400-600 kcal)"}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• {language === "ro" ? "Supă de legume" : "Vegetable soup"}</li>
                <li>• {language === "ro" ? "Salată + brânză" : "Salad + cheese"}</li>
                <li>• {language === "ro" ? "Legume la grătar" : "Grilled vegetables"}</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Apple className="w-5 h-5 text-green-500" />
                {language === "ro" ? "Gustări (100-200 kcal)" : "Snacks (100-200 kcal)"}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• {language === "ro" ? "Fructe" : "Fruits"}</li>
                <li>• {language === "ro" ? "Iaurt" : "Yogurt"}</li>
                <li>• {language === "ro" ? "Nuci/alune" : "Nuts"}</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
