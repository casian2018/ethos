import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProfileDocument,
  calculateAge,
  calculateNutritionTargets,
  createEmptyProfileForm,
  profileNeedsOnboarding,
} from "../lib/profile";

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

test("buildProfileDocument normalizes and derives profile fields", () => {
  const profile = buildProfileDocument(buildForm(), { email: "tester@example.com" });

  assert.equal(profile.displayName, "Oprea Tester");
  assert.equal(profile.email, "tester@example.com");
  assert.equal(profile.age, calculateAge("1998-03-14"));
  assert.equal(profile.bmi, 25.4);
  assert.equal(profile.experienceLevel, "intermediate");
  assert.equal(profile.fitnessLevel, "intermediate");
  assert.deepEqual(profile.goals, ["muscle-gain", "strength"]);
  assert.deepEqual(profile.medicalConditions, ["none"]);
  assert.equal(profile.onboardingComplete, true);
});

test("profileNeedsOnboarding rejects incomplete profiles and accepts complete ones", () => {
  const completeProfile = buildProfileDocument(buildForm());
  const incompleteProfile = { ...completeProfile, goals: [] };

  assert.equal(profileNeedsOnboarding(completeProfile), false);
  assert.equal(profileNeedsOnboarding(incompleteProfile), true);
  assert.equal(profileNeedsOnboarding(null), true);
});

test("calculateNutritionTargets adapts calories by goal mode", () => {
  const profile = buildProfileDocument(buildForm());
  const loseTargets = calculateNutritionTargets(profile, "lose");
  const maintainTargets = calculateNutritionTargets(profile, "maintain");
  const gainTargets = calculateNutritionTargets(profile, "gain");

  assert.ok(loseTargets.targetCalories < maintainTargets.targetCalories);
  assert.ok(maintainTargets.targetCalories < gainTargets.targetCalories);
  assert.ok(gainTargets.proteinGrams >= 150);
  assert.ok(gainTargets.waterLiters >= 3.2);
});
