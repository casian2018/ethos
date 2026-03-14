"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";

interface EquipmentGuide {
  id: string;
  name: string;
  muscleGroups: string[];
  instructions: string[];
  tips: string[];
}

const equipmentGuides: EquipmentGuide[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    muscleGroups: ["Chest", "Triceps", "Shoulders"],
    instructions: [
      "Lie flat on the bench with your eyes directly under the bar",
      "Grip the bar slightly wider than shoulder-width",
      "Unrack the bar and lower it to your mid-chest",
      "Press the bar back up until your arms are fully extended",
      "Keep your feet flat on the floor and maintain a slight arch in your lower back"
    ],
    tips: [
      "Keep your shoulder blades retracted throughout the movement",
      "Don't bounce the bar off your chest",
      "Use a spotter for heavy lifts",
      "Focus on controlled movement both up and down"
    ]
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscleGroups: ["Latissimus Dorsi", "Biceps", "Rhomboids"],
    instructions: [
      "Sit at the lat pulldown machine and secure your thighs under the pad",
      "Grip the bar wider than shoulder-width",
      "Pull the bar down to your upper chest in a controlled motion",
      "Squeeze your shoulder blades together at the bottom",
      "Slowly return the bar to the starting position with control"
    ],
    tips: [
      "Avoid pulling the bar behind your neck",
      "Lean back slightly and stick your chest out",
      "Focus on feeling the lats do the work, not your arms",
      "Use a mixed grip or rope attachment for variety"
    ]
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
    instructions: [
      "Sit in the leg press machine with your back flat against the pad",
      "Place your feet shoulder-width apart on the platform",
      "Release the safety handles and lower the weight slowly",
      "Lower until your knees are at about 90 degrees",
      "Press the platform away until your legs are almost fully extended"
    ],
    tips: [
      "Don't lock your knees at the top of the movement",
      "Keep your lower back pressed against the pad",
      "Start with a lighter weight to master the form",
      "Point your toes slightly outward for better quad engagement"
    ]
  },
  {
    id: "cable-row",
    name: "Cable Row",
    muscleGroups: ["Middle Back", "Biceps", "Lats"],
    instructions: [
      "Sit at the cable row station with your feet on the platform",
      "Grab the handle with both hands and keep your arms extended",
      "Pull the handle toward your abdomen while keeping your back straight",
      "Squeeze your shoulder blades together at the end of the movement",
      "Return to the starting position with control"
    ],
    tips: [
      "Avoid using momentum - keep the movement controlled",
      "Focus on squeezing your back muscles",
      "Keep your core engaged throughout the exercise",
      "Vary your hand position to target different muscles"
    ]
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    muscleGroups: ["Deltoids", "Triceps", "Upper Chest"],
    instructions: [
      "Sit or stand with the weights at shoulder height",
      "Palms facing forward and elbows bent at 90 degrees",
      "Press the weights overhead until your arms are fully extended",
      "Lower the weights back to shoulder height with control",
      "Keep your core tight and avoid arching your back excessively"
    ],
    tips: [
      "Don't press the weights together at the top - keep them separated",
      "Move your head slightly forward as you press up",
      "Use a mirror to check your form",
      "Start with lighter weights to perfect your technique"
    ]
  }
];

function EquipmentCard({ equipment }: { equipment: EquipmentGuide }) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card overflow-hidden dark:bg-zinc-900">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{equipment.name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {equipment.muscleGroups.map((muscle) => (
                <span
                  key={muscle}
                  className="badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800">
          <div className="pt-4 space-y-5">
            {/* Instructions */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t("howto.howToUse")}
              </h4>
              <ol className="space-y-2.5">
                {equipment.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {t("howto.proTips")}
              </h4>
              <ul className="space-y-2">
                {equipment.tips.map((tip, index) => (
                  <li key={index} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HowToPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t("howto.title")}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t("howto.subtitle")}</p>
        </div>

        {/* Equipment Grid */}
        <div className="space-y-4">
          {equipmentGuides.map((equipment) => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                <strong>{t("howto.remember")}:</strong> {t("howto.rememberText")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
