/**
 * Train Hub
 */

"use client";

import Link from "next/link";

export default function TrainPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
          Train
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Generate workouts and track your training
        </p>
      </header>

      {/* Main Action - AI Workout Generator */}
      <section className="card p-8 mb-6 text-center">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
          AI Workout Generator
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
          Get personalized workout plans based on your goals, fitness level, and available equipment.
        </p>
        <Link
          href="/train/workout"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-lg"
        >
          Generate Workout
        </Link>
      </section>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/train/exercises" className="card-hover p-6 text-center">
          <span className="text-3xl block mb-2">📖</span>
          <span className="font-medium text-zinc-900 dark:text-white">
            Exercise Guides
          </span>
        </Link>
        
        <Link href="/train/history" className="card-hover p-6 text-center">
          <span className="text-3xl block mb-2">📊</span>
          <span className="font-medium text-zinc-900 dark:text-white">
            Workout History
          </span>
        </Link>
      </div>
    </div>
  );
}
