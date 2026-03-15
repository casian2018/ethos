export type SleepConfidence = "low" | "medium" | "high";
export type SleepChronotype = "lion" | "bear" | "wolf" | "dolphin";
export type SleepInsightTone = "good" | "warning" | "neutral";

export interface SleepStageBreakdown {
  deepMinutes: number;
  lightMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
}

export interface SleepScreenshotAnalysis {
  dateKey: string;
  asleepTime: string;
  awakeTime: string;
  totalSleepMinutes: number;
  timeInBedMinutes: number;
  efficiency: number;
  sourceApp: string;
  stages: SleepStageBreakdown;
  confidence: SleepConfidence;
  visibleClues: string[];
  notes: string[];
}

export interface StoredSleepRecord extends SleepScreenshotAnalysis {
  id: string;
  userId: string;
  sleepHours: number;
  qualityScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SleepInsight {
  tone: SleepInsightTone;
  title: string;
  description: string;
}

export interface SleepSummary {
  averageSleepHours: number;
  averageEfficiency: number;
  averageDeepMinutes: number;
  averageRemMinutes: number;
  bedtimeConsistencyMinutes: number;
  sleepDebtHours: number;
  streak: number;
  lastNight: StoredSleepRecord | null;
}

interface NormalizeSleepAnalysisInput {
  dateText?: unknown;
  asleepTime?: unknown;
  awakeTime?: unknown;
  totalSleepMinutes?: unknown;
  timeInBedMinutes?: unknown;
  deepSleepMinutes?: unknown;
  lightSleepMinutes?: unknown;
  remSleepMinutes?: unknown;
  awakeMinutes?: unknown;
  efficiency?: unknown;
  sourceApp?: unknown;
  confidence?: unknown;
  visibleClues?: unknown;
  notes?: unknown;
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

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeConfidence(value: unknown): SleepConfidence {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function parseStoredDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return undefined;
}

export function normalizeClockTime(value: unknown): string {
  const raw = safeString(value).replace(/\s/g, "");
  const match = raw.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) {
    return "";
  }

  const hours = clampNumber(Number.parseInt(match[1] || "0", 10), 0, 23);
  const minutes = clampNumber(Number.parseInt(match[2] || "0", 10), 0, 59);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function timeToMinutes(value: string): number | null {
  const normalized = normalizeClockTime(value);
  if (!normalized) {
    return null;
  }

  const [hours, minutes] = normalized.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

export function getSleepDurationMinutes(asleepTime: string, awakeTime: string): number {
  const asleep = timeToMinutes(asleepTime);
  const awake = timeToMinutes(awakeTime);
  if (asleep === null || awake === null) {
    return 0;
  }

  const delta = awake - asleep;
  return delta > 0 ? delta : delta + 24 * 60;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCandidateDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  if (candidate.getMonth() + 1 !== month || candidate.getDate() !== day || candidate.getFullYear() !== year) {
    return null;
  }

  return candidate;
}

export function inferDateKey(dateText: string, now = new Date()): string {
  const raw = safeString(dateText);
  if (!raw) {
    return formatDateKey(now);
  }

  const namedMonths = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  } as const;

  const namedDateMatch = raw.match(/(\d{1,2})\s+([a-zA-Z]{3,9})\s+(\d{4})/);
  if (namedDateMatch) {
    const monthKey = namedDateMatch[2]?.toLowerCase() as keyof typeof namedMonths | undefined;
    const month = monthKey ? namedMonths[monthKey] : undefined;
    if (month) {
      const candidate = buildCandidateDate(
        Number.parseInt(namedDateMatch[3] || "0", 10),
        month,
        Number.parseInt(namedDateMatch[1] || "0", 10)
      );
      if (candidate) {
        return formatDateKey(candidate);
      }
    }
  }

  const isoMatch = raw.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const candidate = buildCandidateDate(
      Number.parseInt(isoMatch[1] || "0", 10),
      Number.parseInt(isoMatch[2] || "0", 10),
      Number.parseInt(isoMatch[3] || "0", 10)
    );
    return candidate ? formatDateKey(candidate) : formatDateKey(now);
  }

  const slashMatch = raw.match(/(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?/);
  if (!slashMatch) {
    return formatDateKey(now);
  }

  const first = Number.parseInt(slashMatch[1] || "0", 10);
  const second = Number.parseInt(slashMatch[2] || "0", 10);
  const yearValue = slashMatch[3]
    ? Number.parseInt(slashMatch[3]!.length === 2 ? `20${slashMatch[3]}` : slashMatch[3], 10)
    : now.getFullYear();

  const candidates = [
    buildCandidateDate(yearValue, first, second),
    buildCandidateDate(yearValue, second, first),
    buildCandidateDate(yearValue - 1, first, second),
    buildCandidateDate(yearValue - 1, second, first),
  ].filter(Boolean) as Date[];

  if (candidates.length === 0) {
    return formatDateKey(now);
  }

  const nowTime = now.getTime();
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      diff: Math.abs(candidate.getTime() - nowTime),
      isFuture: candidate.getTime() > nowTime + 24 * 60 * 60 * 1000,
    }))
    .sort((left, right) => {
      if (left.isFuture !== right.isFuture) {
        return left.isFuture ? 1 : -1;
      }

      return left.diff - right.diff;
    });

  return formatDateKey(ranked[0]!.candidate);
}

export function calculateSleepQualityScore({
  totalSleepMinutes,
  efficiency,
  deepMinutes,
  remMinutes,
  awakeMinutes,
}: {
  totalSleepMinutes: number;
  efficiency: number;
  deepMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
}): number {
  const hours = totalSleepMinutes / 60;
  const durationScore = clampNumber(100 - Math.abs(hours - 7.75) * 18, 45, 100);
  const efficiencyScore = clampNumber(efficiency, 40, 100);
  const deepBonus = clampNumber((deepMinutes / Math.max(totalSleepMinutes, 1)) * 120, 0, 18);
  const remBonus = clampNumber((remMinutes / Math.max(totalSleepMinutes, 1)) * 90, 0, 12);
  const awakePenalty = clampNumber(awakeMinutes / 6, 0, 18);

  return Math.round(
    clampNumber(durationScore * 0.46 + efficiencyScore * 0.42 + deepBonus + remBonus - awakePenalty, 20, 100)
  );
}

export function normalizeSleepScreenshotAnalysis(
  input: NormalizeSleepAnalysisInput,
  options?: {
    now?: Date;
  }
): SleepScreenshotAnalysis {
  const now = options?.now || new Date();
  const asleepTime = normalizeClockTime(input.asleepTime);
  const awakeTime = normalizeClockTime(input.awakeTime);
  const stageDeep = clampNumber(Math.round(safeNumber(input.deepSleepMinutes)), 0, 400);
  const stageLight = clampNumber(Math.round(safeNumber(input.lightSleepMinutes)), 0, 800);
  const stageRem = clampNumber(Math.round(safeNumber(input.remSleepMinutes)), 0, 400);
  const stageAwake = clampNumber(Math.round(safeNumber(input.awakeMinutes)), 0, 240);
  const stagesTotalSleep = stageDeep + stageLight + stageRem;
  const durationFromTimes = getSleepDurationMinutes(asleepTime, awakeTime);
  const rawTotalSleep = Math.round(safeNumber(input.totalSleepMinutes, stagesTotalSleep || durationFromTimes));
  const totalSleepMinutes = clampNumber(
    rawTotalSleep > 0 ? rawTotalSleep : stagesTotalSleep || durationFromTimes,
    1,
    16 * 60
  );
  const rawTimeInBed = Math.round(safeNumber(input.timeInBedMinutes, totalSleepMinutes + stageAwake));
  const timeInBedMinutes = clampNumber(
    rawTimeInBed > 0 ? Math.max(rawTimeInBed, totalSleepMinutes) : totalSleepMinutes + stageAwake,
    totalSleepMinutes,
    18 * 60
  );
  const rawEfficiency = Math.round(safeNumber(input.efficiency, (totalSleepMinutes / Math.max(timeInBedMinutes, 1)) * 100));
  const efficiency = clampNumber(rawEfficiency, 40, 100);

  return {
    dateKey: inferDateKey(safeString(input.dateText), now),
    asleepTime,
    awakeTime,
    totalSleepMinutes,
    timeInBedMinutes,
    efficiency,
    sourceApp: safeString(input.sourceApp) || "Sleep tracker",
    stages: {
      deepMinutes: stageDeep,
      lightMinutes: stageLight,
      remMinutes: stageRem,
      awakeMinutes: stageAwake,
    },
    confidence: normalizeConfidence(input.confidence),
    visibleClues: safeStringArray(input.visibleClues).slice(0, 8),
    notes: safeStringArray(input.notes).slice(0, 6),
  };
}

function parseDurationToMinutes(value: string): number {
  const normalized = safeString(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/hrs?/g, "h")
    .replace(/hours?/g, "h")
    .replace(/mins?/g, "m")
    .replace(/minutes?/g, "m");

  if (!normalized) {
    return 0;
  }

  const hoursMatch = normalized.match(/(\d{1,2})\s*h/);
  const minutesMatch = normalized.match(/(\d{1,2})\s*m/);
  const weirdHourMatch = normalized.match(/(\d{1,2})[:;]\s*(\d{1,2})\s*m/);

  if (weirdHourMatch) {
    const hoursRaw = Number.parseInt(weirdHourMatch[1] || "0", 10);
    const minutesRaw = Number.parseInt(weirdHourMatch[2] || "0", 10);
    const hours = hoursRaw >= 24 ? Math.floor(hoursRaw / 10) : hoursRaw;
    return clampNumber(hours * 60 + minutesRaw, 0, 16 * 60);
  }

  const hours = hoursMatch ? Number.parseInt(hoursMatch[1] || "0", 10) : 0;
  const minutes = minutesMatch ? Number.parseInt(minutesMatch[1] || "0", 10) : 0;

  if (!hours && !minutes) {
    const onlyMinutes = normalized.match(/(\d{1,3})/);
    return onlyMinutes ? clampNumber(Number.parseInt(onlyMinutes[1] || "0", 10), 0, 16 * 60) : 0;
  }

  return clampNumber(hours * 60 + minutes, 0, 16 * 60);
}

function pickBestDateText(text: string): string {
  const namedDateMatch = text.match(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/);
  if (namedDateMatch) {
    return namedDateMatch[0];
  }

  const slashMatches = Array.from(text.matchAll(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g)).map((match) => match[0]);
  if (slashMatches.length > 0) {
    return slashMatches[slashMatches.length - 1] || "";
  }

  return "";
}

function extractLabelDuration(text: string, patterns: string[]): { minutes: number; clue: string } {
  for (const pattern of patterns) {
    const regex = new RegExp(
      `(?:\\d+%\\s*)?(?:${pattern})\\s+((?:\\d{1,2}\\s*[hH](?:r)?\\s*)?\\d{1,3}\\s*(?:m|min)?|\\d{1,2}[:;]\\s*\\d{1,2}\\s*(?:m|min))`,
      "i"
    );
    const match = text.match(regex);
    if (match) {
      return {
        minutes: parseDurationToMinutes(match[1] || ""),
        clue: match[0],
      };
    }
  }

  return { minutes: 0, clue: "" };
}

export function extractSleepAnalysisFromOcrText(
  text: string,
  options?: {
    language?: "ro" | "en";
    now?: Date;
  }
): SleepScreenshotAnalysis | null {
  const normalizedText = safeString(text)
    .replace(/[|[\]{}]/g, " ")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedText) {
    return null;
  }

  const timeRangeMatch = normalizedText.match(/(\d{1,2}[:.]\d{2})\s*-\s*(\d{1,2}[:.]\d{2})/i);
  const asleepTime = normalizeClockTime(timeRangeMatch?.[1] || "");
  const awakeTime = normalizeClockTime(timeRangeMatch?.[2] || "");
  const awake = extractLabelDuration(normalizedText, ["awake"]);
  const rem = extractLabelDuration(normalizedText, ["rem"]);
  const light = extractLabelDuration(normalizedText, ["light", "tight", "core"]);
  const deep = extractLabelDuration(normalizedText, ["deep"]);
  const totalAsleepMatch = normalizedText.match(
    /time asleep\s+((?:\d{1,2}\s*[hH](?:r)?\s*)?\d{1,3}\s*(?:m|min)|\d{1,2}[:;]\s*\d{1,2}\s*(?:m|min))/i
  );

  const totalFromLabel = parseDurationToMinutes(totalAsleepMatch?.[1] || "");
  const totalFromStages = deep.minutes + light.minutes + rem.minutes;
  const totalFromTimes = asleepTime && awakeTime ? getSleepDurationMinutes(asleepTime, awakeTime) : 0;
  const totalSleepMinutes = totalFromLabel || totalFromStages || totalFromTimes;
  const timeInBedMinutes = totalFromTimes || (totalSleepMinutes > 0 ? totalSleepMinutes + awake.minutes : 0);
  const dateText = pickBestDateText(normalizedText);

  const visibleClues = [
    timeRangeMatch?.[0] || "",
    dateText,
    awake.clue,
    rem.clue,
    light.clue,
    deep.clue,
    totalAsleepMatch?.[0] || "",
  ].filter(Boolean);

  if (!dateText && !asleepTime && !awakeTime && totalSleepMinutes <= 0) {
    return null;
  }

  const sourceApp =
    /show more sleep data|time asleep|summary/i.test(normalizedText)
      ? "Apple Health"
      : /blood oxygen|sleep stages/i.test(normalizedText)
        ? "Samsung Health"
        : "Sleep tracker";

  const notes: string[] = [];
  if (!asleepTime || !awakeTime) {
    notes.push("Bedtime or wake time was not clearly visible in the screenshot.");
  }
  if (!dateText) {
    notes.push("The screenshot date was not clearly visible.");
  }

  const confidence: SleepConfidence =
    asleepTime && awakeTime && totalSleepMinutes > 0 ? "high" : totalSleepMinutes > 0 ? "medium" : "low";

  return normalizeSleepScreenshotAnalysis(
    {
      dateText,
      asleepTime,
      awakeTime,
      totalSleepMinutes,
      timeInBedMinutes,
      deepSleepMinutes: deep.minutes,
      lightSleepMinutes: light.minutes,
      remSleepMinutes: rem.minutes,
      awakeMinutes: awake.minutes,
      efficiency:
        totalSleepMinutes > 0 && timeInBedMinutes > 0
          ? Math.round((totalSleepMinutes / Math.max(timeInBedMinutes, 1)) * 100)
          : 0,
      sourceApp,
      confidence,
      visibleClues,
      notes,
    },
    {
      now: options?.now,
    }
  );
}

export function normalizeStoredSleepRecord(id: string, data: Record<string, unknown>): StoredSleepRecord {
  const legacyDetailedData = (data.detailedData as Record<string, unknown> | undefined) || {};
  const analysis = normalizeSleepScreenshotAnalysis(
    {
      dateText: data.date,
      asleepTime: data.asleepTime ?? legacyDetailedData.asleepTime,
      awakeTime: data.awakeTime ?? legacyDetailedData.awakeTime,
      totalSleepMinutes:
        data.totalSleepMinutes ??
        (typeof data.sleepHours === "number" ? Math.round((data.sleepHours as number) * 60) : undefined),
      timeInBedMinutes: data.timeInBedMinutes,
      deepSleepMinutes: data.deepSleepMinutes ?? legacyDetailedData.deepSleep,
      lightSleepMinutes: data.lightSleepMinutes ?? legacyDetailedData.lightSleep,
      remSleepMinutes: data.remSleepMinutes ?? legacyDetailedData.remSleep,
      awakeMinutes: data.awakeMinutes ?? legacyDetailedData.awakeDuration,
      efficiency: data.efficiency ?? legacyDetailedData.efficiency,
      sourceApp: data.sourceApp,
      confidence: data.confidence,
      visibleClues: data.visibleClues,
      notes: data.notes,
    },
    {
      now: parseStoredDate(data.createdAt) || parseStoredDate(data.updatedAt) || new Date(),
    }
  );

  const sleepHours =
    typeof data.sleepHours === "number"
      ? Math.round((data.sleepHours as number) * 10) / 10
      : Math.round((analysis.totalSleepMinutes / 60) * 10) / 10;

  return {
    id,
    userId: safeString(data.userId),
    sleepHours,
    qualityScore:
      Math.round(safeNumber(data.qualityScore)) ||
      calculateSleepQualityScore({
        totalSleepMinutes: analysis.totalSleepMinutes,
        efficiency: analysis.efficiency,
        deepMinutes: analysis.stages.deepMinutes,
        remMinutes: analysis.stages.remMinutes,
        awakeMinutes: analysis.stages.awakeMinutes,
      }),
    createdAt: parseStoredDate(data.createdAt),
    updatedAt: parseStoredDate(data.updatedAt),
    ...analysis,
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getBedtimeReferenceMinutes(time: string): number {
  const value = timeToMinutes(time) ?? 23 * 60;
  return value < 12 * 60 ? value + 24 * 60 : value;
}

export function calculateSleepChronotype(records: StoredSleepRecord[]): SleepChronotype {
  if (records.length < 3) {
    return "bear";
  }

  const recent = records.slice(0, 10);
  const averageEfficiency = average(recent.map((record) => record.efficiency));
  const bedtimes = recent.map((record) => getBedtimeReferenceMinutes(record.asleepTime));
  const wakeTimes = recent.map((record) => (timeToMinutes(record.awakeTime) ?? 7 * 60));
  const averageBedtime = average(bedtimes);
  const averageWake = average(wakeTimes);
  const bedtimeSpread = average(bedtimes.map((value) => Math.abs(value - averageBedtime)));

  if (bedtimeSpread > 75 || averageEfficiency < 82) {
    return "dolphin";
  }

  if (averageBedtime >= 24 * 60 || averageWake >= 8 * 60) {
    return "wolf";
  }

  if (averageBedtime <= 22 * 60 && averageWake <= 6 * 60 + 30) {
    return "lion";
  }

  return "bear";
}

export function summarizeSleep(records: StoredSleepRecord[]): SleepSummary {
  const sorted = [...records].sort((left, right) => right.dateKey.localeCompare(left.dateKey));
  const recent = sorted.slice(0, 14);
  const sleepHours = recent.map((record) => record.sleepHours);
  const efficiencies = recent.map((record) => record.efficiency);
  const deepMinutes = recent.map((record) => record.stages.deepMinutes);
  const remMinutes = recent.map((record) => record.stages.remMinutes);
  const bedtimes = recent.map((record) => getBedtimeReferenceMinutes(record.asleepTime));
  const averageBedtime = average(bedtimes);
  const bedtimeConsistencyMinutes = Math.round(
    average(bedtimes.map((value) => Math.abs(value - averageBedtime)))
  );

  let streak = 0;
  const today = new Date();
  const orderedForStreak = [...sorted].sort((left, right) => right.dateKey.localeCompare(left.dateKey));

  for (let index = 0; index < orderedForStreak.length; index += 1) {
    const record = orderedForStreak[index]!;
    const recordDate = new Date(`${record.dateKey}T00:00:00`);
    const diffDays = Math.round((today.getTime() - recordDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays > index + 1) {
      break;
    }
    if (record.sleepHours >= 7) {
      streak += 1;
    } else {
      break;
    }
  }

  const sleepDebtHours = Math.max(recent.length * 7.5 - sleepHours.reduce((sum, value) => sum + value, 0), 0);

  return {
    averageSleepHours: Math.round(average(sleepHours) * 10) / 10,
    averageEfficiency: Math.round(average(efficiencies)),
    averageDeepMinutes: Math.round(average(deepMinutes)),
    averageRemMinutes: Math.round(average(remMinutes)),
    bedtimeConsistencyMinutes,
    sleepDebtHours: Math.round(sleepDebtHours * 10) / 10,
    streak,
    lastNight: sorted[0] || null,
  };
}

export function buildSleepInsights({
  records,
  medicalConditions,
  language,
}: {
  records: StoredSleepRecord[];
  medicalConditions?: string[];
  language: "ro" | "en";
}): SleepInsight[] {
  if (records.length === 0) {
    return [];
  }

  const summary = summarizeSleep(records);
  const insights: SleepInsight[] = [];
  const recent = records.slice(0, 7);
  const averageAwakeMinutes = Math.round(average(recent.map((record) => record.stages.awakeMinutes)));
  const averageBedtime = average(recent.map((record) => getBedtimeReferenceMinutes(record.asleepTime)));

  if (summary.averageSleepHours < 6.7) {
    insights.push({
      tone: "warning",
      title: language === "ro" ? "Ai acumulat datorie de somn" : "You have built sleep debt",
      description:
        language === "ro"
          ? `Ultimele nopți sunt la ${summary.averageSleepHours}h în medie, cu aproximativ ${summary.sleepDebtHours}h sub ținta de recovery. Mută ora de culcare cu 30-45 de minute mai devreme pentru 5-7 zile.`
          : `Your recent nights average ${summary.averageSleepHours}h, about ${summary.sleepDebtHours}h below a recovery target. Move bedtime 30-45 minutes earlier for the next 5-7 days.`,
    });
  } else {
    insights.push({
      tone: "good",
      title: language === "ro" ? "Durata somnului este într-o zonă bună" : "Sleep duration is in a good range",
      description:
        language === "ro"
          ? `Media recentă este ${summary.averageSleepHours}h și susține mai bine energia zilnică. Păstrează această fereastră de somn cât mai constantă.`
          : `Your recent average is ${summary.averageSleepHours}h and supports daily energy better. Keep this sleep window as consistent as possible.`,
    });
  }

  if (summary.bedtimeConsistencyMinutes > 50) {
    insights.push({
      tone: "warning",
      title: language === "ro" ? "Programul de culcare variază prea mult" : "Your bedtime is too inconsistent",
      description:
        language === "ro"
          ? `Ora de culcare fluctuează cu aproximativ ${summary.bedtimeConsistencyMinutes} minute. O diferență sub 30 de minute te ajută să adormi mai ușor și să stabilizezi energia.`
          : `Your bedtime shifts by about ${summary.bedtimeConsistencyMinutes} minutes. Keeping it under a 30-minute swing helps sleep onset and steadier energy.`,
    });
  } else {
    insights.push({
      tone: "good",
      title: language === "ro" ? "Ritmul tău este destul de stabil" : "Your rhythm is fairly stable",
      description:
        language === "ro"
          ? `Variabilitatea orei de culcare este de aproximativ ${summary.bedtimeConsistencyMinutes} minute, ceea ce este bun pentru ritmul circadian.`
          : `Your bedtime variability is about ${summary.bedtimeConsistencyMinutes} minutes, which is solid for circadian stability.`,
    });
  }

  if (summary.averageEfficiency < 85 || averageAwakeMinutes > 35) {
    insights.push({
      tone: "neutral",
      title: language === "ro" ? "Somnul pare fragmentat" : "Your sleep looks fragmented",
      description:
        language === "ro"
          ? `Eficiența medie este ${summary.averageEfficiency}% și ai cam ${averageAwakeMinutes} minute treaz pe noapte. Redu ecranele târzii, păstrează camera mai rece și evită mesele grele foarte târziu.`
          : `Average efficiency is ${summary.averageEfficiency}% and you spend around ${averageAwakeMinutes} minutes awake each night. Reduce late screens, keep the room cooler, and avoid heavy late meals.`,
    });
  }

  if (summary.averageDeepMinutes < 55) {
    insights.push({
      tone: "neutral",
      title: language === "ro" ? "Deep sleep-ul este jos" : "Deep sleep is on the low side",
      description:
        language === "ro"
          ? `Deep sleep-ul mediu este ${summary.averageDeepMinutes} minute. Antrenamentul intens prea târziu, alcoolul și temperatura ridicată a camerei sunt trei factori frecvenți care îl taie.`
          : `Average deep sleep is ${summary.averageDeepMinutes} minutes. Late hard training, alcohol, and a warm room are three common reasons it drops.`,
    });
  }

  if (averageBedtime >= 24 * 60 + 15) {
    insights.push({
      tone: "neutral",
      title: language === "ro" ? "Ora de culcare este foarte târzie" : "Your bedtime is very late",
      description:
        language === "ro"
          ? "Când culcarea trece constant de miezul nopții, recuperarea și foamea din ziua următoare tind să fie mai slabe. Începe rutina de seară cu 45 de minute mai devreme."
          : "When bedtime consistently moves past midnight, recovery and next-day appetite control usually get worse. Start your evening routine 45 minutes earlier.",
    });
  }

  const lowerConditions = (medicalConditions || []).map((condition) => condition.toLowerCase());
  if (lowerConditions.some((condition) => condition.includes("anxiety") || condition.includes("stress"))) {
    insights.push({
      tone: "neutral",
      title: language === "ro" ? "Stresul poate prelungi adormirea" : "Stress may be delaying sleep onset",
      description:
        language === "ro"
          ? "Dacă simți mintea activă seara, testează 10 minute de jurnal, lumină mai caldă și respirație lentă înainte de pat."
          : "If your mind stays active at night, test 10 minutes of journaling, warmer light, and slow breathing before bed.",
    });
  }

  return insights.slice(0, 4);
}

export function getSleepChronotypeMeta(chronotype: SleepChronotype, language: "ro" | "en") {
  const content = {
    lion: {
      title: language === "ro" ? "Lion" : "Lion",
      label: language === "ro" ? "matinal și direct" : "early and sharp",
      description:
        language === "ro"
          ? "Adormi mai devreme și funcționezi cel mai bine dimineața. Programul fix îți păstrează energia sus."
          : "You fall asleep earlier and perform best in the morning. A fixed schedule keeps your energy high.",
    },
    bear: {
      title: language === "ro" ? "Bear" : "Bear",
      label: language === "ro" ? "ritm echilibrat" : "balanced rhythm",
      description:
        language === "ro"
          ? "Răspunzi bine la un program apropiat de lumina naturală. Consistența este avantajul tău major."
          : "You respond well to a schedule close to natural light. Consistency is your main advantage.",
    },
    wolf: {
      title: language === "ro" ? "Wolf" : "Wolf",
      label: language === "ro" ? "seară puternică" : "strong in the evening",
      description:
        language === "ro"
          ? "Tinzi să adormi mai târziu și să ai energie mai bună spre seară. Ai nevoie de mai multă disciplină în rutina de noapte."
          : "You tend to fall asleep later and feel stronger in the evening. You need tighter discipline in the night routine.",
    },
    dolphin: {
      title: language === "ro" ? "Dolphin" : "Dolphin",
      label: language === "ro" ? "somn ușor și variabil" : "light and variable sleep",
      description:
        language === "ro"
          ? "Programul și eficiența par mai instabile. Contează mai mult igiena de somn și reducerea stimulării seara."
          : "Your schedule and efficiency look more unstable. Sleep hygiene and lower evening stimulation matter more here.",
    },
  } as const;

  return content[chronotype];
}
