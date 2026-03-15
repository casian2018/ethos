import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSleepInsights,
  calculateSleepChronotype,
  extractSleepAnalysisFromOcrText,
  normalizeSleepScreenshotAnalysis,
  normalizeStoredSleepRecord,
  summarizeSleep,
} from "../lib/sleep";

test("normalizeSleepScreenshotAnalysis keeps visible sleep values and infers date", () => {
  const analysis = normalizeSleepScreenshotAnalysis(
    {
      dateText: "3/14",
      asleepTime: "05:21",
      awakeTime: "09:41",
      deepSleepMinutes: 0,
      lightSleepMinutes: 192,
      remSleepMinutes: 27,
      awakeMinutes: 41,
      totalSleepMinutes: 260,
      timeInBedMinutes: 301,
      efficiency: 86,
      sourceApp: "Samsung Health",
      confidence: "high",
      visibleClues: ["05:21 - 09:41", "Awake 41 m", "Light 3 h 12 m"],
    },
    {
      now: new Date("2026-03-15T12:00:00Z"),
    }
  );

  assert.equal(analysis.dateKey, "2026-03-14");
  assert.equal(analysis.asleepTime, "05:21");
  assert.equal(analysis.awakeTime, "09:41");
  assert.equal(analysis.totalSleepMinutes, 260);
  assert.equal(analysis.timeInBedMinutes, 301);
  assert.equal(analysis.efficiency, 86);
  assert.equal(analysis.stages.lightMinutes, 192);
});

test("extractSleepAnalysisFromOcrText parses samsung sleep screenshot OCR text", () => {
  const analysis = extractSleepAnalysisFromOcrText(
    `
22:39
Sleep
3/14
05:21- 09:41
Sleep stages
05:21 06:48 08:15 09:41
Awake 41m
REM 27 m
Light 3h 12m
0% Deep 0m
Blood oxygen
    `,
    {
      now: new Date("2026-03-15T12:00:00Z"),
      language: "en",
    }
  );

  assert.ok(analysis);
  assert.equal(analysis?.dateKey, "2026-03-14");
  assert.equal(analysis?.asleepTime, "05:21");
  assert.equal(analysis?.awakeTime, "09:41");
  assert.equal(analysis?.totalSleepMinutes, 219);
  assert.equal(analysis?.timeInBedMinutes, 260);
  assert.equal(analysis?.stages.awakeMinutes, 41);
  assert.equal(analysis?.stages.remMinutes, 27);
  assert.equal(analysis?.stages.lightMinutes, 192);
  assert.equal(analysis?.confidence, "high");
});

test("normalizeStoredSleepRecord restores legacy sleep records", () => {
  const record = normalizeStoredSleepRecord("sleep-1", {
    userId: "user-1",
    date: "14/03/2026",
    sleepHours: 7.2,
    detailedData: {
      asleepTime: "23:10",
      awakeTime: "06:22",
      deepSleep: 68,
      lightSleep: 270,
      remSleep: 94,
      awakeDuration: 22,
      efficiency: 89,
    },
    createdAt: "2026-03-14T08:00:00.000Z",
  });

  assert.equal(record.dateKey, "2026-03-14");
  assert.equal(record.sleepHours, 7.2);
  assert.equal(record.stages.deepMinutes, 68);
  assert.equal(record.efficiency, 89);
  assert.ok(record.qualityScore > 0);
});

test("summarizeSleep, chronotype and insights use historical sleep patterns", () => {
  const records = [
    normalizeStoredSleepRecord("1", {
      userId: "user-1",
      date: "2026-03-15",
      asleepTime: "00:55",
      awakeTime: "06:35",
      totalSleepMinutes: 340,
      timeInBedMinutes: 390,
      deepSleepMinutes: 38,
      lightSleepMinutes: 236,
      remSleepMinutes: 66,
      awakeMinutes: 50,
      efficiency: 87,
    }),
    normalizeStoredSleepRecord("2", {
      userId: "user-1",
      date: "2026-03-14",
      asleepTime: "01:10",
      awakeTime: "06:48",
      totalSleepMinutes: 338,
      timeInBedMinutes: 392,
      deepSleepMinutes: 42,
      lightSleepMinutes: 226,
      remSleepMinutes: 70,
      awakeMinutes: 54,
      efficiency: 86,
    }),
    normalizeStoredSleepRecord("3", {
      userId: "user-1",
      date: "2026-03-13",
      asleepTime: "00:40",
      awakeTime: "06:20",
      totalSleepMinutes: 340,
      timeInBedMinutes: 385,
      deepSleepMinutes: 44,
      lightSleepMinutes: 228,
      remSleepMinutes: 68,
      awakeMinutes: 45,
      efficiency: 88,
    }),
  ];

  const summary = summarizeSleep(records);
  const chronotype = calculateSleepChronotype(records);
  const insights = buildSleepInsights({
    records,
    medicalConditions: ["stress"],
    language: "en",
  });

  assert.equal(summary.averageSleepHours, 5.7);
  assert.equal(chronotype, "wolf");
  assert.ok(insights.some((insight) => /sleep debt/i.test(insight.title)));
  assert.ok(insights.some((insight) => /late/i.test(insight.description) || /midnight/i.test(insight.description)));
});
