"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  ChevronRight,
  Dumbbell,
  ExternalLink,
  Filter,
  PlayCircle,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TriangleAlert,
  X,
} from "lucide-react";
import { exercisesDatabase } from "@/lib/data/exercises";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import type {
  DifficultyLevel,
  Exercise,
  ExerciseCategory,
  MedicalWarning,
  MuscleGroup,
} from "@/lib/types/exercise";

type CategoryFilter = "Toate" | ExerciseCategory;
type DifficultyFilter = "Toate" | DifficultyLevel;
type MuscleFilter = "Toate" | MuscleGroup;

const categoryLabels: Record<ExerciseCategory, { ro: string; en: string }> = {
  Sala: { ro: "Sală", en: "Gym" },
  Acasa: { ro: "Acasă", en: "Home" },
  Stretching: { ro: "Stretching", en: "Stretching" },
};

const difficultyLabels: Record<DifficultyLevel, { ro: string; en: string }> = {
  Beginner: { ro: "Începător", en: "Beginner" },
  Intermediate: { ro: "Intermediar", en: "Intermediate" },
  Advanced: { ro: "Avansat", en: "Advanced" },
};

const muscleLabels: Partial<Record<MuscleGroup, { ro: string; en: string }>> = {
  Piept: { ro: "Piept", en: "Chest" },
  Spate: { ro: "Spate", en: "Back" },
  Umeri: { ro: "Umeri", en: "Shoulders" },
  Biceps: { ro: "Biceps", en: "Biceps" },
  Triceps: { ro: "Triceps", en: "Triceps" },
  Antebrat: { ro: "Antebraț", en: "Forearms" },
  Abdomen: { ro: "Abdomen", en: "Abs" },
  Fese: { ro: "Fese", en: "Glutes" },
  Cvadricepsi: { ro: "Cvadricepsi", en: "Quadriceps" },
  Ischiogambieri: { ro: "Ischiogambieri", en: "Hamstrings" },
  Gambiere: { ro: "Gambiere", en: "Calves" },
  Glezne: { ro: "Glezne", en: "Ankles" },
  "Full Body": { ro: "Full body", en: "Full body" },
  Cardio: { ro: "Cardio", en: "Cardio" },
};

const medicalWarningMeta: Record<MedicalWarning, { ro: string; en: string; color: string }> = {
  spate: { ro: "Atenție la spate", en: "Back caution", color: "bg-amber-100 text-amber-700" },
  genunchi: { ro: "Atenție la genunchi", en: "Knee caution", color: "bg-orange-100 text-orange-700" },
  umăr: { ro: "Atenție la umăr", en: "Shoulder caution", color: "bg-rose-100 text-rose-700" },
  "încheietură": { ro: "Atenție la încheietură", en: "Wrist caution", color: "bg-yellow-100 text-yellow-700" },
  gât: { ro: "Atenție la gât", en: "Neck caution", color: "bg-pink-100 text-pink-700" },
  cardio: { ro: "Atenție cardio", en: "Cardio caution", color: "bg-red-100 text-red-700" },
};

function toEmbedUrl(url: string | undefined): string {
  if (!url) {
    return "";
  }

  if (url.includes("embed/")) {
    return url;
  }

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  if (url.includes("watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("/shorts/")) {
    const id = url.split("/shorts/")[1]?.split(/[?&]/)[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  return url;
}

function formatDuration(duration: number | undefined): string {
  if (!duration || duration <= 0) {
    return "1-2 min";
  }

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatTimestamp(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function getCategoryBadge(category: ExerciseCategory) {
  if (category === "Sala") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (category === "Acasa") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-violet-100 text-violet-700";
}

function getDifficultyBadge(difficulty: DifficultyLevel) {
  if (difficulty === "Beginner") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (difficulty === "Intermediate") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-rose-100 text-rose-700";
}

export default function ExerciseLibraryPage() {
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Toate");
  const [muscleFilter, setMuscleFilter] = useState<MuscleFilter>("Toate");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("Toate");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const muscleOptions = useMemo(() => {
    const muscles = new Set<MuscleGroup>();

    exercisesDatabase.forEach((exercise) => {
      muscles.add(exercise.muscleGroup);
      exercise.secondaryMuscles?.forEach((muscle) => muscles.add(muscle));
    });

    return Array.from(muscles).sort((a, b) => a.localeCompare(b));
  }, []);

  const featuredExercises = useMemo(() => {
    return [...exercisesDatabase]
      .filter((exercise) => exercise.videoUrl || exercise.gifUrl)
      .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
      .slice(0, 4);
  }, []);

  const filteredExercises = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();

    return exercisesDatabase
      .filter((exercise) => {
        const matchesCategory = categoryFilter === "Toate" || exercise.category === categoryFilter;
        const matchesMuscle =
          muscleFilter === "Toate" ||
          exercise.muscleGroup === muscleFilter ||
          exercise.secondaryMuscles?.includes(muscleFilter);
        const matchesDifficulty = difficultyFilter === "Toate" || exercise.difficulty === difficultyFilter;

        const matchesSearch =
          searchLower.length === 0 ||
          exercise.name.toLowerCase().includes(searchLower) ||
          exercise.muscleGroup.toLowerCase().includes(searchLower) ||
          exercise.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          exercise.equipment.some((equipment) => equipment.toLowerCase().includes(searchLower)) ||
          exercise.synonyms?.some((synonym) => synonym.toLowerCase().includes(searchLower));

        return matchesCategory && matchesMuscle && matchesDifficulty && matchesSearch;
      })
      .sort((a, b) => {
        const popularityDelta = (b.popularityScore || 0) - (a.popularityScore || 0);
        if (popularityDelta !== 0) {
          return popularityDelta;
        }

        return a.name.localeCompare(b.name);
      });
  }, [categoryFilter, difficultyFilter, muscleFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      total: exercisesDatabase.length,
      withVideo: exercisesDatabase.filter((exercise) => exercise.videoUrl || exercise.gifUrl).length,
      verified: exercisesDatabase.filter((exercise) => exercise.isVerified).length,
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/30 sm:p-8">
        <Link
          href="/dev/main"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
        >
          ← {t("Înapoi la Dashboard", "Back to Dashboard")}
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <BookOpen className="h-3.5 w-3.5" />
              {t("Ghid complet exerciții", "Complete exercise guide")}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {t("Bibliotecă de exerciții cu video, tips și execuție pas cu pas", "Exercise library with video, tips, and step-by-step execution")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {t(
                "Ai acum o bibliotecă mare de exerciții verificate, cu tutorial video, pași clari de execuție, greșeli frecvente, sfaturi practice și filtre rapide după grupă musculară, dificultate și categorie.",
                "You now have a large verified exercise library with tutorial video, clear execution steps, common mistakes, practical cues, and fast filters by muscle group, difficulty, and category."
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl bg-slate-900 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">{t("Exerciții", "Exercises")}</p>
              <p className="mt-2 text-3xl font-bold">{counts.total}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">{t("Cu video", "With video")}</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{counts.withVideo}</p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700">{t("Verificate", "Verified")}</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">{counts.verified}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t("Exerciții recomandate", "Featured exercises")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("Cele mai utile exerciții cu demo video și explicații complete.", "Top exercises with video demos and complete guidance.")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-slate-200/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getCategoryBadge(exercise.category)}`}>
                  {language === "ro" ? categoryLabels[exercise.category].ro : categoryLabels[exercise.category].en}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-emerald-700">{exercise.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {language === "ro"
                  ? muscleLabels[exercise.muscleGroup]?.ro || exercise.muscleGroup
                  : muscleLabels[exercise.muscleGroup]?.en || exercise.muscleGroup}
              </p>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{exercise.tips.length} {t("tips", "tips")}</span>
                <span>{exercise.videoTimestamps?.length || 0} {t("momente", "chapters")}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t("Găsește exact ce ai nevoie", "Find exactly what you need")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("Caută după nume, echipament, tag-uri, grupă musculară sau nivel.", "Search by name, equipment, tags, muscle group, or level.")}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            {filteredExercises.length} {t("rezultate", "results")}
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("Caută exerciții, mușchi, echipament, tag-uri...", "Search exercises, muscles, equipment, tags...")}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t("Categorie", "Category")}</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(["Toate", "Sala", "Acasa", "Stretching"] as CategoryFilter[]).map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                    categoryFilter === category
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {category === "Toate"
                    ? t("Toate", "All")
                    : language === "ro"
                      ? categoryLabels[category].ro
                      : categoryLabels[category].en}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t("Grupă musculară", "Muscle group")}</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setMuscleFilter("Toate")}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                  muscleFilter === "Toate" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t("Toate", "All")}
              </button>
              {muscleOptions.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => setMuscleFilter(muscle)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                    muscleFilter === muscle ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {language === "ro" ? muscleLabels[muscle]?.ro || muscle : muscleLabels[muscle]?.en || muscle}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t("Nivel", "Difficulty")}</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(["Toate", "Beginner", "Intermediate", "Advanced"] as DifficultyFilter[]).map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setDifficultyFilter(difficulty)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                    difficultyFilter === difficulty
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {difficulty === "Toate"
                    ? t("Toate", "All")
                    : language === "ro"
                      ? difficultyLabels[difficulty].ro
                      : difficultyLabels[difficulty].en}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {filteredExercises.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">{t("Nu am găsit exerciții potrivite", "No exercises matched")}</p>
          <p className="mt-2 text-sm text-slate-500">
            {t("Șterge filtrele sau încearcă alt termen de căutare.", "Clear filters or try a different search term.")}
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("Toate");
              setMuscleFilter("Toate");
              setDifficultyFilter("Toate");
            }}
            className="mt-4 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t("Resetează filtrele", "Reset filters")}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-slate-200/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-slate-900 group-hover:text-emerald-700">
                    {exercise.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {language === "ro"
                      ? muscleLabels[exercise.muscleGroup]?.ro || exercise.muscleGroup
                      : muscleLabels[exercise.muscleGroup]?.en || exercise.muscleGroup}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-emerald-500" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getCategoryBadge(exercise.category)}`}>
                  {language === "ro" ? categoryLabels[exercise.category].ro : categoryLabels[exercise.category].en}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getDifficultyBadge(exercise.difficulty)}`}>
                  {language === "ro" ? difficultyLabels[exercise.difficulty].ro : difficultyLabels[exercise.difficulty].en}
                </span>
                {exercise.isVerified ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {t("Verificat", "Verified")}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-900">{t("Echipament:", "Equipment:")}</span>{" "}
                  {exercise.equipment.join(", ")}
                </p>
                <p>
                  <span className="font-medium text-slate-900">{t("Ai inclus:", "Includes:")}</span>{" "}
                  {exercise.instructions.length} {t("pași", "steps")} • {exercise.tips.length} {t("tips", "tips")}
                  {exercise.mistakes?.length ? ` • ${exercise.mistakes.length} ${t("greșeli", "mistakes")}` : ""}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(exercise.videoUrl || exercise.gifUrl) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    <PlayCircle className="h-3.5 w-3.5" />
                    {t("Video inclus", "Video included")}
                  </span>
                ) : null}
                {exercise.medicalWarnings?.slice(0, 2).map((warning) => (
                  <span
                    key={warning}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${medicalWarningMeta[warning].color}`}
                  >
                    <TriangleAlert className="h-3.5 w-3.5" />
                    {language === "ro" ? medicalWarningMeta[warning].ro : medicalWarningMeta[warning].en}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedExercise ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getCategoryBadge(selectedExercise.category)}`}>
                      {language === "ro" ? categoryLabels[selectedExercise.category].ro : categoryLabels[selectedExercise.category].en}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getDifficultyBadge(selectedExercise.difficulty)}`}>
                      {language === "ro" ? difficultyLabels[selectedExercise.difficulty].ro : difficultyLabels[selectedExercise.difficulty].en}
                    </span>
                    {selectedExercise.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {t("Verificat", "Verified")}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{selectedExercise.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {language === "ro"
                      ? muscleLabels[selectedExercise.muscleGroup]?.ro || selectedExercise.muscleGroup
                      : muscleLabels[selectedExercise.muscleGroup]?.en || selectedExercise.muscleGroup}
                    {selectedExercise.secondaryMuscles?.length
                      ? ` • ${selectedExercise.secondaryMuscles
                          .map((muscle) => (language === "ro" ? muscleLabels[muscle]?.ro || muscle : muscleLabels[muscle]?.en || muscle))
                          .join(", ")}`
                      : ""}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedExercise(null)}
                  className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  {(selectedExercise.videoUrl || selectedExercise.gifUrl) ? (
                    <div className="overflow-hidden rounded-[28px] border border-slate-200">
                      <div className="aspect-video bg-slate-950">
                        {selectedExercise.videoUrl ? (
                          <iframe
                            src={toEmbedUrl(selectedExercise.videoUrl)}
                            title={selectedExercise.name}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <img
                            src={selectedExercise.gifUrl}
                            alt={selectedExercise.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{t("Tutorial video", "Tutorial video")}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {selectedExercise.videoDuration
                              ? `${t("Durată", "Duration")}: ${formatDuration(selectedExercise.videoDuration)}`
                              : t("Clip demonstrativ disponibil", "Demo clip available")}
                          </p>
                        </div>
                        {selectedExercise.videoUrl ? (
                          <a
                            href={selectedExercise.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            {t("Deschide pe YouTube", "Open on YouTube")}
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                      {t("Pentru acest exercițiu încă nu există video atașat, dar ai mai jos pașii, tips-urile și greșelile importante.", "This exercise does not have a video attached yet, but you still have the full steps, tips, and common mistakes below.")}
                    </div>
                  )}

                  {selectedExercise.videoTimestamps?.length ? (
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <h3 className="text-lg font-semibold text-slate-900">{t("Capitole video", "Video chapters")}</h3>
                      <div className="mt-4 grid gap-2">
                        {selectedExercise.videoTimestamps.map((timestamp) => (
                          <div
                            key={`${timestamp.time}-${timestamp.title}`}
                            className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <span className="rounded-full bg-white px-2.5 py-1 font-mono text-xs font-semibold text-emerald-700">
                              {formatTimestamp(timestamp.time)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{timestamp.title}</p>
                              {timestamp.description ? (
                                <p className="mt-1 text-sm text-slate-500">{timestamp.description}</p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-semibold text-slate-900">{t("Tot ce îți trebuie", "Everything you need")}</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="font-semibold text-slate-900">{t("Echipament", "Equipment")}</p>
                        <p className="mt-2">{selectedExercise.equipment.join(", ")}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="font-semibold text-slate-900">{t("Nivel recomandat", "Recommended level")}</p>
                        <p className="mt-2">
                          {language === "ro"
                            ? difficultyLabels[selectedExercise.difficulty].ro
                            : difficultyLabels[selectedExercise.difficulty].en}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="font-semibold text-slate-900">{t("Focus principal", "Primary focus")}</p>
                        <p className="mt-2">
                          {language === "ro"
                            ? muscleLabels[selectedExercise.muscleGroup]?.ro || selectedExercise.muscleGroup
                            : muscleLabels[selectedExercise.muscleGroup]?.en || selectedExercise.muscleGroup}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-blue-50 p-5">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <ShieldAlert className="h-5 w-5 text-blue-600" />
                      {t("Înainte să începi", "Before you start")}
                    </h3>
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                      <li>• {t("Fă 5-10 minute de încălzire generală și 1-2 seturi ușoare de acomodare.", "Do 5-10 minutes of general warm-up and 1-2 lighter ramp-up sets.")}</li>
                      <li>• {t("Asigură setup-ul stabil și amplitudinea pe care o poți controla fără durere.", "Set up a stable position and use a range of motion you can control without pain.")}</li>
                      <li>• {t("Păstrează ritmul controlat. Tehnica vine înaintea greutății.", "Keep the tempo controlled. Technique comes before load.")}</li>
                    </ul>

                    {selectedExercise.medicalWarnings?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedExercise.medicalWarnings.map((warning) => (
                          <span
                            key={warning}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${medicalWarningMeta[warning].color}`}
                          >
                            <TriangleAlert className="h-3.5 w-3.5" />
                            {language === "ro" ? medicalWarningMeta[warning].ro : medicalWarningMeta[warning].en}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Target className="h-5 w-5 text-emerald-600" />
                    {t("Execuție pas cu pas", "Step-by-step execution")}
                  </h3>
                  <ol className="mt-4 space-y-3">
                    {selectedExercise.instructions.map((step, index) => (
                      <li key={step} className="flex gap-3 rounded-2xl bg-white px-4 py-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="text-sm leading-6 text-slate-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[28px] border border-amber-200 bg-amber-50/70 p-5">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                      {t("Tips utile", "Useful tips")}
                    </h3>
                    <ul className="mt-4 space-y-2">
                      {selectedExercise.tips.map((tip) => (
                        <li key={tip} className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                          ✓ {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedExercise.mistakes?.length ? (
                    <div className="rounded-[28px] border border-rose-200 bg-rose-50/70 p-5">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <TriangleAlert className="h-5 w-5 text-rose-600" />
                        {t("Greșeli comune", "Common mistakes")}
                      </h3>
                      <ul className="mt-4 space-y-2">
                        {selectedExercise.mistakes.map((mistake) => (
                          <li key={mistake} className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                            ✗ {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Dumbbell className="h-5 w-5 text-slate-700" />
                  {t("Tag-uri și căutare rapidă", "Tags and quick search")}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedExercise.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        setSelectedExercise(null);
                      }}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
