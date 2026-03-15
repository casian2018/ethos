"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  MoonStar,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
  buildSleepInsights,
  calculateSleepQualityScore,
  normalizeStoredSleepRecord,
  type SleepInsight,
  type SleepScreenshotAnalysis,
  type StoredSleepRecord,
  summarizeSleep,
} from "@/lib/sleep";
import type { DetailedUserProfile } from "@/lib/profile";

const auth = firebaseAuth!;
const db = firebaseDb!;

type StatusMessage = {
  type: "error" | "success" | "info";
  text: string;
};

function StatusBanner({ message }: { message: StatusMessage | null }) {
  if (!message) {
    return null;
  }

  const styles =
    message.type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : message.type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  const Icon = message.type === "error" ? ShieldAlert : message.type === "success" ? CheckCircle2 : Sparkles;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message.text}</p>
    </div>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDateLabel(dateKey: string, language: "ro" | "en"): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(language === "ro" ? "ro-RO" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMinutesAsDuration(minutes: number, language: "ro" | "en"): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours <= 0) {
    return `${remaining}m`;
  }

  return language === "ro" ? `${hours}h ${remaining}m` : `${hours}h ${remaining}m`;
}

function formatSleepHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

function getConfidenceLabel(confidence: SleepScreenshotAnalysis["confidence"], language: "ro" | "en"): string {
  if (confidence === "high") {
    return language === "ro" ? "încredere mare" : "high confidence";
  }

  if (confidence === "low") {
    return language === "ro" ? "încredere redusă" : "low confidence";
  }

  return language === "ro" ? "încredere medie" : "medium confidence";
}

function getInsightStyles(tone: SleepInsight["tone"]) {
  if (tone === "good") {
    return "border-emerald-200 bg-emerald-50/60";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50/70";
  }

  return "border-sky-200 bg-sky-50/60";
}

function getQualityStyles(score: number) {
  if (score >= 82) {
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  }

  if (score >= 68) {
    return "text-amber-600 bg-amber-50 border-amber-200";
  }

  return "text-rose-600 bg-rose-50 border-rose-200";
}

export default function SleepAnalysisPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DetailedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sleepRecords, setSleepRecords] = useState<StoredSleepRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SleepScreenshotAnalysis | null>(null);
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }

      setUser(currentUser);

      try {
        const [profileDoc, subcollectionSnapshot, legacySnakeSnapshot, legacyCamelSnapshot] = await Promise.all([
          getDoc(doc(db, "users", currentUser.uid)),
          getDocs(collection(db, "users", currentUser.uid, "sleep_records")),
          getDocs(query(collection(db, "sleep_records"), where("userId", "==", currentUser.uid))),
          getDocs(query(collection(db, "sleepRecords"), where("userId", "==", currentUser.uid))),
        ]);

        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as DetailedUserProfile);
        }

        const records = [
          ...subcollectionSnapshot.docs.map((recordDoc) =>
            normalizeStoredSleepRecord(recordDoc.id, recordDoc.data() as Record<string, unknown>)
          ),
          ...legacySnakeSnapshot.docs.map((recordDoc) =>
            normalizeStoredSleepRecord(recordDoc.id, recordDoc.data() as Record<string, unknown>)
          ),
          ...legacyCamelSnapshot.docs.map((recordDoc) =>
            normalizeStoredSleepRecord(recordDoc.id, recordDoc.data() as Record<string, unknown>)
          ),
        ];

        const uniqueRecords = new Map<string, StoredSleepRecord>();
        for (const record of records) {
          const key = `${record.dateKey}-${record.asleepTime}-${record.awakeTime}`;
          const current = uniqueRecords.get(key);
          if (!current || (record.updatedAt?.getTime() || 0) >= (current.updatedAt?.getTime() || 0)) {
            uniqueRecords.set(key, record);
          }
        }

        setSleepRecords(
          Array.from(uniqueRecords.values()).sort((left, right) => right.dateKey.localeCompare(left.dateKey))
        );
      } catch (error) {
        console.error("Error loading sleep data:", error);
        setMessage({
          type: "error",
          text:
            language === "ro"
              ? "Nu am putut încărca istoricul de somn."
              : "Could not load your sleep history.",
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [language, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: language === "ro" ? "Selectează o imagine validă." : "Select a valid image.",
      });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setMessage({
        type: "error",
        text:
          language === "ro"
            ? "Imaginea trebuie să aibă sub 8MB."
            : "The image must be smaller than 8MB.",
      });
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setMessage(null);
  };

  const analyzeSleepScreenshot = async () => {
    if (!selectedFile) {
      return;
    }

    setIsAnalyzing(true);
    setMessage(null);

    try {
      const imageBase64 = await readFileAsBase64(selectedFile);
      const response = await fetch("/api/sleep/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          imageMimeType: selectedFile.type,
          language,
        }),
      });

      const payload = (await response.json()) as {
        analysis?: SleepScreenshotAnalysis;
        error?: string;
      };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error || "Failed to analyze sleep screenshot.");
      }

      setAnalysis(payload.analysis);
      setMessage({
        type: "success",
        text:
          language === "ro"
            ? "Screenshot-ul a fost analizat. Verifică datele înainte de salvare."
            : "The screenshot was analyzed. Review the data before saving.",
      });
    } catch (error) {
      console.error("Error analyzing sleep screenshot:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error && error.message
            ? error.message
            : language === "ro"
              ? "Nu am putut interpreta screenshot-ul de somn."
              : "Could not interpret the sleep screenshot.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveSleepRecord = async () => {
    if (!user || !analysis) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const recordRef = doc(db, "users", user.uid, "sleep_records", analysis.dateKey);
      const existingRecord = await getDoc(recordRef);
      const existingCreatedAt = existingRecord.exists() ? existingRecord.data().createdAt : null;
      const qualityScore = calculateSleepQualityScore({
        totalSleepMinutes: analysis.totalSleepMinutes,
        efficiency: analysis.efficiency,
        deepMinutes: analysis.stages.deepMinutes,
        remMinutes: analysis.stages.remMinutes,
        awakeMinutes: analysis.stages.awakeMinutes,
      });

      await setDoc(
        recordRef,
        {
          userId: user.uid,
          date: analysis.dateKey,
          asleepTime: analysis.asleepTime,
          awakeTime: analysis.awakeTime,
          totalSleepMinutes: analysis.totalSleepMinutes,
          timeInBedMinutes: analysis.timeInBedMinutes,
          deepSleepMinutes: analysis.stages.deepMinutes,
          lightSleepMinutes: analysis.stages.lightMinutes,
          remSleepMinutes: analysis.stages.remMinutes,
          awakeMinutes: analysis.stages.awakeMinutes,
          efficiency: analysis.efficiency,
          qualityScore,
          sleepHours: Math.round((analysis.totalSleepMinutes / 60) * 10) / 10,
          sourceApp: analysis.sourceApp,
          confidence: analysis.confidence,
          visibleClues: analysis.visibleClues,
          notes: analysis.notes,
          createdAt: existingCreatedAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const savedRecord = normalizeStoredSleepRecord(analysis.dateKey, {
        userId: user.uid,
        date: analysis.dateKey,
        asleepTime: analysis.asleepTime,
        awakeTime: analysis.awakeTime,
        totalSleepMinutes: analysis.totalSleepMinutes,
        timeInBedMinutes: analysis.timeInBedMinutes,
        deepSleepMinutes: analysis.stages.deepMinutes,
        lightSleepMinutes: analysis.stages.lightMinutes,
        remSleepMinutes: analysis.stages.remMinutes,
        awakeMinutes: analysis.stages.awakeMinutes,
        efficiency: analysis.efficiency,
        qualityScore,
        sleepHours: Math.round((analysis.totalSleepMinutes / 60) * 10) / 10,
        sourceApp: analysis.sourceApp,
        confidence: analysis.confidence,
        visibleClues: analysis.visibleClues,
        notes: analysis.notes,
        updatedAt: new Date().toISOString(),
      });

      setSleepRecords((current) => {
        const next = [savedRecord, ...current.filter((record) => record.dateKey !== savedRecord.dateKey)];
        return next.sort((left, right) => right.dateKey.localeCompare(left.dateKey));
      });
      setMessage({
        type: "success",
        text:
          language === "ro"
            ? "Somnul a fost salvat în istoric."
            : "The sleep record was saved to history.",
      });
      clearSelection();
    } catch (error) {
      console.error("Error saving sleep record:", error);
      setMessage({
        type: "error",
        text:
          language === "ro"
            ? "Nu am putut salva înregistrarea de somn."
            : "Could not save the sleep record.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const summary = useMemo(() => summarizeSleep(sleepRecords), [sleepRecords]);
  const insights = useMemo(
    () =>
      buildSleepInsights({
        records: sleepRecords,
        medicalConditions: profile?.medicalConditions,
        language,
      }),
    [language, profile?.medicalConditions, sleepRecords]
  );
  const recentRecords = useMemo(() => sleepRecords.slice(0, 7), [sleepRecords]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="ethos-panel rounded-[32px] px-10 py-10 text-center">
          <div className="animate-ethos-float mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-500 text-white">
            <MoonStar className="h-5 w-5" />
          </div>
          <h1 className="ethos-display mt-5 text-4xl font-semibold text-slate-900">
            {language === "ro" ? "Pregătesc zona de sleep" : "Preparing your sleep hub"}
          </h1>
        </div>
      </div>
    );
  }

  const lastNight = summary.lastNight;

  return (
    <div className="pb-24">
      <section className="ethos-panel rounded-[36px] p-6 sm:p-8">
        <span className="ethos-kicker">
          <MoonStar className="h-3.5 w-3.5" />
          {language === "ro" ? "Sleep" : "Sleep"}
        </span>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="ethos-display text-[2.8rem] font-semibold leading-[0.92] tracking-[-0.05em] text-slate-900 sm:text-[4rem]">
              {language === "ro"
                ? "Importă screenshot-ul și vezi imediat cât ai dormit."
                : "Import the screenshot and see right away how much you slept."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {language === "ro"
                ? "Pagina arată doar ce contează: datele extrase, ultima noapte, istoricul recent și sfaturi bazate pe somnul tău trecut."
                : "This page shows only what matters: extracted data, your latest night, recent history, and tips based on your past sleep."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="ethos-panel-soft rounded-[24px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {language === "ro" ? "Medie" : "Average"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {summary.averageSleepHours > 0 ? formatSleepHours(summary.averageSleepHours) : "--"}
              </p>
            </div>
            <div className="ethos-panel-soft rounded-[24px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {language === "ro" ? "Eficiență" : "Efficiency"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {summary.averageEfficiency > 0 ? `${summary.averageEfficiency}%` : "--"}
              </p>
            </div>
            <div className="ethos-panel-soft rounded-[24px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {language === "ro" ? "Debt" : "Debt"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.sleepDebtHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <StatusBanner message={message} />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="ethos-panel rounded-[36px] p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                {language === "ro" ? "Import sleep screenshot" : "Import sleep screenshot"}
              </p>
              <h2 className="ethos-display mt-3 text-4xl font-semibold text-slate-900">
                {language === "ro" ? "Extrage orele de somn" : "Extract sleep hours"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                {language === "ro"
                  ? "Detectăm data, intervalul de somn, durata totală și etapele vizibile direct din imagine."
                  : "We detect the date, sleep window, total duration, and visible stages directly from the image."}
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" />
              {language === "ro" ? "Alege screenshot" : "Choose screenshot"}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              className="rounded-[30px] border border-dashed border-slate-300 bg-slate-50 p-5 text-left hover:border-emerald-300 hover:bg-white"
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Sleep screenshot preview"
                    className="h-[340px] w-full rounded-[24px] border border-slate-200 object-cover object-top"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-slate-500">{selectedFile?.name}</p>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        clearSelection();
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {language === "ro" ? "Șterge" : "Remove"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[24px] bg-white px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-slate-900 to-emerald-500 text-white">
                    <MoonStar className="h-7 w-7" />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-slate-900">
                    {language === "ro" ? "Click pentru upload" : "Click to upload"}
                  </p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    {language === "ro"
                      ? "Screenshot din aplicația ta de somn, cu data și orele vizibile."
                      : "A screenshot from your sleep app, with the date and times visible."}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[30px] bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {language === "ro" ? "Preview analiză" : "Analysis preview"}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    {analysis
                      ? language === "ro"
                        ? "Date detectate"
                        : "Detected data"
                      : language === "ro"
                        ? "Aștept imaginea"
                        : "Waiting for an image"}
                  </h3>
                </div>
                {analysis ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {getConfidenceLabel(analysis.confidence, language)}
                  </span>
                ) : null}
              </div>

              {analysis ? (
                <div className="mt-5 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {language === "ro" ? "Dată" : "Date"}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatDateLabel(analysis.dateKey, language)}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {language === "ro" ? "Fereastră de somn" : "Sleep window"}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {analysis.asleepTime || "--:--"} → {analysis.awakeTime || "--:--"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[24px] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {language === "ro" ? "Somn total" : "Total sleep"}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatMinutesAsDuration(analysis.totalSleepMinutes, language)}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {language === "ro" ? "Awake" : "Awake"}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{analysis.stages.awakeMinutes}m</p>
                    </div>
                    <div className="rounded-[24px] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {language === "ro" ? "Eficiență" : "Efficiency"}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{analysis.efficiency}%</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[24px] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Deep</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{analysis.stages.deepMinutes}m</p>
                    </div>
                    <div className="rounded-[24px] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">REM</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{analysis.stages.remMinutes}m</p>
                    </div>
                    <div className="rounded-[24px] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {language === "ro" ? "Light" : "Light"}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{analysis.stages.lightMinutes}m</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">
                    {(analysis.visibleClues[0] || analysis.sourceApp) &&
                      `${language === "ro" ? "Sursă" : "Source"}: ${analysis.sourceApp}`}
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] bg-white p-5 text-sm leading-7 text-slate-600">
                  {language === "ro"
                    ? "După analiză vei vedea aici doar datele importante: data, orele, durata și etapele de somn."
                    : "After analysis you will see only the important data: date, times, duration, and sleep stages."}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={analyzeSleepScreenshot}
                  disabled={!selectedFile || isAnalyzing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {language === "ro" ? "Analizează" : "Analyze"}
                </button>
                <button
                  onClick={saveSleepRecord}
                  disabled={!analysis || isSaving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:text-slate-300"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {language === "ro" ? "Salvează" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="ethos-panel rounded-[36px] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  {language === "ro" ? "Ultima noapte" : "Last night"}
                </p>
                <h2 className="ethos-display mt-3 text-4xl font-semibold text-slate-900">
                  {lastNight ? formatMinutesAsDuration(lastNight.totalSleepMinutes, language) : "--"}
                </h2>
              </div>
              {lastNight ? (
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getQualityStyles(lastNight.qualityScore)}`}>
                  {lastNight.qualityScore}/100
                </span>
              ) : null}
            </div>

            {lastNight ? (
              <div className="mt-6 space-y-4">
                  <div className="rounded-[28px] bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatDateLabel(lastNight.dateKey, language)}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {lastNight.asleepTime || "--:--"} → {lastNight.awakeTime || "--:--"} • {lastNight.sourceApp}
                        </p>
                      </div>
                      <span className="ethos-chip">
                      <Clock3 className="h-3.5 w-3.5" />
                      {lastNight.efficiency}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      label: language === "ro" ? "Deep" : "Deep",
                      value: lastNight.stages.deepMinutes,
                      color: "bg-indigo-500",
                    },
                    {
                      label: "REM",
                      value: lastNight.stages.remMinutes,
                      color: "bg-sky-500",
                    },
                    {
                      label: language === "ro" ? "Light" : "Light",
                      value: lastNight.stages.lightMinutes,
                      color: "bg-cyan-500",
                    },
                    {
                      label: language === "ro" ? "Awake" : "Awake",
                      value: lastNight.stages.awakeMinutes,
                      color: "bg-orange-500",
                    },
                  ].map((item) => {
                    const totalReference = item.label === (language === "ro" ? "Awake" : "Awake")
                      ? lastNight.timeInBedMinutes
                      : lastNight.totalSleepMinutes;

                    return (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{item.value}m</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${Math.min((item.value / Math.max(totalReference, 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {lastNight.visibleClues.length > 0 ? (
                  <div className="rounded-[28px] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      {language === "ro" ? "Am citit din imagine" : "Read from image"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lastNight.visibleClues.map((clue) => (
                        <span key={clue} className="ethos-chip text-xs">
                          {clue}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-[28px] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                {language === "ro"
                  ? "Când salvezi primul screenshot, aici apare noaptea cea mai recentă cu orele exacte și distribuția stadiilor."
                  : "Once you save the first screenshot, this section will show the latest night with exact times and stage distribution."}
              </div>
            )}
          </div>

          <div className="ethos-panel rounded-[36px] p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {language === "ro" ? "Sleep coaching" : "Sleep coaching"}
            </p>
            <h2 className="ethos-display mt-3 text-4xl font-semibold text-slate-900">
              {language === "ro" ? "Cum dormi mai bine" : "How to sleep better"}
            </h2>

            {insights.length > 0 ? (
              <div className="mt-6 space-y-3">
                {insights.map((insight) => (
                  <div key={insight.title} className={`rounded-[28px] border p-4 ${getInsightStyles(insight.tone)}`}>
                    <p className="font-semibold text-slate-900">{insight.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{insight.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                {language === "ro"
                  ? "Recomandările apar după ce ai măcar o noapte salvată."
                  : "Recommendations appear after you have at least one saved night."}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 ethos-panel rounded-[36px] p-6 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {language === "ro" ? "Istoric recent" : "Recent history"}
            </p>
            <h2 className="ethos-display mt-3 text-4xl font-semibold text-slate-900">
              {language === "ro" ? "Ultimele nopți" : "Recent nights"}
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            {language === "ro"
              ? `${recentRecords.length} nopți disponibile`
              : `${recentRecords.length} nights available`}
          </p>
        </div>

        {recentRecords.length > 0 ? (
          <div className="mt-6 space-y-3">
            {recentRecords.map((record) => (
              <div key={record.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{formatDateLabel(record.dateKey, language)}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {record.asleepTime || "--:--"} → {record.awakeTime || "--:--"} • {record.sourceApp}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-2xl bg-white px-4 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                        {language === "ro" ? "Sleep" : "Sleep"}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">{formatSleepHours(record.sleepHours)}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Deep</p>
                      <p className="mt-1 font-semibold text-slate-900">{record.stages.deepMinutes}m</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">REM</p>
                      <p className="mt-1 font-semibold text-slate-900">{record.stages.remMinutes}m</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                        {language === "ro" ? "Eff." : "Eff."}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">{record.efficiency}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
            {language === "ro"
              ? "Nu există încă istoric. Primul screenshot salvat va porni recomandările."
              : "There is no history yet. The first saved screenshot will start your recommendations."}
          </div>
        )}
      </section>
    </div>
  );
}
