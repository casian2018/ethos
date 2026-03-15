import {
  buildNutritionProfileContext,
  type DetailedUserProfile,
  type NutritionTargets,
} from "./profile";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type NutritionConfidence = "low" | "medium" | "high";
export type NutritionAnalysisSource =
  | "gemini-text"
  | "gemini-image"
  | "gemini-multimodal"
  | "fallback";

export interface MealPlanSuggestions {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snacks: string[];
}

export interface NutritionAnalysis {
  displayName: string;
  recognizedFoods: string[];
  portionDescription: string;
  estimatedWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodiumMg: number;
  hydrationMl: number;
  reasoning: string;
  warnings: string[];
  confidence: NutritionConfidence;
  analysisSource: NutritionAnalysisSource;
}

export interface NutritionPlanMeal {
  slot: MealType;
  time: string;
  title: string;
  foods: string[];
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reason: string;
}

export interface NutritionMealPlan {
  title: string;
  summary: string;
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    waterLiters: number;
  };
  meals: NutritionPlanMeal[];
  coachingTips: string[];
  shoppingList: string[];
  hydrationPlan: string[];
}

interface BuildAnalysisPromptInput {
  description?: string;
  quantityText?: string;
  hasImage: boolean;
  language: "ro" | "en";
  dietaryPreference?: string;
  allergies?: string[];
  foodsToAvoid?: string[];
}

interface NormalizeNutritionAnalysisInput {
  displayName?: unknown;
  recognizedFoods?: unknown;
  portionDescription?: unknown;
  estimatedWeightGrams?: unknown;
  calories?: unknown;
  protein?: unknown;
  carbs?: unknown;
  fat?: unknown;
  fiber?: unknown;
  sugar?: unknown;
  sodiumMg?: unknown;
  hydrationMl?: unknown;
  reasoning?: unknown;
  warnings?: unknown;
  confidence?: unknown;
}

interface NormalizeNutritionAnalysisOptions {
  source: NutritionAnalysisSource;
  description?: string;
  quantityText?: string;
  language: "ro" | "en";
}

interface FoodReference {
  keywords: string[];
  displayNameRo: string;
  displayNameEn: string;
  servingGrams: number;
  portionRo: string;
  portionEn: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodiumMg: number;
}

const FOOD_REFERENCES: FoodReference[] = [
  {
    keywords: ["chicken", "pui", "piept de pui"],
    displayNameRo: "Pui",
    displayNameEn: "Chicken",
    servingGrams: 150,
    portionRo: "150 g",
    portionEn: "150 g",
    calories: 248,
    protein: 46,
    carbs: 0,
    fat: 5,
    fiber: 0,
    sugar: 0,
    sodiumMg: 120,
  },
  {
    keywords: ["salmon", "somon"],
    displayNameRo: "Somon",
    displayNameEn: "Salmon",
    servingGrams: 150,
    portionRo: "150 g",
    portionEn: "150 g",
    calories: 312,
    protein: 30,
    carbs: 0,
    fat: 20,
    fiber: 0,
    sugar: 0,
    sodiumMg: 90,
  },
  {
    keywords: ["egg", "eggs", "ou", "oua"],
    displayNameRo: "Ouă",
    displayNameEn: "Eggs",
    servingGrams: 100,
    portionRo: "2 bucăți",
    portionEn: "2 pieces",
    calories: 144,
    protein: 12,
    carbs: 1,
    fat: 10,
    fiber: 0,
    sugar: 1,
    sodiumMg: 140,
  },
  {
    keywords: ["rice", "orez"],
    displayNameRo: "Orez",
    displayNameEn: "Rice",
    servingGrams: 150,
    portionRo: "150 g gătit",
    portionEn: "150 g cooked",
    calories: 195,
    protein: 4,
    carbs: 42,
    fat: 0,
    fiber: 1,
    sugar: 0,
    sodiumMg: 5,
  },
  {
    keywords: ["pasta", "paste"],
    displayNameRo: "Paste",
    displayNameEn: "Pasta",
    servingGrams: 180,
    portionRo: "180 g gătite",
    portionEn: "180 g cooked",
    calories: 284,
    protein: 10,
    carbs: 56,
    fat: 2,
    fiber: 3,
    sugar: 2,
    sodiumMg: 20,
  },
  {
    keywords: ["beef", "vita", "vită"],
    displayNameRo: "Vită",
    displayNameEn: "Beef",
    servingGrams: 150,
    portionRo: "150 g",
    portionEn: "150 g",
    calories: 320,
    protein: 37,
    carbs: 0,
    fat: 19,
    fiber: 0,
    sugar: 0,
    sodiumMg: 95,
  },
  {
    keywords: ["tofu"],
    displayNameRo: "Tofu",
    displayNameEn: "Tofu",
    servingGrams: 180,
    portionRo: "180 g",
    portionEn: "180 g",
    calories: 228,
    protein: 23,
    carbs: 5,
    fat: 14,
    fiber: 2,
    sugar: 1,
    sodiumMg: 30,
  },
  {
    keywords: ["yogurt", "iaurt", "skyr"],
    displayNameRo: "Iaurt",
    displayNameEn: "Yogurt",
    servingGrams: 170,
    portionRo: "170 g",
    portionEn: "170 g",
    calories: 110,
    protein: 17,
    carbs: 8,
    fat: 0,
    fiber: 0,
    sugar: 7,
    sodiumMg: 65,
  },
  {
    keywords: ["oats", "ovaz", "ovăz"],
    displayNameRo: "Ovăz",
    displayNameEn: "Oats",
    servingGrams: 80,
    portionRo: "80 g",
    portionEn: "80 g",
    calories: 311,
    protein: 13,
    carbs: 53,
    fat: 6,
    fiber: 8,
    sugar: 1,
    sodiumMg: 4,
  },
  {
    keywords: ["bread", "paine", "pâine", "toast"],
    displayNameRo: "Pâine",
    displayNameEn: "Bread",
    servingGrams: 60,
    portionRo: "2 felii",
    portionEn: "2 slices",
    calories: 156,
    protein: 6,
    carbs: 28,
    fat: 2,
    fiber: 3,
    sugar: 3,
    sodiumMg: 250,
  },
  {
    keywords: ["banana"],
    displayNameRo: "Banana",
    displayNameEn: "Banana",
    servingGrams: 120,
    portionRo: "1 bucată",
    portionEn: "1 piece",
    calories: 105,
    protein: 1,
    carbs: 27,
    fat: 0,
    fiber: 3,
    sugar: 14,
    sodiumMg: 1,
  },
  {
    keywords: ["apple", "mar", "măr"],
    displayNameRo: "Măr",
    displayNameEn: "Apple",
    servingGrams: 180,
    portionRo: "1 bucată",
    portionEn: "1 piece",
    calories: 95,
    protein: 1,
    carbs: 25,
    fat: 0,
    fiber: 4,
    sugar: 19,
    sodiumMg: 2,
  },
  {
    keywords: ["potato", "cartof", "cartofi"],
    displayNameRo: "Cartofi",
    displayNameEn: "Potatoes",
    servingGrams: 200,
    portionRo: "200 g",
    portionEn: "200 g",
    calories: 174,
    protein: 5,
    carbs: 40,
    fat: 0,
    fiber: 4,
    sugar: 2,
    sodiumMg: 12,
  },
  {
    keywords: ["avocado"],
    displayNameRo: "Avocado",
    displayNameEn: "Avocado",
    servingGrams: 100,
    portionRo: "100 g",
    portionEn: "100 g",
    calories: 160,
    protein: 2,
    carbs: 9,
    fat: 15,
    fiber: 7,
    sugar: 1,
    sodiumMg: 7,
  },
  {
    keywords: ["nuts", "nuci", "almonds", "migdale"],
    displayNameRo: "Nuci",
    displayNameEn: "Nuts",
    servingGrams: 30,
    portionRo: "30 g",
    portionEn: "30 g",
    calories: 174,
    protein: 6,
    carbs: 6,
    fat: 15,
    fiber: 3,
    sugar: 1,
    sodiumMg: 2,
  },
  {
    keywords: ["pizza"],
    displayNameRo: "Pizza",
    displayNameEn: "Pizza",
    servingGrams: 180,
    portionRo: "2 felii",
    portionEn: "2 slices",
    calories: 480,
    protein: 20,
    carbs: 52,
    fat: 22,
    fiber: 3,
    sugar: 5,
    sodiumMg: 820,
  },
  {
    keywords: ["salad", "salata", "salată"],
    displayNameRo: "Salată",
    displayNameEn: "Salad",
    servingGrams: 250,
    portionRo: "1 bol",
    portionEn: "1 bowl",
    calories: 220,
    protein: 12,
    carbs: 16,
    fat: 11,
    fiber: 5,
    sugar: 6,
    sodiumMg: 220,
  },
];

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => safeString(item)).filter(Boolean)));
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeMealType(value: unknown, fallback: MealType): MealType {
  return value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack"
    ? value
    : fallback;
}

function confidenceFromValue(value: unknown): NutritionConfidence {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function getMealDistribution(mealCount: number): number[] {
  if (mealCount <= 3) {
    return [0.3, 0.35, 0.35];
  }

  if (mealCount === 4) {
    return [0.25, 0.35, 0.28, 0.12];
  }

  if (mealCount === 5) {
    return [0.22, 0.1, 0.3, 0.26, 0.12];
  }

  return [0.2, 0.1, 0.26, 0.22, 0.12, 0.1];
}

function getMealSlots(mealCount: number): MealType[] {
  if (mealCount <= 3) {
    return ["breakfast", "lunch", "dinner"];
  }

  if (mealCount === 4) {
    return ["breakfast", "lunch", "dinner", "snack"];
  }

  if (mealCount === 5) {
    return ["breakfast", "snack", "lunch", "dinner", "snack"];
  }

  return ["breakfast", "snack", "lunch", "snack", "dinner", "snack"];
}

function getMealTimes(mealCount: number): string[] {
  if (mealCount <= 3) {
    return ["08:00", "13:00", "19:00"];
  }

  if (mealCount === 4) {
    return ["08:00", "13:00", "19:00", "16:30"];
  }

  if (mealCount === 5) {
    return ["08:00", "11:00", "14:00", "19:00", "16:30"];
  }

  return ["07:30", "10:30", "13:30", "16:30", "19:30", "21:30"];
}

function getPortionMultiplier(quantityText: string | undefined, reference: FoodReference): number {
  const normalized = safeString(quantityText).toLowerCase();
  if (!normalized) {
    return 1;
  }

  const numberMatch = normalized.match(/(\d+(?:[.,]\d+)?)/);
  const amount = numberMatch ? safeNumber(numberMatch[1], 1) : 1;

  if (/\bkg\b/.test(normalized)) {
    return clampNumber((amount * 1000) / reference.servingGrams, 0.25, 8);
  }

  if (/\b(g|gr|gram|grams)\b/.test(normalized)) {
    return clampNumber(amount / reference.servingGrams, 0.25, 8);
  }

  if (/\b(ml|mililitri|milliliters)\b/.test(normalized)) {
    return clampNumber(amount / reference.servingGrams, 0.25, 8);
  }

  if (/\b(l|litri|liters)\b/.test(normalized)) {
    return clampNumber((amount * 1000) / reference.servingGrams, 0.25, 8);
  }

  if (/\b(piece|pieces|buc|bucata|bucăți|felii|slices|cups|cani|linguri|tbsp|tsp|egg|eggs|ou|oua)\b/.test(normalized)) {
    return clampNumber(amount, 0.25, 6);
  }

  if (/\b(small|mic|mica|mică)\b/.test(normalized)) {
    return 0.75;
  }

  if (/\b(large|mare)\b/.test(normalized)) {
    return 1.35;
  }

  return 1;
}

function findBestFoodReference(description: string): FoodReference | null {
  const normalized = description.toLowerCase();
  let bestMatch: FoodReference | null = null;
  let bestScore = 0;

  for (const reference of FOOD_REFERENCES) {
    const score = reference.keywords.reduce((total, keyword) => {
      return normalized.includes(keyword) ? total + keyword.length : total;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = reference;
    }
  }

  return bestMatch;
}

function getMealTitle(slot: MealType, language: "ro" | "en", index: number): string {
  if (slot === "breakfast") {
    return language === "ro" ? "Mic dejun" : "Breakfast";
  }

  if (slot === "lunch") {
    return language === "ro" ? "Prânz" : "Lunch";
  }

  if (slot === "dinner") {
    return language === "ro" ? "Cină" : "Dinner";
  }

  return index === 1
    ? language === "ro"
      ? "Gustare"
      : "Snack"
    : language === "ro"
      ? "Gustare"
      : "Snack";
}

export function getMealTypeLabel(mealType: MealType, language: "ro" | "en"): string {
  if (mealType === "breakfast") {
    return language === "ro" ? "Mic dejun" : "Breakfast";
  }

  if (mealType === "lunch") {
    return language === "ro" ? "Prânz" : "Lunch";
  }

  if (mealType === "dinner") {
    return language === "ro" ? "Cină" : "Dinner";
  }

  return language === "ro" ? "Gustare" : "Snack";
}

export function getDietPlanSuggestions(
  profile: DetailedUserProfile,
  language: "ro" | "en"
): MealPlanSuggestions {
  const diet = profile.dietaryPreference;
  const allergies = new Set(profile.foodAllergies.map((item) => item.toLowerCase()));
  const avoid = new Set(profile.foodsToAvoid.map((item) => item.toLowerCase()));

  const planMap: Record<string, MealPlanSuggestions> = {
    balanced: {
      breakfast:
        language === "ro"
          ? ["Omletă cu spanac și toast integral", "Iaurt grecesc cu fructe de pădure", "Ovăz peste noapte cu semințe"]
          : ["Spinach omelette with whole grain toast", "Greek yogurt with berries", "Overnight oats with seeds"],
      lunch:
        language === "ro"
          ? ["Pui la grătar cu orez și salată", "Bowl cu curcan, cartof dulce și legume", "Wrap cu vită slabă și hummus"]
          : ["Grilled chicken with rice and salad", "Turkey bowl with sweet potato and vegetables", "Lean beef wrap with hummus"],
      dinner:
        language === "ro"
          ? ["Somon cu broccoli și quinoa", "Supă cremă și salată cu ou", "Tofu stir fry cu legume"]
          : ["Salmon with broccoli and quinoa", "Soup with egg salad", "Vegetable tofu stir fry"],
      snacks:
        language === "ro"
          ? ["Banana cu unt de arahide", "Brânză cottage cu castravete", "Măr cu migdale"]
          : ["Banana with peanut butter", "Cottage cheese with cucumber", "Apple with almonds"],
    },
    "high-protein": {
      breakfast:
        language === "ro"
          ? ["Ouă cu somon afumat", "Skyr cu fructe", "Budincă proteică cu ovăz"]
          : ["Eggs with smoked salmon", "Skyr with fruit", "Protein oats pudding"],
      lunch:
        language === "ro"
          ? ["Piept de pui cu bulgur", "Ton cu cartof copt și salată", "Chiftele de curcan cu legume"]
          : ["Chicken breast with bulgur", "Tuna with baked potato and salad", "Turkey meatballs with vegetables"],
      dinner:
        language === "ro"
          ? ["Cod cu fasole verde", "Bowl cu tofu crocant și edamame", "Mușchi de vită cu legume"]
          : ["Cod with green beans", "Crispy tofu bowl with edamame", "Beef tenderloin with vegetables"],
      snacks:
        language === "ro"
          ? ["Shake proteic", "Iaurt cu semințe", "Ouă fierte"]
          : ["Protein shake", "Yogurt with seeds", "Boiled eggs"],
    },
    vegetarian: {
      breakfast:
        language === "ro"
          ? ["Iaurt cu granola și fructe", "Ouă poșate cu avocado", "Budincă de chia"]
          : ["Yogurt with granola and fruit", "Poached eggs with avocado", "Chia pudding"],
      lunch:
        language === "ro"
          ? ["Bowl cu năut și quinoa", "Paste integrale cu ricotta", "Halloumi cu salată și cartof dulce"]
          : ["Chickpea quinoa bowl", "Whole wheat pasta with ricotta", "Halloumi with salad and sweet potato"],
      dinner:
        language === "ro"
          ? ["Omletă cu legume", "Tofu cu broccoli", "Supă de linte roșie"]
          : ["Vegetable omelette", "Tofu with broccoli", "Red lentil soup"],
      snacks:
        language === "ro"
          ? ["Hummus cu morcovi", "Skyr", "Nuci crude"]
          : ["Hummus with carrots", "Skyr", "Raw nuts"],
    },
    vegan: {
      breakfast:
        language === "ro"
          ? ["Ovăz cu lapte vegetal", "Smoothie cu tofu și fructe", "Toast integral cu avocado"]
          : ["Oats with plant milk", "Tofu fruit smoothie", "Whole grain avocado toast"],
      lunch:
        language === "ro"
          ? ["Bowl cu tofu, orez și legume", "Curry de năut", "Wrap vegan cu fasole neagră"]
          : ["Tofu rice bowl", "Chickpea curry", "Black bean vegan wrap"],
      dinner:
        language === "ro"
          ? ["Tempeh cu legume wok", "Supă de linte", "Cartof dulce cu hummus"]
          : ["Tempeh vegetable stir fry", "Lentil soup", "Sweet potato with hummus"],
      snacks:
        language === "ro"
          ? ["Edamame", "Mix de semințe", "Fructe"]
          : ["Edamame", "Seed mix", "Fruit"],
    },
    pescatarian: {
      breakfast:
        language === "ro"
          ? ["Omletă cu ton", "Skyr cu fructe", "Toast cu somon și avocado"]
          : ["Tuna omelette", "Skyr with fruit", "Toast with salmon and avocado"],
      lunch:
        language === "ro"
          ? ["Somon cu orez jasmine", "Salată cu ton și ou", "Paste cu creveți"]
          : ["Salmon with jasmine rice", "Tuna and egg salad", "Shrimp pasta"],
      dinner:
        language === "ro"
          ? ["Cod cu sparanghel", "Bowl cu ton și quinoa", "Sardine cu salată"]
          : ["Cod with asparagus", "Tuna quinoa bowl", "Sardines with salad"],
      snacks:
        language === "ro"
          ? ["Iaurt", "Ouă fierte", "Fructe"]
          : ["Yogurt", "Boiled eggs", "Fruit"],
    },
    "low-carb": {
      breakfast:
        language === "ro"
          ? ["Omletă cu brânză", "Iaurt gras cu nuci", "Ouă și avocado"]
          : ["Cheese omelette", "Full-fat yogurt with nuts", "Eggs and avocado"],
      lunch:
        language === "ro"
          ? ["Pui cu salată mare", "Burger bowl fără chiflă", "Somon cu legume verzi"]
          : ["Chicken with a large salad", "Bunless burger bowl", "Salmon with green vegetables"],
      dinner:
        language === "ro"
          ? ["Tofu cu broccoli", "Curcan cu dovlecei", "Supă cremă de conopidă"]
          : ["Tofu with broccoli", "Turkey with zucchini", "Cauliflower soup"],
      snacks:
        language === "ro"
          ? ["Brânză", "Migdale", "Ouă fierte"]
          : ["Cheese", "Almonds", "Boiled eggs"],
    },
    mediterranean: {
      breakfast:
        language === "ro"
          ? ["Iaurt cu miere și nuci", "Toast cu ricotta și roșii", "Omletă cu legume"]
          : ["Yogurt with honey and walnuts", "Toast with ricotta and tomatoes", "Vegetable omelette"],
      lunch:
        language === "ro"
          ? ["Pește cu salată și couscous", "Pui cu măsline și cartofi", "Salată grecească cu extra proteină"]
          : ["Fish with salad and couscous", "Chicken with olives and potatoes", "Greek salad with extra protein"],
      dinner:
        language === "ro"
          ? ["Supă minestrone", "Tofu cu legume coapte", "Ton cu fasole verde"]
          : ["Minestrone soup", "Tofu with roasted vegetables", "Tuna with green beans"],
      snacks:
        language === "ro"
          ? ["Fructe", "Iaurt", "Măsline și hummus"]
          : ["Fruit", "Yogurt", "Olives and hummus"],
    },
  };

  const selectedPlan = planMap[diet] || planMap.balanced;

  const shouldFilter = (item: string) => {
    const normalized = item.toLowerCase();
    return [...allergies, ...avoid].some((blocked) => blocked && normalized.includes(blocked));
  };

  return {
    breakfast: selectedPlan.breakfast.filter((item) => !shouldFilter(item)),
    lunch: selectedPlan.lunch.filter((item) => !shouldFilter(item)),
    dinner: selectedPlan.dinner.filter((item) => !shouldFilter(item)),
    snacks: selectedPlan.snacks.filter((item) => !shouldFilter(item)),
  };
}

export function buildNutritionAnalysisPrompt({
  description,
  quantityText,
  hasImage,
  language,
  dietaryPreference,
  allergies = [],
  foodsToAvoid = [],
}: BuildAnalysisPromptInput): string {
  const languageName = language === "ro" ? "Romanian" : "English";

  return [
    "You are a precision sports nutrition assistant.",
    "Estimate the nutrition for one eaten meal using the user's text and optional food photo.",
    `Respond in ${languageName}.`,
    `Photo available: ${hasImage ? "yes" : "no"}.`,
    `Food description: ${safeString(description) || "not provided"}.`,
    `Quantity note: ${safeString(quantityText) || "not provided"}.`,
    `Dietary preference: ${dietaryPreference || "not specified"}.`,
    `Allergies or intolerances: ${allergies.join(", ") || "none"}.`,
    `Foods to avoid: ${foodsToAvoid.join(", ") || "none"}.`,
    "Rules:",
    "- Estimate totals for the full meal as eaten, not per 100 g.",
    "- If quantity is unclear, estimate conservatively and mention uncertainty in warnings.",
    "- Include sauces, oils, or dressings only when they are visible or strongly implied.",
    "- Keep calories broadly consistent with protein, carbs, and fat.",
    "- recognizedFoods should contain likely components of the meal.",
    "- reasoning must be short and practical.",
    "- warnings should mention only meaningful uncertainty, not generic disclaimers.",
  ].join("\n");
}

export function createNutritionAnalysisSchema() {
  return {
    type: "object",
    propertyOrdering: [
      "displayName",
      "recognizedFoods",
      "portionDescription",
      "estimatedWeightGrams",
      "calories",
      "protein",
      "carbs",
      "fat",
      "fiber",
      "sugar",
      "sodiumMg",
      "hydrationMl",
      "reasoning",
      "warnings",
      "confidence",
    ],
    properties: {
      displayName: { type: "string", description: "Short meal name." },
      recognizedFoods: {
        type: "array",
        description: "Likely food components in the meal.",
        items: { type: "string" },
        minItems: 1,
        maxItems: 8,
      },
      portionDescription: { type: "string", description: "Human-friendly portion estimate." },
      estimatedWeightGrams: {
        type: "number",
        description: "Approximate total edible weight in grams.",
        minimum: 0,
        maximum: 2500,
      },
      calories: { type: "number", minimum: 0, maximum: 4000 },
      protein: { type: "number", minimum: 0, maximum: 300 },
      carbs: { type: "number", minimum: 0, maximum: 400 },
      fat: { type: "number", minimum: 0, maximum: 250 },
      fiber: { type: "number", minimum: 0, maximum: 100 },
      sugar: { type: "number", minimum: 0, maximum: 200 },
      sodiumMg: { type: "number", minimum: 0, maximum: 12000 },
      hydrationMl: { type: "number", minimum: 0, maximum: 2000 },
      reasoning: { type: "string" },
      warnings: {
        type: "array",
        items: { type: "string" },
        minItems: 0,
        maxItems: 4,
      },
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"],
      },
    },
    required: [
      "displayName",
      "recognizedFoods",
      "portionDescription",
      "estimatedWeightGrams",
      "calories",
      "protein",
      "carbs",
      "fat",
      "fiber",
      "sugar",
      "sodiumMg",
      "hydrationMl",
      "reasoning",
      "warnings",
      "confidence",
    ],
    additionalProperties: false,
  } as const;
}

export function normalizeNutritionAnalysis(
  input: NormalizeNutritionAnalysisInput,
  options: NormalizeNutritionAnalysisOptions
): NutritionAnalysis {
  const protein = clampNumber(Math.round(safeNumber(input.protein)), 0, 300);
  const carbs = clampNumber(Math.round(safeNumber(input.carbs)), 0, 400);
  const fat = clampNumber(Math.round(safeNumber(input.fat)), 0, 250);
  const fiber = clampNumber(Math.round(safeNumber(input.fiber)), 0, 100);
  const sugar = clampNumber(Math.round(safeNumber(input.sugar)), 0, 200);
  const sodiumMg = clampNumber(Math.round(safeNumber(input.sodiumMg)), 0, 12000);
  const hydrationMl = clampNumber(Math.round(safeNumber(input.hydrationMl)), 0, 2000);
  const caloriesFromMacros = Math.round(protein * 4 + carbs * 4 + fat * 9);
  const rawCalories = Math.round(safeNumber(input.calories, caloriesFromMacros));
  const calories =
    rawCalories <= 0 || Math.abs(rawCalories - caloriesFromMacros) > Math.max(160, caloriesFromMacros * 0.3)
      ? caloriesFromMacros
      : rawCalories;

  const displayName =
    safeString(input.displayName) ||
    safeString(options.description) ||
    (options.language === "ro" ? "Masă logată" : "Logged meal");

  const recognizedFoods = safeStringArray(input.recognizedFoods);
  if (recognizedFoods.length === 0) {
    recognizedFoods.push(displayName);
  }

  const portionDescription =
    safeString(input.portionDescription) ||
    safeString(options.quantityText) ||
    (options.language === "ro" ? "1 porție" : "1 serving");

  const reasoning =
    safeString(input.reasoning) ||
    (options.language === "ro"
      ? "Estimare construită din informațiile disponibile."
      : "Estimate built from the available information.");

  return {
    displayName,
    recognizedFoods,
    portionDescription,
    estimatedWeightGrams: clampNumber(Math.round(safeNumber(input.estimatedWeightGrams, 0)), 0, 2500),
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodiumMg,
    hydrationMl,
    reasoning,
    warnings: safeStringArray(input.warnings).slice(0, 4),
    confidence: confidenceFromValue(input.confidence),
    analysisSource: options.source,
  };
}

export function fallbackAnalyzeNutrition({
  description,
  quantityText,
  language,
  source = "fallback",
}: {
  description?: string;
  quantityText?: string;
  language: "ro" | "en";
  source?: NutritionAnalysisSource;
}): NutritionAnalysis {
  const cleanDescription = safeString(description);
  const reference = findBestFoodReference(cleanDescription.toLowerCase());

  if (!reference) {
    const genericName = cleanDescription || (language === "ro" ? "Masă mixtă" : "Mixed meal");
    return normalizeNutritionAnalysis(
      {
        displayName: genericName,
        recognizedFoods: [genericName],
        portionDescription: safeString(quantityText) || (language === "ro" ? "1 porție" : "1 serving"),
        estimatedWeightGrams: 250,
        calories: 420,
        protein: 24,
        carbs: 38,
        fat: 18,
        fiber: 4,
        sugar: 4,
        sodiumMg: 380,
        hydrationMl: 0,
        reasoning:
          language === "ro"
            ? "Nu am putut identifica sigur alimentul, așa că am folosit o estimare generică pentru o masă mixtă."
            : "The food could not be identified confidently, so a generic mixed-meal estimate was used.",
        warnings: [
          language === "ro"
            ? "Estimare generică. Adaugă mai multe detalii pentru rezultate mai precise."
            : "Generic estimate. Add more detail for better accuracy.",
        ],
        confidence: "low",
      },
      { description: cleanDescription, quantityText, language, source }
    );
  }

  const multiplier = getPortionMultiplier(quantityText, reference);
  const displayName = language === "ro" ? reference.displayNameRo : reference.displayNameEn;

  return normalizeNutritionAnalysis(
    {
      displayName,
      recognizedFoods: [displayName],
      portionDescription:
        safeString(quantityText) || (language === "ro" ? reference.portionRo : reference.portionEn),
      estimatedWeightGrams: Math.round(reference.servingGrams * multiplier),
      calories: Math.round(reference.calories * multiplier),
      protein: Math.round(reference.protein * multiplier),
      carbs: Math.round(reference.carbs * multiplier),
      fat: Math.round(reference.fat * multiplier),
      fiber: Math.round(reference.fiber * multiplier),
      sugar: Math.round(reference.sugar * multiplier),
      sodiumMg: Math.round(reference.sodiumMg * multiplier),
      hydrationMl: 0,
      reasoning:
        language === "ro"
          ? "Am folosit o estimare locală pe baza descrierii și a cantității introduse."
          : "A local estimate based on the meal description and quantity was used.",
      warnings: [
        language === "ro"
          ? "Estimare fallback. Pentru precizie mai bună folosește Gemini sau adaugă o poză clară."
          : "Fallback estimate. Use Gemini or add a clear photo for better accuracy.",
      ],
      confidence: quantityText ? "medium" : "low",
    },
    { description: cleanDescription, quantityText, language, source }
  );
}

export function buildMealPlanPrompt(
  profile: DetailedUserProfile,
  targets: NutritionTargets,
  language: "ro" | "en"
): string {
  const mealCount = clampNumber(profile.mealsPerDay || 4, 3, 6);
  const suggestions = getDietPlanSuggestions(profile, language);
  const medicalConditions = profile.medicalConditions.join(", ") || "none";
  const injuries = profile.injuries.join(", ") || "none";

  return [
    "You are an experienced sports nutritionist.",
    `Respond in ${language === "ro" ? "Romanian" : "English"}.`,
    "Build a realistic one-day meal plan for this person.",
    "The plan must be practical, affordable, and easy to follow.",
    `Use exactly ${mealCount} meals.`,
    "",
    "Profile context:",
    buildNutritionProfileContext(profile, targets),
    `Age: ${profile.age}`,
    `Height: ${profile.height} cm`,
    `Weight: ${profile.weight} kg`,
    `Activity level: ${profile.activityLevel}`,
    `Goals: ${profile.goals.join(", ")}`,
    `Priority goal: ${profile.priorityGoal}`,
    `Sleep: ${profile.sleepHours} h`,
    `Stress: ${profile.stressLevel}`,
    `Medical conditions: ${medicalConditions}`,
    `Injuries: ${injuries}`,
    "",
    "Approved style ideas you can adapt:",
    `Breakfast ideas: ${suggestions.breakfast.join(" | ")}`,
    `Lunch ideas: ${suggestions.lunch.join(" | ")}`,
    `Dinner ideas: ${suggestions.dinner.join(" | ")}`,
    `Snack ideas: ${suggestions.snacks.join(" | ")}`,
    "",
    "Rules:",
    "- Match the calorie and macro targets closely across the full day.",
    "- Respect allergies, foods to avoid, and dietary preference.",
    "- Use normal foods and clear quantities.",
    "- Each meal should say why it fits the user's goal.",
    "- coachingTips should be short, direct, and useful.",
    "- shoppingList should contain concrete ingredients, not vague categories.",
  ].join("\n");
}

export function createNutritionMealPlanSchema(mealCount: number) {
  return {
    type: "object",
    propertyOrdering: [
      "title",
      "summary",
      "dailyTargets",
      "meals",
      "coachingTips",
      "shoppingList",
      "hydrationPlan",
    ],
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      dailyTargets: {
        type: "object",
        propertyOrdering: ["calories", "protein", "carbs", "fat", "waterLiters"],
        properties: {
          calories: { type: "number", minimum: 0, maximum: 6000 },
          protein: { type: "number", minimum: 0, maximum: 400 },
          carbs: { type: "number", minimum: 0, maximum: 600 },
          fat: { type: "number", minimum: 0, maximum: 300 },
          waterLiters: { type: "number", minimum: 0, maximum: 12 },
        },
        required: ["calories", "protein", "carbs", "fat", "waterLiters"],
        additionalProperties: false,
      },
      meals: {
        type: "array",
        minItems: mealCount,
        maxItems: mealCount,
        items: {
          type: "object",
          propertyOrdering: [
            "slot",
            "time",
            "title",
            "foods",
            "quantity",
            "calories",
            "protein",
            "carbs",
            "fat",
            "reason",
          ],
          properties: {
            slot: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
            time: { type: "string" },
            title: { type: "string" },
            foods: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 8,
            },
            quantity: { type: "string" },
            calories: { type: "number", minimum: 0, maximum: 2500 },
            protein: { type: "number", minimum: 0, maximum: 200 },
            carbs: { type: "number", minimum: 0, maximum: 250 },
            fat: { type: "number", minimum: 0, maximum: 150 },
            reason: { type: "string" },
          },
          required: ["slot", "time", "title", "foods", "quantity", "calories", "protein", "carbs", "fat", "reason"],
          additionalProperties: false,
        },
      },
      coachingTips: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 6,
      },
      shoppingList: {
        type: "array",
        items: { type: "string" },
        minItems: 6,
        maxItems: 20,
      },
      hydrationPlan: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 6,
      },
    },
    required: ["title", "summary", "dailyTargets", "meals", "coachingTips", "shoppingList", "hydrationPlan"],
    additionalProperties: false,
  } as const;
}

export function buildFallbackMealPlan(
  profile: DetailedUserProfile,
  targets: NutritionTargets,
  language: "ro" | "en"
): NutritionMealPlan {
  const mealCount = clampNumber(profile.mealsPerDay || 4, 3, 6);
  const slots = getMealSlots(mealCount);
  const times = getMealTimes(mealCount);
  const distribution = getMealDistribution(mealCount);
  const suggestions = getDietPlanSuggestions(profile, language);
  let snackIndex = 0;

  const meals = slots.map((slot, index) => {
    const targetRatio = distribution[index] || distribution[distribution.length - 1];
    const calories = Math.round(targets.targetCalories * targetRatio);
    const protein = Math.round(targets.proteinGrams * targetRatio);
    const carbs = Math.round(targets.carbsGrams * targetRatio);
    const fat = Math.round(targets.fatGrams * targetRatio);

    const title =
      slot === "breakfast"
        ? suggestions.breakfast[index % Math.max(suggestions.breakfast.length, 1)] || getMealTitle(slot, language, index)
        : slot === "lunch"
          ? suggestions.lunch[index % Math.max(suggestions.lunch.length, 1)] || getMealTitle(slot, language, index)
          : slot === "dinner"
            ? suggestions.dinner[index % Math.max(suggestions.dinner.length, 1)] || getMealTitle(slot, language, index)
            : suggestions.snacks[snackIndex++ % Math.max(suggestions.snacks.length, 1)] || getMealTitle(slot, language, index);

    return {
      slot,
      time: times[index] || "12:00",
      title,
      foods: [title],
      quantity: language === "ro" ? "1 porție" : "1 serving",
      calories,
      protein,
      carbs,
      fat,
      reason:
        language === "ro"
          ? "Alegere compatibilă cu preferințele, țintele calorice și obiectivul curent."
          : "Fits the dietary preference, calorie target, and current goal.",
    };
  });

  return {
    title: language === "ro" ? "Plan alimentar personalizat" : "Personalized meal plan",
    summary:
      language === "ro"
        ? "Plan fallback construit din profilul tău și sugestiile aprobate din aplicație."
        : "Fallback plan built from your profile and the app's approved meal suggestions.",
    dailyTargets: {
      calories: targets.targetCalories,
      protein: targets.proteinGrams,
      carbs: targets.carbsGrams,
      fat: targets.fatGrams,
      waterLiters: targets.waterLiters,
    },
    meals,
    coachingTips:
      language === "ro"
        ? [
            "Păstrează proteina distribuită uniform pe toate mesele.",
            "Adaugă legume sau fructe la minimum 3 momente din zi.",
            "Pregătește din timp mesele cu risc mare să fie omise.",
          ]
        : [
            "Spread protein evenly across the day.",
            "Add vegetables or fruit to at least 3 eating moments.",
            "Prep the meals most likely to be skipped.",
          ],
    shoppingList:
      language === "ro"
        ? ["ouă", "iaurt", "ovăz", "pui", "orez", "somon", "legume", "fructe", "nuci"]
        : ["eggs", "yogurt", "oats", "chicken", "rice", "salmon", "vegetables", "fruit", "nuts"],
    hydrationPlan:
      language === "ro"
        ? [
            `Bea 0.5L de apă dimineața.`,
            `Mai adaugă 0.5L până la prânz.`,
            `Terminǎ restul până seara pentru a ajunge la ${targets.waterLiters}L.`,
          ]
        : [
            "Drink 0.5L of water in the morning.",
            "Add another 0.5L before lunch.",
            `Finish the rest by evening to reach ${targets.waterLiters}L.`,
          ],
  };
}

export function normalizeNutritionMealPlan(
  input: Partial<NutritionMealPlan> | null | undefined,
  fallbackPlan: NutritionMealPlan
): NutritionMealPlan {
  if (!input) {
    return fallbackPlan;
  }

  const fallbackMeals = fallbackPlan.meals;
  const candidateMeals = Array.isArray(input.meals) ? input.meals : [];

  const meals = fallbackMeals.map((fallbackMeal, index) => {
    const candidate = candidateMeals[index] || fallbackMeal;
    return {
      slot: normalizeMealType(candidate.slot, fallbackMeal.slot),
      time: safeString(candidate.time) || fallbackMeal.time,
      title: safeString(candidate.title) || fallbackMeal.title,
      foods: safeStringArray(candidate.foods).length > 0 ? safeStringArray(candidate.foods) : fallbackMeal.foods,
      quantity: safeString(candidate.quantity) || fallbackMeal.quantity,
      calories: clampNumber(Math.round(safeNumber(candidate.calories, fallbackMeal.calories)), 0, 2500),
      protein: clampNumber(Math.round(safeNumber(candidate.protein, fallbackMeal.protein)), 0, 200),
      carbs: clampNumber(Math.round(safeNumber(candidate.carbs, fallbackMeal.carbs)), 0, 250),
      fat: clampNumber(Math.round(safeNumber(candidate.fat, fallbackMeal.fat)), 0, 150),
      reason: safeString(candidate.reason) || fallbackMeal.reason,
    };
  });

  return {
    title: safeString(input.title) || fallbackPlan.title,
    summary: safeString(input.summary) || fallbackPlan.summary,
    dailyTargets: {
      calories: clampNumber(
        Math.round(safeNumber(input.dailyTargets?.calories, fallbackPlan.dailyTargets.calories)),
        0,
        6000
      ),
      protein: clampNumber(
        Math.round(safeNumber(input.dailyTargets?.protein, fallbackPlan.dailyTargets.protein)),
        0,
        400
      ),
      carbs: clampNumber(
        Math.round(safeNumber(input.dailyTargets?.carbs, fallbackPlan.dailyTargets.carbs)),
        0,
        600
      ),
      fat: clampNumber(Math.round(safeNumber(input.dailyTargets?.fat, fallbackPlan.dailyTargets.fat)), 0, 300),
      waterLiters: clampNumber(
        Number(safeNumber(input.dailyTargets?.waterLiters, fallbackPlan.dailyTargets.waterLiters).toFixed(1)),
        0,
        12
      ),
    },
    meals,
    coachingTips: safeStringArray(input.coachingTips).length > 0 ? safeStringArray(input.coachingTips) : fallbackPlan.coachingTips,
    shoppingList: safeStringArray(input.shoppingList).length > 0 ? safeStringArray(input.shoppingList) : fallbackPlan.shoppingList,
    hydrationPlan: safeStringArray(input.hydrationPlan).length > 0 ? safeStringArray(input.hydrationPlan) : fallbackPlan.hydrationPlan,
  };
}
