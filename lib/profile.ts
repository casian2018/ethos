"use client";

export type GenderIdentity = "male" | "female" | "non-binary" | "prefer-not-to-say";
export type BiologicalSex = "male" | "female" | "intersex" | "prefer-not-to-say";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type StressLevel = "low" | "medium" | "high";
export type MotivationType = "health" | "discipline" | "performance" | "confidence" | "energy" | "social";
export type TrainingEnvironment = "gym" | "home" | "outdoor" | "hybrid";
export type DietaryPreference =
  | "balanced"
  | "high-protein"
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "low-carb"
  | "mediterranean";
export type GoalMode = "lose" | "maintain" | "gain";

export interface LocalizedOption<T extends string = string> {
  value: T;
  labelRo: string;
  labelEn: string;
  emoji?: string;
  descriptionRo?: string;
  descriptionEn?: string;
}

export interface DetailedUserProfile {
  id?: string;
  email?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phoneNumber: string;
  birthDate: string;
  age: number;
  gender: GenderIdentity;
  sex: BiologicalSex;
  height: number;
  weight: number;
  bmi: number;
  bodyFatPercentage: number | null;
  city: string;
  education: string;
  occupation: string;
  hobbies: string[];
  medicalConditions: string[];
  injuries: string[];
  experienceLevel: ExperienceLevel;
  fitnessLevel: ExperienceLevel;
  activityLevel: ActivityLevel;
  goals: string[];
  priorityGoal: string;
  motivationType: MotivationType;
  preferredSports: string[];
  trainingEnvironment: TrainingEnvironment;
  homeEquipment: string[];
  daysPerWeek: number;
  workoutDuration: number;
  sleepHours: number;
  stressLevel: StressLevel;
  dailySteps: number;
  dietaryPreference: DietaryPreference;
  foodAllergies: string[];
  foodsToAvoid: string[];
  mealsPerDay: number;
  waterIntakeLiters: number;
  supplements: string[];
  lookingForBuddy: boolean;
  onboardingComplete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProfileFormState {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phoneNumber: string;
  birthDate: string;
  gender: GenderIdentity | "";
  sex: BiologicalSex | "";
  height: string;
  weight: string;
  bodyFatPercentage: string;
  city: string;
  education: string;
  occupation: string;
  hobbies: string[];
  medicalConditions: string[];
  injuries: string[];
  experienceLevel: ExperienceLevel | "";
  activityLevel: ActivityLevel | "";
  goals: string[];
  priorityGoal: string;
  motivationType: MotivationType | "";
  preferredSports: string[];
  trainingEnvironment: TrainingEnvironment | "";
  homeEquipment: string[];
  daysPerWeek: string;
  workoutDuration: string;
  sleepHours: string;
  stressLevel: StressLevel | "";
  dailySteps: string;
  dietaryPreference: DietaryPreference | "";
  foodAllergies: string[];
  foodsToAvoid: string[];
  mealsPerDay: string;
  waterIntakeLiters: string;
  supplements: string[];
  lookingForBuddy: boolean;
}

export interface NutritionTargets {
  age: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterLiters: number;
}

export const genderOptions: LocalizedOption<GenderIdentity>[] = [
  { value: "male", labelRo: "Masculin", labelEn: "Male", emoji: "👨" },
  { value: "female", labelRo: "Feminin", labelEn: "Female", emoji: "👩" },
  { value: "non-binary", labelRo: "Non-binar", labelEn: "Non-binary", emoji: "🧑" },
  { value: "prefer-not-to-say", labelRo: "Prefer să nu spun", labelEn: "Prefer not to say", emoji: "🤐" },
];

export const sexOptions: LocalizedOption<BiologicalSex>[] = [
  { value: "male", labelRo: "Masculin", labelEn: "Male", emoji: "♂️" },
  { value: "female", labelRo: "Feminin", labelEn: "Female", emoji: "♀️" },
  { value: "intersex", labelRo: "Intersex", labelEn: "Intersex", emoji: "⚥" },
  { value: "prefer-not-to-say", labelRo: "Prefer să nu spun", labelEn: "Prefer not to say", emoji: "🤐" },
];

export const experienceOptions: LocalizedOption<ExperienceLevel>[] = [
  {
    value: "beginner",
    labelRo: "Începător",
    labelEn: "Beginner",
    emoji: "🌱",
    descriptionRo: "Ai nevoie de structură și progresie clară.",
    descriptionEn: "You need structure and clear progression.",
  },
  {
    value: "intermediate",
    labelRo: "Intermediar",
    labelEn: "Intermediate",
    emoji: "💪",
    descriptionRo: "Ai deja bază și poți susține volum moderat.",
    descriptionEn: "You already have a base and can handle moderate volume.",
  },
  {
    value: "advanced",
    labelRo: "Avansat",
    labelEn: "Advanced",
    emoji: "🔥",
    descriptionRo: "Ai experiență solidă și urmărești performanță.",
    descriptionEn: "You have solid experience and performance goals.",
  },
];

export const activityLevelOptions: LocalizedOption<ActivityLevel>[] = [
  { value: "sedentary", labelRo: "Sedentar", labelEn: "Sedentary", emoji: "🛋️" },
  { value: "light", labelRo: "Ușor activ", labelEn: "Lightly active", emoji: "🚶" },
  { value: "moderate", labelRo: "Moderat activ", labelEn: "Moderately active", emoji: "🏃" },
  { value: "active", labelRo: "Activ", labelEn: "Active", emoji: "🏋️" },
  { value: "very_active", labelRo: "Foarte activ", labelEn: "Very active", emoji: "⚡" },
];

export const stressLevelOptions: LocalizedOption<StressLevel>[] = [
  { value: "low", labelRo: "Scăzut", labelEn: "Low", emoji: "😌" },
  { value: "medium", labelRo: "Mediu", labelEn: "Medium", emoji: "🙂" },
  { value: "high", labelRo: "Ridicat", labelEn: "High", emoji: "😵" },
];

export const motivationOptions: LocalizedOption<MotivationType>[] = [
  { value: "health", labelRo: "Sănătate", labelEn: "Health", emoji: "❤️" },
  { value: "discipline", labelRo: "Disciplină", labelEn: "Discipline", emoji: "📅" },
  { value: "performance", labelRo: "Performanță", labelEn: "Performance", emoji: "🏆" },
  { value: "confidence", labelRo: "Încredere", labelEn: "Confidence", emoji: "✨" },
  { value: "energy", labelRo: "Energie", labelEn: "Energy", emoji: "⚡" },
  { value: "social", labelRo: "Social", labelEn: "Social", emoji: "🤝" },
];

export const trainingEnvironmentOptions: LocalizedOption<TrainingEnvironment>[] = [
  { value: "gym", labelRo: "Sală", labelEn: "Gym", emoji: "🏋️" },
  { value: "home", labelRo: "Acasă", labelEn: "Home", emoji: "🏠" },
  { value: "outdoor", labelRo: "Outdoor", labelEn: "Outdoor", emoji: "🌳" },
  { value: "hybrid", labelRo: "Mixt", labelEn: "Hybrid", emoji: "🔄" },
];

export const dietaryPreferenceOptions: LocalizedOption<DietaryPreference>[] = [
  { value: "balanced", labelRo: "Echilibrat", labelEn: "Balanced", emoji: "🥗" },
  { value: "high-protein", labelRo: "Bogată în proteine", labelEn: "High protein", emoji: "🍗" },
  { value: "vegetarian", labelRo: "Vegetarian", labelEn: "Vegetarian", emoji: "🥦" },
  { value: "vegan", labelRo: "Vegan", labelEn: "Vegan", emoji: "🌱" },
  { value: "pescatarian", labelRo: "Pescatarian", labelEn: "Pescatarian", emoji: "🐟" },
  { value: "low-carb", labelRo: "Low carb", labelEn: "Low carb", emoji: "🥚" },
  { value: "mediterranean", labelRo: "Mediteranean", labelEn: "Mediterranean", emoji: "🫒" },
];

export const sportOptions: LocalizedOption[] = [
  { value: "gym", labelRo: "Sală", labelEn: "Gym", emoji: "🏋️" },
  { value: "running", labelRo: "Alergare", labelEn: "Running", emoji: "🏃" },
  { value: "swimming", labelRo: "Înot", labelEn: "Swimming", emoji: "🏊" },
  { value: "cycling", labelRo: "Ciclism", labelEn: "Cycling", emoji: "🚴" },
  { value: "football", labelRo: "Fotbal", labelEn: "Football", emoji: "⚽" },
  { value: "basketball", labelRo: "Baschet", labelEn: "Basketball", emoji: "🏀" },
  { value: "tennis", labelRo: "Tenis", labelEn: "Tennis", emoji: "🎾" },
  { value: "yoga", labelRo: "Yoga", labelEn: "Yoga", emoji: "🧘" },
  { value: "boxing", labelRo: "Box", labelEn: "Boxing", emoji: "🥊" },
  { value: "pilates", labelRo: "Pilates", labelEn: "Pilates", emoji: "🩰" },
];

export const goalOptions: LocalizedOption[] = [
  { value: "weight-loss", labelRo: "Slăbire", labelEn: "Weight loss", emoji: "📉" },
  { value: "muscle-gain", labelRo: "Masă musculară", labelEn: "Muscle gain", emoji: "💪" },
  { value: "recomposition", labelRo: "Recompoziție", labelEn: "Body recomposition", emoji: "⚖️" },
  { value: "strength", labelRo: "Forță", labelEn: "Strength", emoji: "🏋️" },
  { value: "endurance", labelRo: "Rezistență", labelEn: "Endurance", emoji: "🏃" },
  { value: "mobility", labelRo: "Mobilitate", labelEn: "Mobility", emoji: "🤸" },
  { value: "general-health", labelRo: "Sănătate generală", labelEn: "General health", emoji: "❤️" },
  { value: "better-sleep", labelRo: "Somn mai bun", labelEn: "Better sleep", emoji: "😴" },
];

export const medicalConditionOptions: LocalizedOption[] = [
  { value: "none", labelRo: "Niciuna", labelEn: "None", emoji: "✅" },
  { value: "obesity", labelRo: "Obezitate", labelEn: "Obesity", emoji: "⚖️" },
  { value: "anorexia", labelRo: "Anorexie", labelEn: "Anorexia", emoji: "🍽️" },
  { value: "anemia", labelRo: "Anemie", labelEn: "Anemia", emoji: "🩸" },
  { value: "joint-problems", labelRo: "Probleme articulare", labelEn: "Joint problems", emoji: "🦴" },
  { value: "hypertension", labelRo: "Hipertensiune", labelEn: "Hypertension", emoji: "❤️" },
  { value: "diabetes", labelRo: "Diabet", labelEn: "Diabetes", emoji: "💉" },
  { value: "back-pain", labelRo: "Dureri de spate", labelEn: "Back pain", emoji: "🪑" },
  { value: "heart-condition", labelRo: "Probleme cardiace", labelEn: "Heart condition", emoji: "❤️‍🩹" },
  { value: "asthma", labelRo: "Astm", labelEn: "Asthma", emoji: "😮‍💨" },
];

export const equipmentOptions: LocalizedOption[] = [
  { value: "none", labelRo: "Fără echipament", labelEn: "No equipment", emoji: "🙌" },
  { value: "dumbbells", labelRo: "Gantere", labelEn: "Dumbbells", emoji: "🏋️" },
  { value: "barbell", labelRo: "Bară", labelEn: "Barbell", emoji: "🏋️‍♂️" },
  { value: "bench", labelRo: "Bancă", labelEn: "Bench", emoji: "🪑" },
  { value: "resistance-bands", labelRo: "Benzi", labelEn: "Resistance bands", emoji: "🪢" },
  { value: "kettlebell", labelRo: "Kettlebell", labelEn: "Kettlebell", emoji: "🔔" },
  { value: "pull-up-bar", labelRo: "Bară tracțiuni", labelEn: "Pull-up bar", emoji: "📏" },
  { value: "yoga-mat", labelRo: "Saltea", labelEn: "Yoga mat", emoji: "🧘" },
  { value: "stationary-bike", labelRo: "Bicicletă", labelEn: "Stationary bike", emoji: "🚴" },
  { value: "treadmill", labelRo: "Bandă de alergare", labelEn: "Treadmill", emoji: "🏃" },
];

const REQUIRED_PROFILE_KEYS: Array<keyof DetailedUserProfile> = [
  "firstName",
  "lastName",
  "birthDate",
  "gender",
  "sex",
  "height",
  "weight",
  "city",
  "experienceLevel",
  "activityLevel",
  "goals",
  "priorityGoal",
  "motivationType",
  "preferredSports",
  "trainingEnvironment",
  "medicalConditions",
  "sleepHours",
  "stressLevel",
  "dietaryPreference",
  "mealsPerDay",
  "waterIntakeLiters",
];

const LEGACY_GOAL_MAP: Record<string, string> = {
  "lose fat": "weight-loss",
  "gain muscle": "muscle-gain",
  fitness: "general-health",
};

const LEGACY_MEDICAL_MAP: Record<string, string> = {
  backPain: "back-pain",
  heartCondition: "heart-condition",
};

function dedupe(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function splitTags(value: string): string[] {
  return dedupe(value.split(","));
}

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNullableNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeGoals(goals: string[] | undefined): string[] {
  return dedupe((goals || []).map((goal) => LEGACY_GOAL_MAP[goal] || goal));
}

function normalizeMedicalConditions(conditions: string[] | undefined): string[] {
  const normalized = dedupe((conditions || []).map((condition) => LEGACY_MEDICAL_MAP[condition] || condition));
  if (normalized.length === 0) {
    return ["none"];
  }
  if (normalized.includes("none") && normalized.length > 1) {
    return normalized.filter((condition) => condition !== "none");
  }
  return normalized;
}

function normalizeEquipment(items: string[] | undefined): string[] {
  const normalized = dedupe(items || []);
  if (normalized.length === 0) {
    return ["none"];
  }
  if (normalized.includes("none") && normalized.length > 1) {
    return normalized.filter((item) => item !== "none");
  }
  return normalized;
}

export function calculateAge(birthDateString: string): number {
  if (!birthDateString) {
    return 0;
  }

  const birthDate = new Date(birthDateString);
  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export function calculateBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) {
    return 0;
  }

  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getOptionLabel(
  options: LocalizedOption[],
  value: string,
  language: "ro" | "en"
): string {
  const match = options.find((option) => option.value === value);
  if (!match) {
    return value;
  }

  return language === "ro" ? match.labelRo : match.labelEn;
}

export function formatTagList(values: string[], options: LocalizedOption[], language: "ro" | "en"): string[] {
  return values.map((value) => getOptionLabel(options, value, language));
}

export function getActivityMultiplier(activityLevel: ActivityLevel): number {
  switch (activityLevel) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "active":
      return 1.725;
    case "very_active":
      return 1.9;
    default:
      return 1.4;
  }
}

export function getGoalModeFromGoals(goals: string[], priorityGoal?: string): GoalMode {
  const candidate = priorityGoal || goals[0] || "";
  if (candidate === "weight-loss") {
    return "lose";
  }
  if (candidate === "muscle-gain") {
    return "gain";
  }
  return "maintain";
}

export function resolveExperienceLevel(profile: Partial<DetailedUserProfile>): ExperienceLevel | "" {
  return (profile.experienceLevel || profile.fitnessLevel || "") as ExperienceLevel | "";
}

export function createEmptyProfileForm(overrides: Partial<ProfileFormState> = {}): ProfileFormState {
  return {
    email: "",
    firstName: "",
    lastName: "",
    displayName: "",
    phoneNumber: "",
    birthDate: "",
    gender: "",
    sex: "",
    height: "",
    weight: "",
    bodyFatPercentage: "",
    city: "",
    education: "",
    occupation: "",
    hobbies: [],
    medicalConditions: ["none"],
    injuries: [],
    experienceLevel: "",
    activityLevel: "",
    goals: [],
    priorityGoal: "",
    motivationType: "",
    preferredSports: [],
    trainingEnvironment: "",
    homeEquipment: ["none"],
    daysPerWeek: "3",
    workoutDuration: "45",
    sleepHours: "7.5",
    stressLevel: "",
    dailySteps: "8000",
    dietaryPreference: "",
    foodAllergies: [],
    foodsToAvoid: [],
    mealsPerDay: "4",
    waterIntakeLiters: "2.5",
    supplements: [],
    lookingForBuddy: false,
    ...overrides,
  };
}

export function profileToFormState(
  profile?: Partial<DetailedUserProfile> | null,
  overrides: Partial<ProfileFormState> = {}
): ProfileFormState {
  const experienceLevel = resolveExperienceLevel(profile || {});
  const merged = createEmptyProfileForm({
    email: profile?.email || "",
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    displayName: profile?.displayName || "",
    phoneNumber: profile?.phoneNumber || "",
    birthDate: profile?.birthDate || "",
    gender: (profile?.gender as GenderIdentity | undefined) || "",
    sex: (profile?.sex as BiologicalSex | undefined) || "",
    height: profile?.height ? String(profile.height) : "",
    weight: profile?.weight ? String(profile.weight) : "",
    bodyFatPercentage: profile?.bodyFatPercentage ? String(profile.bodyFatPercentage) : "",
    city: profile?.city || "",
    education: profile?.education || "",
    occupation: profile?.occupation || "",
    hobbies: dedupe(profile?.hobbies || []),
    medicalConditions: normalizeMedicalConditions(profile?.medicalConditions),
    injuries: dedupe(profile?.injuries || []),
    experienceLevel,
    activityLevel: (profile?.activityLevel as ActivityLevel | undefined) || "",
    goals: normalizeGoals(profile?.goals),
    priorityGoal: profile?.priorityGoal || "",
    motivationType: (profile?.motivationType as MotivationType | undefined) || "",
    preferredSports: dedupe(profile?.preferredSports || []),
    trainingEnvironment: (profile?.trainingEnvironment as TrainingEnvironment | undefined) || "",
    homeEquipment: normalizeEquipment(profile?.homeEquipment),
    daysPerWeek: profile?.daysPerWeek ? String(profile.daysPerWeek) : "3",
    workoutDuration: profile?.workoutDuration ? String(profile.workoutDuration) : "45",
    sleepHours: profile?.sleepHours ? String(profile.sleepHours) : "7.5",
    stressLevel: (profile?.stressLevel as StressLevel | undefined) || "",
    dailySteps: profile?.dailySteps ? String(profile.dailySteps) : "8000",
    dietaryPreference: (profile?.dietaryPreference as DietaryPreference | undefined) || "",
    foodAllergies: dedupe(profile?.foodAllergies || []),
    foodsToAvoid: dedupe(profile?.foodsToAvoid || []),
    mealsPerDay: profile?.mealsPerDay ? String(profile.mealsPerDay) : "4",
    waterIntakeLiters: profile?.waterIntakeLiters ? String(profile.waterIntakeLiters) : "2.5",
    supplements: dedupe(profile?.supplements || []),
    lookingForBuddy: profile?.lookingForBuddy || false,
  });

  return {
    ...merged,
    ...overrides,
  };
}

export function buildDisplayName(firstName: string, lastName: string, displayName: string): string {
  if (displayName.trim()) {
    return displayName.trim();
  }

  return `${firstName} ${lastName}`.trim();
}

export function buildProfileDocument(
  formState: ProfileFormState,
  metadata: {
    email?: string;
    createdAt?: Date;
  } = {}
): DetailedUserProfile {
  const firstName = formState.firstName.trim();
  const lastName = formState.lastName.trim();
  const height = parseNumber(formState.height, 0);
  const weight = parseNumber(formState.weight, 0);
  const medicalConditions = normalizeMedicalConditions(formState.medicalConditions);
  const goals = normalizeGoals(formState.goals);
  const experienceLevel = (formState.experienceLevel || "beginner") as ExperienceLevel;
  const trainingEnvironment = (formState.trainingEnvironment || "gym") as TrainingEnvironment;
  const activityLevel = (formState.activityLevel || "moderate") as ActivityLevel;
  const stressLevel = (formState.stressLevel || "medium") as StressLevel;
  const dietaryPreference = (formState.dietaryPreference || "balanced") as DietaryPreference;
  const motivationType = (formState.motivationType || "health") as MotivationType;
  const displayName = buildDisplayName(firstName, lastName, formState.displayName);
  const createdAt = metadata.createdAt || new Date();

  return {
    email: metadata.email || formState.email || undefined,
    firstName,
    lastName,
    displayName,
    phoneNumber: formState.phoneNumber.trim(),
    birthDate: formState.birthDate,
    age: calculateAge(formState.birthDate),
    gender: (formState.gender || "prefer-not-to-say") as GenderIdentity,
    sex: (formState.sex || "prefer-not-to-say") as BiologicalSex,
    height,
    weight,
    bmi: calculateBMI(height, weight),
    bodyFatPercentage: parseNullableNumber(formState.bodyFatPercentage),
    city: formState.city.trim(),
    education: formState.education.trim(),
    occupation: formState.occupation.trim(),
    hobbies: dedupe(formState.hobbies),
    medicalConditions,
    injuries: dedupe(formState.injuries),
    experienceLevel,
    fitnessLevel: experienceLevel,
    activityLevel,
    goals,
    priorityGoal: formState.priorityGoal || goals[0] || "general-health",
    motivationType,
    preferredSports: dedupe(formState.preferredSports),
    trainingEnvironment,
    homeEquipment: normalizeEquipment(formState.homeEquipment),
    daysPerWeek: parseNumber(formState.daysPerWeek, 3),
    workoutDuration: parseNumber(formState.workoutDuration, 45),
    sleepHours: parseNumber(formState.sleepHours, 7.5),
    stressLevel,
    dailySteps: parseNumber(formState.dailySteps, 8000),
    dietaryPreference,
    foodAllergies: dedupe(formState.foodAllergies),
    foodsToAvoid: dedupe(formState.foodsToAvoid),
    mealsPerDay: parseNumber(formState.mealsPerDay, 4),
    waterIntakeLiters: parseNumber(formState.waterIntakeLiters, 2.5),
    supplements: dedupe(formState.supplements),
    lookingForBuddy: Boolean(formState.lookingForBuddy),
    onboardingComplete: true,
    createdAt,
    updatedAt: new Date(),
  };
}

export function profileNeedsOnboarding(profile?: Partial<DetailedUserProfile> | null): boolean {
  if (!profile || !profile.onboardingComplete) {
    return true;
  }

  return REQUIRED_PROFILE_KEYS.some((key) => {
    const value = profile[key];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return value === null || value === undefined || value === "";
  });
}

function inferSexForCalories(profile: DetailedUserProfile): "male" | "female" {
  if (profile.sex === "female") {
    return "female";
  }
  if (profile.sex === "male") {
    return "male";
  }
  if (profile.gender === "female") {
    return "female";
  }
  return "male";
}

export function calculateNutritionTargets(
  profile: DetailedUserProfile,
  goalMode: GoalMode = getGoalModeFromGoals(profile.goals, profile.priorityGoal)
): NutritionTargets {
  const age = profile.age || calculateAge(profile.birthDate);
  const calorieSex = inferSexForCalories(profile);
  const baseAdjustment = calorieSex === "male" ? 5 : -161;
  const bmr = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * age + baseAdjustment);
  const tdee = Math.round(bmr * getActivityMultiplier(profile.activityLevel));

  let targetCalories = tdee;
  if (goalMode === "lose") {
    targetCalories -= 450;
  } else if (goalMode === "gain") {
    targetCalories += 250;
  }

  const proteinMultiplier =
    profile.priorityGoal === "muscle-gain"
      ? 2
      : profile.priorityGoal === "weight-loss"
        ? 1.8
        : 1.6;
  const fatMultiplier = profile.priorityGoal === "weight-loss" ? 0.8 : 0.9;
  const proteinGrams = Math.max(90, Math.round(profile.weight * proteinMultiplier));
  const fatGrams = Math.max(50, Math.round(profile.weight * fatMultiplier));
  const carbsGrams = Math.max(80, Math.round((targetCalories - proteinGrams * 4 - fatGrams * 9) / 4));
  const waterLiters = Math.max(profile.waterIntakeLiters, Math.round(profile.weight * 0.035 * 10) / 10);

  return {
    age,
    bmr,
    tdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    waterLiters,
  };
}

export function buildWorkoutProfileContext(profile: DetailedUserProfile): string {
  return [
    `Name: ${getProfileHeadline(profile)}`,
    `Age: ${profile.age || calculateAge(profile.birthDate)}`,
    `Gender identity: ${profile.gender}`,
    `Sex: ${profile.sex}`,
    `Body: ${profile.height} cm, ${profile.weight} kg, BMI ${profile.bmi}`,
    `Experience: ${profile.experienceLevel}`,
    `Goals: ${profile.goals.join(", ")}`,
    `Priority goal: ${profile.priorityGoal}`,
    `Motivation: ${profile.motivationType}`,
    `Preferred sports: ${profile.preferredSports.join(", ")}`,
    `Training environment: ${profile.trainingEnvironment}`,
    `Equipment: ${profile.homeEquipment.join(", ")}`,
    `Days per week: ${profile.daysPerWeek}`,
    `Preferred duration: ${profile.workoutDuration} min`,
    `Activity level: ${profile.activityLevel}`,
    `Daily steps: ${profile.dailySteps}`,
    `Sleep: ${profile.sleepHours} h`,
    `Stress: ${profile.stressLevel}`,
    `Medical conditions: ${profile.medicalConditions.join(", ")}`,
    `Injuries or pain points: ${profile.injuries.join(", ") || "none"}`,
  ].join("\n");
}

export function buildNutritionProfileContext(profile: DetailedUserProfile, targets: NutritionTargets): string {
  return [
    `Goal calories: ${targets.targetCalories} kcal`,
    `Macros: ${targets.proteinGrams}g protein, ${targets.carbsGrams}g carbs, ${targets.fatGrams}g fat`,
    `Meals per day: ${profile.mealsPerDay}`,
    `Diet preference: ${profile.dietaryPreference}`,
    `Allergies: ${profile.foodAllergies.join(", ") || "none"}`,
    `Foods to avoid: ${profile.foodsToAvoid.join(", ") || "none"}`,
    `Supplements: ${profile.supplements.join(", ") || "none"}`,
    `Water target: ${targets.waterLiters} L`,
  ].join("\n");
}

export function getProfileHeadline(profile: Partial<DetailedUserProfile>): string {
  const displayName = profile.displayName?.trim();
  if (displayName) {
    return displayName;
  }

  return `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Ethos Member";
}

export function toCommaSeparatedInput(values: string[]): string {
  return values.join(", ");
}

export function fromCommaSeparatedInput(value: string): string[] {
  return splitTags(value);
}
