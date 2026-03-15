export type StepConfidence = "none" | "same_line" | "near_label" | "fallback";

export interface HealthStatsPayload {
  steps: number;
  calories: number;
  distanceKm: number;
  activeMinutes: number;
  source: string;
}

export interface OcrHealthStats extends HealthStatsPayload {
  stepConfidence: StepConfidence;
  clues: string[];
}

const STEP_LABELS = ["steps?", "step\\s*count", "pași", "pasi"];
const CALORIE_LABELS = ["calories?", "calorii", "kcal"];
const ACTIVE_MINUTE_LABELS = ["active\\s*(?:minutes?|mins?)", "minute\\s*active", "min(?:ute)?\\s*active"];
const DISTANCE_LABELS = ["distance", "km", "kilometers?", "kilometri"];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseLooseInteger(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return 0;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseLooseDecimal(value: string): number {
  const compact = value.replace(/\s+/g, "").replace(/'/g, "");
  if (!compact) {
    return 0;
  }

  let normalized = compact;
  const commaCount = (compact.match(/,/g) || []).length;
  const dotCount = (compact.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    normalized = compact.replace(/,/g, "");
  } else if (commaCount > 0) {
    const lastCommaIndex = compact.lastIndexOf(",");
    const decimals = compact.length - lastCommaIndex - 1;
    normalized = decimals === 1 || decimals === 2 ? compact.replace(",", ".") : compact.replace(/,/g, "");
  } else if (dotCount > 1) {
    normalized = compact.replace(/\./g, "");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[|]/g, "1")
    .replace(/[Oo](?=\d)/g, "0")
    .replace(/\r/g, "");
}

function toLines(text: string): string[] {
  return normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildLabelPattern(labels: string[]) {
  return `(?:${labels.join("|")})`;
}

function findIntegerMetricNearLabels(
  lines: string[],
  labels: string[],
  min: number,
  max: number
): { value: number; confidence: StepConfidence; clue?: string } {
  const labelPattern = buildLabelPattern(labels);
  const sameLineMatchers = [
    new RegExp(`(?:^|\\b)${labelPattern}(?:\\b|\\s|[:\\-])[^\\d]{0,12}([\\d][\\d\\s,.']{0,14})`, "i"),
    new RegExp(`([\\d][\\d\\s,.']{0,14})(?:\\s|\\b){0,4}${labelPattern}(?:\\b|$)`, "i"),
  ];

  for (const line of lines) {
    for (const matcher of sameLineMatchers) {
      const match = line.match(matcher);
      const value = parseLooseInteger(match?.[1] || "");
      if (value >= min && value <= max) {
        return { value, confidence: "same_line", clue: line };
      }
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] || "";
    if (!new RegExp(labelPattern, "i").test(line)) {
      continue;
    }

    const nearbyLines = [lines[index - 1], lines[index + 1]].filter(Boolean) as string[];
    for (const nearbyLine of nearbyLines) {
      const value = parseLooseInteger(nearbyLine);
      if (value >= min && value <= max) {
        return { value, confidence: "near_label", clue: `${line} | ${nearbyLine}` };
      }
    }
  }

  return { value: 0, confidence: "none" };
}

function findDecimalMetricNearLabels(lines: string[], labels: string[], min: number, max: number): number {
  const labelPattern = buildLabelPattern(labels);
  const sameLineMatchers = [
    new RegExp(`(?:^|\\b)${labelPattern}(?:\\b|\\s|[:\\-])[^\\d]{0,12}([\\d][\\d\\s,.']{0,14})`, "i"),
    new RegExp(`([\\d][\\d\\s,.']{0,14})(?:\\s|\\b){0,4}${labelPattern}(?:\\b|$)`, "i"),
  ];

  for (const line of lines) {
    for (const matcher of sameLineMatchers) {
      const match = line.match(matcher);
      const value = parseLooseDecimal(match?.[1] || "");
      if (value >= min && value <= max) {
        return value;
      }
    }
  }

  return 0;
}

function detectSource(text: string): string {
  const normalized = text.toLowerCase();

  if (normalized.includes("apple health") || normalized.includes("health app")) {
    return "Apple Health";
  }

  if (normalized.includes("samsung health")) {
    return "Samsung Health";
  }

  if (normalized.includes("garmin")) {
    return "Garmin";
  }

  if (normalized.includes("fitbit")) {
    return "Fitbit";
  }

  return "Other";
}

export function extractHealthStatsFromOcrText(text: string): OcrHealthStats {
  const lines = toLines(text);
  const stepMatch = findIntegerMetricNearLabels(lines, STEP_LABELS, 100, 200000);

  let steps = stepMatch.value;
  if (!steps) {
    const fallbackSteps = lines
      .flatMap((line) => line.match(/\d[\d\s,.']{2,14}/g) || [])
      .map((candidate) => parseLooseInteger(candidate))
      .filter((candidate) => candidate >= 1000 && candidate <= 200000)
      .sort((left, right) => right - left)[0] || 0;

    if (fallbackSteps > 0) {
      steps = fallbackSteps;
    }
  }

  const calories = findIntegerMetricNearLabels(lines, CALORIE_LABELS, 0, 20000).value;
  const activeMinutes = findIntegerMetricNearLabels(lines, ACTIVE_MINUTE_LABELS, 0, 1440).value;
  const distanceKm = findDecimalMetricNearLabels(lines, DISTANCE_LABELS, 0, 500);
  const clues = stepMatch.clue ? [stepMatch.clue] : [];

  return {
    steps,
    calories,
    distanceKm,
    activeMinutes,
    source: detectSource(text),
    stepConfidence: stepMatch.confidence === "none" && steps > 0 ? "fallback" : stepMatch.confidence,
    clues,
  };
}

function coerceNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function normalizeExtractedHealthStats(
  input: Partial<HealthStatsPayload> | Record<string, unknown>,
  fallback: Partial<HealthStatsPayload> = {}
): HealthStatsPayload {
  const steps = clamp(Math.round(coerceNumber(input.steps, fallback.steps || 0)), 0, 200000);
  const calories = clamp(Math.round(coerceNumber(input.calories, fallback.calories || 0)), 0, 20000);
  const distanceKm = clamp(Number(coerceNumber(input.distanceKm, fallback.distanceKm || 0).toFixed(2)), 0, 500);
  const activeMinutes = clamp(Math.round(coerceNumber(input.activeMinutes, fallback.activeMinutes || 0)), 0, 1440);
  const source =
    typeof input.source === "string" && input.source.trim()
      ? input.source.trim()
      : fallback.source || "Other";

  return {
    steps,
    calories,
    distanceKm,
    activeMinutes,
    source,
  };
}

export function shouldPreferOcrSteps(ocrSteps: number, currentSteps: number, confidence: StepConfidence): boolean {
  if (ocrSteps <= 0) {
    return false;
  }

  if (currentSteps <= 0) {
    return true;
  }

  if ((confidence === "same_line" || confidence === "near_label") && ocrSteps >= currentSteps + 1000) {
    return true;
  }

  return false;
}

export function mergeExtractedHealthStats(
  input: Partial<HealthStatsPayload> | Record<string, unknown>,
  ocrStats: OcrHealthStats
): HealthStatsPayload {
  const normalized = normalizeExtractedHealthStats(input, ocrStats);

  if (shouldPreferOcrSteps(ocrStats.steps, normalized.steps, ocrStats.stepConfidence)) {
    normalized.steps = ocrStats.steps;
  }

  return normalized;
}

export function hasAnyHealthStats(stats: Partial<HealthStatsPayload> | null | undefined): boolean {
  return Boolean(
    stats &&
      ((stats.steps || 0) > 0 ||
        (stats.calories || 0) > 0 ||
        (stats.distanceKm || 0) > 0 ||
        (stats.activeMinutes || 0) > 0)
  );
}
