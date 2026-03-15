import test from "node:test";
import assert from "node:assert/strict";
import { buildProfileDocument, calculateNutritionTargets, createEmptyProfileForm } from "../lib/profile";
import {
  buildDailyNutritionInsights,
  buildFallbackMealPlan,
  buildMealPlanPrompt,
  estimateBarcodeNutrition,
  fallbackAnalyzeNutrition,
  getNutritionPlanTotals,
  normalizeOpenFoodFactsProduct,
  normalizeNutritionAnalysis,
  normalizeSavedNutritionPlan,
} from "../lib/nutrition";

function buildForm() {
  return {
    ...createEmptyProfileForm(),
    firstName: "Oprea",
    lastName: "Tester",
    birthDate: "1998-03-14",
    gender: "male" as const,
    sex: "male" as const,
    height: "182",
    weight: "84",
    city: "Bucuresti",
    education: "University",
    occupation: "Engineer",
    medicalConditions: ["none"],
    experienceLevel: "intermediate" as const,
    activityLevel: "active" as const,
    goals: ["muscle-gain", "strength"],
    priorityGoal: "muscle-gain",
    motivationType: "performance" as const,
    preferredSports: ["gym", "running"],
    trainingEnvironment: "gym" as const,
    homeEquipment: ["dumbbells", "bench"],
    daysPerWeek: "4",
    workoutDuration: "60",
    sleepHours: "7.5",
    stressLevel: "medium" as const,
    dailySteps: "9000",
    dietaryPreference: "high-protein" as const,
    foodAllergies: ["gluten"],
    foodsToAvoid: ["fast food"],
    mealsPerDay: "4",
    waterIntakeLiters: "3.2",
    supplements: ["creatine"],
  };
}

test("fallbackAnalyzeNutrition uses quantity to scale estimates", () => {
  const analysis = fallbackAnalyzeNutrition({
    description: "piept de pui la gratar",
    quantityText: "200 g",
    language: "ro",
  });

  assert.equal(analysis.displayName, "Pui");
  assert.ok(analysis.calories > 300);
  assert.ok(analysis.protein > 50);
  assert.equal(analysis.analysisSource, "fallback");
});

test("normalizeNutritionAnalysis backfills calories from macros when inconsistent", () => {
  const analysis = normalizeNutritionAnalysis(
    {
      displayName: "Bowl",
      recognizedFoods: ["rice", "chicken"],
      portionDescription: "1 bowl",
      estimatedWeightGrams: 350,
      calories: 50,
      protein: 30,
      carbs: 40,
      fat: 10,
      fiber: 5,
      sugar: 4,
      sodiumMg: 300,
      hydrationMl: 0,
      reasoning: "Test",
      warnings: [],
      confidence: "medium",
    },
    {
      source: "gemini-text",
      language: "en",
      description: "Rice and chicken bowl",
      quantityText: "1 bowl",
    }
  );

  assert.equal(analysis.calories, 370);
  assert.equal(analysis.analysisSource, "gemini-text");
});

test("buildFallbackMealPlan respects meals per day and targets", () => {
  const profile = buildProfileDocument(buildForm());
  const targets = calculateNutritionTargets(profile, "gain");
  const plan = buildFallbackMealPlan(profile, targets, "ro");

  assert.equal(plan.meals.length, 4);
  assert.equal(plan.dailyTargets.calories, targets.targetCalories);
  assert.equal(plan.dailyTargets.waterLiters, targets.waterLiters);
  assert.ok(plan.shoppingList.length >= 6);
});

test("buildMealPlanPrompt includes key profile nutrition context", () => {
  const profile = buildProfileDocument(buildForm());
  const targets = calculateNutritionTargets(profile, "maintain");
  const prompt = buildMealPlanPrompt(profile, targets, "en");

  assert.match(prompt, /Use exactly 4 meals/);
  assert.match(prompt, /Allergies: gluten/);
  assert.match(prompt, /Priority goal: muscle-gain/);
  assert.match(prompt, /Breakfast ideas:/);
});

test("getNutritionPlanTotals sums all meal macros and calories", () => {
  const profile = buildProfileDocument(buildForm());
  const targets = calculateNutritionTargets(profile, "maintain");
  const plan = buildFallbackMealPlan(profile, targets, "en");
  const totals = getNutritionPlanTotals(plan);

  assert.equal(totals.calories, plan.meals.reduce((sum, meal) => sum + meal.calories, 0));
  assert.equal(totals.protein, plan.meals.reduce((sum, meal) => sum + meal.protein, 0));
  assert.equal(totals.carbs, plan.meals.reduce((sum, meal) => sum + meal.carbs, 0));
  assert.equal(totals.fat, plan.meals.reduce((sum, meal) => sum + meal.fat, 0));
});

test("normalizeSavedNutritionPlan restores metadata and nested meal plan", () => {
  const profile = buildProfileDocument(buildForm());
  const targets = calculateNutritionTargets(profile, "gain");
  const fallbackPlan = buildFallbackMealPlan(profile, targets, "ro");

  const saved = normalizeSavedNutritionPlan(
    "plan-1",
    {
      title: "High protein cut",
      summary: "Stored plan",
      goalMode: "lose",
      language: "en",
      source: "ai",
      isActive: true,
      plan: {
        ...fallbackPlan,
        title: "Stored plan title",
      },
      createdAt: "2026-03-15T10:00:00.000Z",
      updatedAt: "2026-03-15T12:00:00.000Z",
    },
    fallbackPlan
  );

  assert.equal(saved.id, "plan-1");
  assert.equal(saved.goalMode, "lose");
  assert.equal(saved.language, "en");
  assert.equal(saved.source, "ai");
  assert.equal(saved.isActive, true);
  assert.equal(saved.plan.title, "Stored plan title");
  assert.equal(saved.createdAt.toISOString(), "2026-03-15T10:00:00.000Z");
});

test("buildDailyNutritionInsights flags calories, protein, and hydration gaps", () => {
  const profile = buildProfileDocument(buildForm());
  const targets = calculateNutritionTargets(profile, "maintain");
  const insights = buildDailyNutritionInsights({
    language: "en",
    targets,
    consumed: {
      calories: targets.targetCalories - 350,
      protein: targets.proteinGrams - 30,
      carbs: targets.carbsGrams - 20,
      fat: targets.fatGrams - 10,
    },
    waterConsumedMl: 1200,
  });

  assert.equal(insights.length, 3);
  assert.match(insights[0]?.description || "", /350 kcal|about 350/);
  assert.match(insights[1]?.description || "", /protein/i);
  assert.match(insights[2]?.description || "", /water/i);
});

test("normalizeOpenFoodFactsProduct maps product nutriments and serving size", () => {
  const product = normalizeOpenFoodFactsProduct(
    {
      product_name: "Protein Bar",
      brands: "Ethos",
      serving_size: "1 bar (40 g)",
      nutriscore_grade: "b",
      nova_group: 4,
      nutriments: {
        "energy-kcal_100g": 410,
        proteins_100g: 30,
        carbohydrates_100g: 35,
        fat_100g: 14,
        fiber_100g: 8,
        sugars_100g: 12,
        salt_100g: 0.8,
      },
    },
    "5941234567890",
    "en"
  );

  assert.ok(product);
  assert.equal(product?.name, "Protein Bar");
  assert.equal(product?.brand, "Ethos");
  assert.equal(product?.quantityHintGrams, 40);
  assert.equal(product?.nutriscore, "B");
  assert.equal(product?.novaGroup, 4);
  assert.equal(product?.sodiumMgPer100g, 320);
});

test("estimateBarcodeNutrition scales per-100g values to selected grams", () => {
  const estimate = estimateBarcodeNutrition(
    {
      barcode: "5941234567890",
      name: "Protein Bar",
      brand: "Ethos",
      caloriesPer100g: 410,
      proteinPer100g: 30,
      carbsPer100g: 35,
      fatPer100g: 14,
      fiberPer100g: 8,
      sugarPer100g: 12,
      sodiumMgPer100g: 320,
      quantityHintGrams: 40,
    },
    40
  );

  assert.equal(estimate.grams, 40);
  assert.equal(estimate.calories, 164);
  assert.equal(estimate.protein, 12);
  assert.equal(estimate.carbs, 14);
  assert.equal(estimate.fat, 5.6);
  assert.equal(estimate.sodiumMg, 128);
});
