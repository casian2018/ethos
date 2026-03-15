import test from "node:test";
import assert from "node:assert/strict";
import {
  extractHealthStatsFromOcrText,
  mergeExtractedHealthStats,
} from "../lib/healthStats";

test("extractHealthStatsFromOcrText reads grouped step values from OCR text", () => {
  const result = extractHealthStatsFromOcrText(`
    Samsung Health
    Steps
    16,608
    Calories 524
  `);

  assert.equal(result.steps, 16608);
  assert.equal(result.stepConfidence, "near_label");
  assert.equal(result.source, "Samsung Health");
});

test("mergeExtractedHealthStats keeps a higher labeled OCR step count over a lower AI guess", () => {
  const ocrStats = extractHealthStatsFromOcrText(`
    Steps 16 608
    Samsung Health
  `);

  const merged = mergeExtractedHealthStats(
    {
      steps: 6326,
      calories: 410,
      distanceKm: 4.2,
      activeMinutes: 58,
      source: "Samsung Health",
    },
    ocrStats
  );

  assert.equal(merged.steps, 16608);
  assert.equal(merged.calories, 410);
});
