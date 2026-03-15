import test from "node:test";
import assert from "node:assert/strict";
import { buildProfileDocument, calculateNutritionTargets, createEmptyProfileForm } from "../lib/profile";
import {
  buildFallbackMealPlan,
  buildMealPlanPrompt,
  fallbackAnalyzeNutrition,
  normalizeNutritionAnalysis,
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
