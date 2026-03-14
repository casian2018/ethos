/**
 * Exercise Guides
 */

"use client";

import { useState } from "react";
import Link from "next/link";

const exercises = [
  {
    id: 1,
    name: "Push-ups",
    muscle: "Chest, Triceps",
    difficulty: "Beginner",
    tips: ["Keep your body straight", "Hands shoulder-width apart", "Lower chest to the ground"],
    mistakes: ["Flaring elbows out", "Sagging hips", "Partial range of motion"],
  },
  {
    id: 2,
    name: "Squats",
    muscle: "Quads, Glutes",
    difficulty: "Beginner",
    tips: ["Keep knees tracking over toes", "Chest up, back straight", "Go as low as comfortable"],
    mistakes: ["Knees caving inward", "Heels lifting", "Rounding back"],
  },
  {
    id: 3,
    name: "Plank",
    muscle: "Core",
    difficulty: "Beginner",
    tips: ["Keep hips level", "Engage your core", "Don't hold your breath"],
    mistakes: ["Holding hips too high", "Letting shoulders sag", "Holding too long with bad form"],
  },
  {
    id: 4,
    name: "Lunges",
    muscle: "Quads, Glutes",
    difficulty: "Intermediate",
    tips: ["Step forward with control", "Keep front knee over ankle", "Lower back knee toward floor"],
    mistakes: ["Overstriding", "Knee past toes", "Tunnel vision focus"],
  },
  {
    id: 5,
    name: "Burpees",
    muscle: "Full Body",
    difficulty: "Advanced",
    tips: ["Modify with step-back burpees", "Keep a steady pace", "Focus on form over speed"],
    mistakes: ["Skipping the jump", "Not going full range", "Exhausting too quickly"],
  },
  {
    id: 6,
    name: "Dumbbell Bench Press",
    muscle: "Chest, Triceps",
    difficulty: "Intermediate",
    tips: ["Keep dumbbells in line with mid-chest", "Lower with control", "Don't bounce off chest"],
    mistakes: ["Flaring elbows", "Lifting butt", "Inconsistent range"],
  },
  {
    id: 7,
    name: "Deadlift",
    muscle: "Back, Glutes, Hamstrings",
    difficulty: "Advanced",
    tips: ["Keep bar close to body", "Drive with hips", "Maintain neutral spine"],
    mistakes: ["Rounding lower back", "Jerking the weight", "Looking up too much"],
  },
  {
    id: 8,
    name: "Pull-ups",
    muscle: "Back, Biceps",
    difficulty: "Advanced",
    tips: ["Pull chest to bar", "Engage lats first", "Control the descent"],
    mistakes: ["Using momentum", "Chin not passing bar", "Shrugging shoulders"],
  },
];

export default function ExercisesPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <header className="mb-6">
        <Link href="/train" className="text-zinc-500 dark:text-zinc-400 mb-2 inline-flex items-center gap-1">
          ← Back to Train
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Exercise Guides
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Learn proper form and technique
        </p>
      </header>

      {/* Exercise List */}
      <div className="space-y-3">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === exercise.id ? null : exercise.id)}
              className="w-full p-5 flex items-center justify-between text-left"
            >
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {exercise.name}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-zinc-500">{exercise.muscle}</span>
                  <span className={`badge ${
                    exercise.difficulty === "Beginner" ? "badge-beginner" :
                    exercise.difficulty === "Intermediate" ? "badge-intermediate" :
                    "badge-advanced"
                  }`}>
                    {exercise.difficulty}
                  </span>
                </div>
              </div>
              <span className={`text-zinc-400 transition-transform ${
                expanded === exercise.id ? "rotate-180" : ""
              }`}>
                ▼
              </span>
            </button>
            
            {expanded === exercise.id && (
              <div className="px-5 pb-5 animate-fade-in">
                <div className="mb-4">
                  <h4 className="font-medium text-zinc-900 dark:text-white mb-2">
                    ✓ Tips:
                  </h4>
                  <ul className="space-y-1">
                    {exercise.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                        <span className="text-emerald-500">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                    ✗ Common Mistakes:
                  </h4>
                  <ul className="space-y-1">
                    {exercise.mistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                        <span className="text-red-500">•</span>
                        {mistake}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
