/**
 * Health Utilities - Reusable functions for health data processing
 * 
 * Features:
 * - Calculate adaptive targets based on medical conditions
 * - Calculate streak
 * - Determine achievements
 * - Format health data
 */

// Default targets
const DEFAULT_TARGETS = {
  steps: 10000,
  calories: 500,
  activeMinutes: 30
};

// Medical condition adjusted targets
const ADAPTIVE_TARGETS: Record<string, { steps: number; calories: number; activeMinutes: number }> = {
  obesity: { steps: 5000, calories: 300, activeMinutes: 20 },
  "joint-problems": { steps: 6000, calories: 350, activeMinutes: 25 },
  "back-pain": { steps: 5000, calories: 300, activeMinutes: 20 },
  "heart-condition": { steps: 5000, calories: 250, activeMinutes: 15 },
  hypertension: { steps: 6000, calories: 300, activeMinutes: 20 },
  diabetes: { steps: 7000, calories: 350, activeMinutes: 25 },
  anemia: { steps: 8000, calories: 400, activeMinutes: 30 },
};

/**
 * Get adaptive health targets based on medical conditions
 */
export function getAdaptiveTargets(medicalConditions: string[]): {
  steps: number;
  calories: number;
  activeMinutes: number;
} {
  // If user has any medical conditions that affect activity, use adaptive targets
  const relevantConditions = medicalConditions.filter(
    cond => cond !== "none" && ADAPTIVE_TARGETS[cond]
  );

  if (relevantConditions.length === 0) {
    return DEFAULT_TARGETS;
  }

  // Use the lowest targets from all relevant conditions
  let minSteps = DEFAULT_TARGETS.steps;
  let minCalories = DEFAULT_TARGETS.calories;
  let minActiveMinutes = DEFAULT_TARGETS.activeMinutes;

  relevantConditions.forEach(cond => {
    const targets = ADAPTIVE_TARGETS[cond];
    if (targets) {
      minSteps = Math.min(minSteps, targets.steps);
      minCalories = Math.min(minCalories, targets.calories);
      minActiveMinutes = Math.min(minActiveMinutes, targets.activeMinutes);
    }
  });

  return {
    steps: minSteps,
    calories: minCalories,
    activeMinutes: minActiveMinutes
  };
}

/**
 * Check if target is met
 */
export function isTargetMet(actual: number, target: number): boolean {
  return actual >= target;
}

/**
 * Calculate streak from health stats
 */
export function calculateStreak(stats: Array<{ date: string; steps: number; activeMinutes: number }>): number {
  if (stats.length === 0) return 0;

  const sortedByDate = [...stats].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedByDate.length; i++) {
    const statDate = new Date(sortedByDate[i].date);
    statDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24));

    // Allow for today or yesterday to count
    if (diffDays > 1) break;

    // Check if user was active (steps > 0 or activeMinutes > 0)
    if (sortedByDate[i].steps > 0 || sortedByDate[i].activeMinutes > 0) {
      streak++;
    } else if (diffDays === 0) {
      // Today doesn't count as a break if no data yet
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Achievement types
 */
export type AchievementType = 
  | "first_day"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "steps_5k"
  | "steps_10k"
  | "steps_50k"
  | "calories_1000"
  | "calories_5000"
  | "active_30"
  | "active_150";

export interface Achievement {
  id: AchievementType;
  emoji: string;
  titleRo: string;
  titleEn: string;
  descRo: string;
  descEn: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_day", emoji: "🌟", titleRo: "Primul Pas", titleEn: "First Step", descRo: "Ai înregistrat prima ta zi de activitate", descEn: "Recorded your first activity day" },
  { id: "streak_3", emoji: "🔥", titleRo: "Pe Foc", titleEn: "On Fire", descRo: "3 zile consecutive de activitate", descEn: "3 consecutive days of activity" },
  { id: "streak_7", emoji: "💪", titleRo: "Săptămână", titleEn: "Weekly Warrior", descRo: "7 zile consecutive de activitate", descEn: "7 consecutive days of activity" },
  { id: "streak_30", emoji: "🏆", titleRo: "Lunar", titleEn: "Monthly Master", descRo: "30 zile consecutive de activitate", descEn: "30 consecutive days of activity" },
  { id: "steps_5k", emoji: "🚶", titleRo: "Primii Pași", titleEn: "First Steps", descRo: "5,000 pași într-o zi", descEn: "5,000 steps in a day" },
  { id: "steps_10k", emoji: "🏃", titleRo: "Maratonist", titleEn: "Marathon Runner", descRo: "10,000 pași într-o zi", descEn: "10,000 steps in a day" },
  { id: "steps_50k", emoji: "⚡", titleRo: "Super Activ", titleEn: "Super Active", descRo: "50,000 pași într-o săptămână", descEn: "50,000 steps in a week" },
  { id: "calories_1000", emoji: "🔥", titleRo: "Ardere", titleEn: "Burn", descRo: "1,000 calorii într-o zi", descEn: "1,000 calories in a day" },
  { id: "calories_5000", emoji: "🌋", titleRo: "Vulcan", titleEn: "Volcano", descRo: "5,000 calorii într-o săptămână", descEn: "5,000 calories in a week" },
  { id: "active_30", emoji: "⏱️", titleRo: "Activ", titleEn: "Active", descRo: "30 minute active într-o zi", descEn: "30 active minutes in a day" },
  { id: "active_150", emoji: "🕐", titleRo: "Durata", titleEn: "Dedicated", descRo: "150 minute active într-o săptămână", descEn: "150 active minutes in a week" },
];

/**
 * Check unlocked achievements based on stats
 */
export function checkAchievements(stats: Array<{
  steps: number;
  calories: number;
  activeMinutes: number;
  date: string;
}>): Achievement[] {
  if (stats.length === 0) return [];

  const unlocked: Achievement[] = [];
  
  // Sort by date
  const sorted = [...stats].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get totals
  const totalSteps = sorted.reduce((sum, s) => sum + s.steps, 0);
  const totalCalories = sorted.reduce((sum, s) => sum + s.calories, 0);
  const totalActiveMinutes = sorted.reduce((sum, s) => sum + s.activeMinutes, 0);

  // Today's stats
  const today = sorted[0];
  const streak = calculateStreak(stats);

  // Check each achievement
  ACHIEVEMENTS.forEach(achievement => {
    let isUnlocked = false;

    switch (achievement.id) {
      case "first_day":
        isUnlocked = stats.length >= 1;
        break;
      case "streak_3":
        isUnlocked = streak >= 3;
        break;
      case "streak_7":
        isUnlocked = streak >= 7;
        break;
      case "streak_30":
        isUnlocked = streak >= 30;
        break;
      case "steps_5k":
        isUnlocked = today && today.steps >= 5000;
        break;
      case "steps_10k":
        isUnlocked = today && today.steps >= 10000;
        break;
      case "steps_50k":
        isUnlocked = totalSteps >= 50000;
        break;
      case "calories_1000":
        isUnlocked = today && today.calories >= 1000;
        break;
      case "calories_5000":
        isUnlocked = totalCalories >= 5000;
        break;
      case "active_30":
        isUnlocked = today && today.activeMinutes >= 30;
        break;
      case "active_150":
        isUnlocked = totalActiveMinutes >= 150;
        break;
    }

    if (isUnlocked) {
      unlocked.push(achievement);
    }
  });

  return unlocked;
}

/**
 * Get achievement details by ID
 */
export function getAchievementById(id: AchievementType): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

/**
 * Format number with locale
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(actual: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((actual / target) * 100), 100);
}
