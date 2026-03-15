import test from "node:test";
import assert from "node:assert/strict";
import { calculateStreak, checkAchievements } from "../lib/healthUtils";

function getDateKey(offsetDays = 0): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

test("calculateStreak counts yesterday-led streaks when today has no entry", () => {
  const stats = [
    { date: getDateKey(-1), steps: 8400, activeMinutes: 32 },
    { date: getDateKey(-2), steps: 6900, activeMinutes: 28 },
    { date: getDateKey(-3), steps: 5100, activeMinutes: 18 },
  ];

  assert.equal(calculateStreak(stats), 3);
});

test("calculateStreak returns zero when neither today nor yesterday are active", () => {
  const stats = [
    { date: getDateKey(-2), steps: 8400, activeMinutes: 32 },
    { date: getDateKey(-3), steps: 6900, activeMinutes: 28 },
  ];

  assert.equal(calculateStreak(stats), 0);
});

test("checkAchievements uses best day and rolling weekly totals", () => {
  const stats = [
    { date: getDateKey(-7), steps: 12000, calories: 1200, activeMinutes: 40 },
    { date: getDateKey(-6), steps: 8200, calories: 780, activeMinutes: 25 },
    { date: getDateKey(-5), steps: 8300, calories: 790, activeMinutes: 20 },
    { date: getDateKey(-4), steps: 8100, calories: 760, activeMinutes: 22 },
    { date: getDateKey(-3), steps: 8400, calories: 810, activeMinutes: 28 },
    { date: getDateKey(-2), steps: 8500, calories: 820, activeMinutes: 30 },
    { date: getDateKey(-1), steps: 8600, calories: 830, activeMinutes: 32 },
  ];

  const unlockedIds = checkAchievements(stats).map((achievement) => achievement.id);

  assert.ok(unlockedIds.includes("steps_10k"));
  assert.ok(unlockedIds.includes("calories_1000"));
  assert.ok(unlockedIds.includes("active_30"));
  assert.ok(unlockedIds.includes("steps_50k"));
  assert.ok(unlockedIds.includes("calories_5000"));
  assert.ok(unlockedIds.includes("active_150"));
});
