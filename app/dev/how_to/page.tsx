/**
 * Exercise Database Page
 * Baza de Date Exerciții - with search, filters, and modal details
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Exercise, ExerciseCategory, DifficultyLevel } from "@/lib/types/exercise";

// Sample data - in production this would come from Firestore
const sampleExercises: Exercise[] = [
  {
    id: "leg_001",
    slug: "genuflexiuni-cu-haltera",
    name: "Genuflexiuni cu haltera",
    category: "Sala",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese", "Ischiogambieri"],
    equipment: ["Halteră", "Bancă"],
    difficulty: "Intermediate",
    instructions: [
      "Stai în picioare cu haltera pe umeri",
      "Păstrează picioarele la lățimea umerilor",
      "Coboară încet până coapsele sunt paralele cu podeaua",
      "Revino în poziția de start",
      "Menține spatele drept pe tot parcursul mișcării"
    ],
    tips: [
      "Inspiră în timp ce cobori",
      "Ține pieptul ridicat",
      "Nu lăsa genunchii să depășească vârful picioarelor",
      "Privește înainte, nu în jos"
    ],
    mistakes: [
      "Genunchii către interior",
      "Călcâiele se ridică de pe podea",
      "Spatele rotunjit",
      "Mișcare prea rapidă"
    ],
    videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8",
    videoTimestamps: [
      { time: 0, title: "Introducere", description: "Despre exercițiu" },
      { time: 15, title: "Setup", description: "Poziția inițială" },
      { time: 30, title: "Execuția", description: "Coborârea" },
      { time: 45, title: "Revenire", description: "Urcarea" },
      { time: 60, title: "Greșeli", description: "Ce să eviți" }
    ],
    tags: ["squat", "picioare", "fesieri", "compus", "hala", "genuflexiuni"],
    language: "ro",
    isVerified: true,
    popularityScore: 95
  },
  {
    id: "leg_002",
    slug: "presa-pentru-picioare",
    name: "Presă pentru picioare",
    category: "Sala",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese"],
    equipment: ["Mașină dePresă"],
    difficulty: "Beginner",
    instructions: [
      "Așază-te pe mașina de presă cu picioarele pe platformă",
      "Păstrează picioarele la lățimea umerilor",
      "Eliberează siguranțele",
      "Coboară platforma încet până genunchii sunt la 90 grade",
      "Împinge înapoi fără a bloca genunchii"
    ],
    tips: [
      "Nu îndoi complet genunchii la partea inferioară",
      "Ține partea inferioară a spatelui pe spate",
      "Păstrează o ușoară curbură în partea inferioară a spatelui"
    ],
    mistakes: [
      "Genunchii se apropie prea mult de piept",
      "Mișcare rapidă fără control",
      "Picioare prea înguste sau prea late"
    ],
    tags: ["presa", "picioare", "cvadricepsi", "masina", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 88
  },
  {
    id: "leg_003",
    slug: "fandari-in-picioare",
    name: "Fandări înainte",
    category: "Acasa",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese", "Ischiogambieri"],
    equipment: ["Greutate corporală"],
    difficulty: "Beginner",
    instructions: [
      "Stai drept cu picioarele la lățimea umerilor",
      "Pasul înainte cu un picior",
      "Coboară până coapsa din față este paralelă cu podeaua",
      "Revino în poziția de start",
      "Alternază picioarele"
    ],
    tips: [
      "Păstrează trunchiul drept",
      "Genunchiul din față nu trebuie să depășească degetele",
      "Fă pași mari pentru a implica mai mult fesierii"
    ],
    mistakes: [
      "Genunchiul din față depășește degetele",
      "Corpul se înclină înainte",
      "Pasul prea mic"
    ],
    tags: ["fandari", "lunge", "picioare", "acasă", "greutate corporala"],
    language: "ro",
    isVerified: true,
    popularityScore: 82
  },
  {
    id: "leg_004",
    slug: "step-up-pe-scaun",
    name: "Step-up pe scaun",
    category: "Acasa",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese"],
    equipment: ["Scaun"],
    difficulty: "Beginner",
    instructions: [
      "Stai în fața unui scaun stabil",
      "Păsește cu un picior pe scaun",
      "Împinge pentru a ridica tot corpul",
      "Coboară controlat",
      "Alternază picioarele"
    ],
    tips: [
      "Folosește o mână pentru echilibru",
      "Păstrează trunchiul drept",
      "Coboară cu control, nu sări"
    ],
    mistakes: [
      "Scaun instabil",
      "Mișcare prea rapidă",
      "Greutate pe vârful piciorului"
    ],
    tags: ["step up", "picioare", "acasă", "cardio", "scaun"],
    language: "ro",
    isVerified: true,
    popularityScore: 75
  },
  {
    id: "leg_005",
    slug: "ridicari-pe-varfuri",
    name: "Ridicări pe vârful picioarelor",
    category: "Sala",
    muscleGroup: "Gambiere",
    secondaryMuscles: [],
    equipment: ["Halteră"],
    difficulty: "Beginner",
    instructions: [
      "Stai drept cu haltera în mâini",
      "Păstrează picioarele la lățimea umerilor",
      "Ridică-te pe vârful picioarelor",
      "Ține o secundă în partea de sus",
      "Coboară încet"
    ],
    tips: [
      "Mișcare lentă și controlată",
      "Încordează gambierele în partea de sus",
      "Poți sta pe o margine pentru amplitudine mai mare"
    ],
    mistakes: [
      "Mișcare prea rapidă",
      "Nu ridici suficient",
      "Greutate prea mare"
    ],
    tags: ["calf raise", "gambiere", "picioare", "sala", "hala"],
    language: "ro",
    isVerified: true,
    popularityScore: 70
  },
  {
    id: "leg_006",
    slug: "stretching-cvadriceps",
    name: "Stretching Cvadriceps - În picioare",
    category: "Stretching",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: [],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "Stai drept lângă un perete pentru echilibru",
      "Îndoiește un genunchi și prinde glezna cu mâna",
      "Trage căldura spre fese",
      "Ține 20-30 secunde",
      "Repetă cu celălalt picior"
    ],
    tips: [
      "Nu te apleca înainte",
      "Ține genunchii apropiați",
      "Respiră adânc și relaxează-te în întindere"
    ],
    mistakes: [
      "Genunchiul se depărtează",
      "Spatele se apleacă",
      "Forțează întinderea"
    ],
    tags: ["stretching", "cvadriceps", "intindere", "recuperare", "mobilitate"],
    language: "ro",
    isVerified: true,
    popularityScore: 65
  },
  {
    id: "leg_007",
    slug: "stretching-femurali",
    name: "Stretching pentru Femurali",
    category: "Stretching",
    muscleGroup: "Ischiogambieri",
    secondaryMuscles: ["Fese"],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "Stai pe podea cu un picior întins",
      "Îndoiește celălalt picior cu talpa pe podea",
      "Înclină-te spre piciorul întins",
      "Ține 20-30 secunde",
      "Nu forța, simte întinderea"
    ],
    tips: [
      "Ține spatele drept",
      "Respiră adânc",
      "Începe cu picioarele ușor îndoite"
    ],
    mistakes: [
      "Spatele rotund",
      "Forțarea mișcării",
      "Genunchiul blocat complet"
    ],
    tags: ["stretching", "femurali", "hamstrings", "intindere", "mobilitate"],
    language: "ro",
    isVerified: true,
    popularityScore: 68
  },
  {
    id: "leg_008",
    slug: "impins-pentru-gambe",
    name: "Împins pentru Gambiere",
    category: "Sala",
    muscleGroup: "Gambiere",
    secondaryMuscles: [],
    equipment: ["Mașină dePresă"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe mașina pentru gambiere",
      "Pune vârful picioarelor pe platformă",
      "Coboară greutatea prin extensia gleznelor",
      "Încordează gambierele în partea de jos",
      "Revino încet"
    ],
    tips: [
      "Mișcare completă",
      "Nu îndoi genunchii",
      "Poți varya poziția picioarelor"
    ],
    mistakes: [
      "Mișcare rapidă",
      "Picioare nu sunt fixate",
      "Greutate prea mare"
    ],
    tags: ["calf press", "gambiere", "picioare", "masina", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 60
  }
];

// Category type for filters
type CategoryFilter = 'Toate' | ExerciseCategory;

export default function ExercisesPage() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Toate');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // Filtered exercises based on search and category
  const filteredExercises = useMemo(() => {
    return sampleExercises.filter(exercise => {
      // Category filter
      const matchesCategory = categoryFilter === 'Toate' || exercise.category === categoryFilter;
      
      // Search filter (name, muscleGroup, tags)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        exercise.name.toLowerCase().includes(searchLower) ||
        exercise.muscleGroup.toLowerCase().includes(searchLower) ||
        exercise.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, categoryFilter]);
  
  // Get badge color based on category
  const getCategoryBadge = (category: ExerciseCategory) => {
    switch (category) {
      case 'Sala':
        return 'bg-emerald-100 text-emerald-700 bg-emerald-100 text-emerald-600';
      case 'Acasa':
        return 'bg-blue-100 text-blue-700 bg-blue-100 text-blue-600';
      case 'Stretching':
        return 'bg-purple-100 text-purple-700 bg-purple-100 text-purple-600';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };
  
  // Get difficulty color
  const getDifficultyBadge = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-700 bg-green-100 text-green-600';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-700 bg-yellow-100 text-yellow-600';
      case 'Advanced':
        return 'bg-red-100 text-red-700 bg-red-100 text-red-600';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <header className="mb-6">
        <Link href="/train" className="text-emerald-600 hover:text-emerald-700 text-emerald-600 mb-2 inline-flex items-center gap-1 text-sm font-medium">
          ← Înapoi la Antrenamente
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 text-slate-900">
          Baza de Date Exerciții
        </h1>
        <p className="text-zinc-600 text-slate-500 mt-1">
          Găsește exercițiul perfect pentru antrenamentul tău
        </p>
      </header>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Caută exerciții... (nume, grupă musculară, tags)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white bg-slate-50 border border-zinc-200 border-slate-200 rounded-xl text-zinc-900 text-slate-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['Toate', 'Sala', 'Acasa', 'Stretching'] as CategoryFilter[]).map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              categoryFilter === category
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 bg-slate-50 text-zinc-600 text-slate-500 hover:bg-zinc-200 hover:bg-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-zinc-500 text-slate-500 mb-4">
        {filteredExercises.length} exerciții găsite
      </p>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExercises.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => setSelectedExercise(exercise)}
            className="bg-white bg-slate-50 rounded-xl p-4 border border-zinc-200 border-slate-200 text-left hover:border-emerald-500 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-zinc-900 text-slate-900 group-hover:text-emerald-600 group-hover:text-emerald-600">
                {exercise.name}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(exercise.category)}`}>
                {exercise.category}
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-zinc-500 text-slate-500">
                {exercise.muscleGroup}
              </span>
              {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                <span className="text-xs text-zinc-400 text-slate-500">
                  + {exercise.secondaryMuscles.join(', ')}
                </span>
              )}
            </div>
            
            <div className="mt-3 flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBadge(exercise.difficulty)}`}>
                {exercise.difficulty}
              </span>
              <div className="flex gap-1 flex-wrap">
                {exercise.equipment.slice(0, 2).map((eq, i) => (
                  <span key={i} className="text-xs text-zinc-400 text-slate-500 bg-zinc-100 bg-slate-100 px-2 py-0.5 rounded">
                    {eq}
                  </span>
                ))}
                {exercise.equipment.length > 2 && (
                  <span className="text-xs text-zinc-400">+{exercise.equipment.length - 2}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* No results */}
      {filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500 text-slate-500">
            Nu am găsit exerciții care să corespundă căutării tale.
          </p>
          <button
            onClick={() => {setSearchQuery(''); setCategoryFilter('Toate');}}
            className="mt-4 text-emerald-600 hover:text-emerald-700 text-emerald-600 font-medium"
          >
            Șterge filtrele
          </button>
        </div>
      )}

      {/* Modal for Exercise Details */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedExercise(null)}>
          <div 
            className="bg-white bg-slate-50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white bg-slate-50 p-4 border-b border-zinc-200 border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 text-slate-900">
                  {selectedExercise.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(selectedExercise.category)}`}>
                    {selectedExercise.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBadge(selectedExercise.difficulty)}`}>
                    {selectedExercise.difficulty}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="p-2 hover:bg-zinc-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6">
              {/* Video Tutorial */}
              {(selectedExercise.videoUrl || selectedExercise.gifUrl) && (
                <div>
                  <h3 className="font-medium text-zinc-900 text-slate-900 mb-3">
                    🎬 Tutorial Video
                  </h3>
                  <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden">
                    {selectedExercise.videoUrl ? (
                      <iframe
                        src={selectedExercise.videoUrl.replace('watch?v=', 'embed/')}
                        title={selectedExercise.name}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : selectedExercise.gifUrl ? (
                      <img
                        src={selectedExercise.gifUrl}
                        alt={selectedExercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  
                  {/* Video Timestamps */}
                  {selectedExercise.videoTimestamps && selectedExercise.videoTimestamps.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {selectedExercise.videoTimestamps.map((ts, i) => (
                        <button
                          key={i}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                          onClick={() => {
                            // Could implement video seek here
                          }}
                        >
                          <span className="text-emerald-600 text-emerald-600 font-mono text-sm">
                            {Math.floor(ts.time / 60)}:{String(ts.time % 60).padStart(2, '0')}
                          </span>
                          <span className="text-zinc-600 text-slate-600 text-sm">
                            {ts.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Muscle Groups */}
              <div>
                <h3 className="font-medium text-zinc-900 text-slate-900 mb-2">
                  🎯 Grupă Musculară
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-100 bg-emerald-100 text-emerald-700 text-emerald-600 rounded-full text-sm">
                    {selectedExercise.muscleGroup}
                  </span>
                  {selectedExercise.secondaryMuscles?.map((muscle, i) => (
                    <span key={i} className="px-3 py-1 bg-zinc-100 bg-slate-100 text-zinc-600 text-slate-600 rounded-full text-sm">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <h3 className="font-medium text-zinc-900 text-slate-900 mb-2">
                  🏋️ Echipament Necesar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.equipment.map((eq, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 bg-blue-100 text-blue-700 text-blue-600 rounded-full text-sm">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-medium text-zinc-900 text-slate-900 mb-3">
                  📝 Explicație Pas cu Pas
                </h3>
                <ol className="space-y-2">
                  {selectedExercise.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 bg-emerald-100 text-emerald-600 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <span className="text-zinc-600 text-slate-600">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              <div>
                <h3 className="font-medium text-emerald-700 text-emerald-600 mb-3">
                  ✨ Tips & Tricks
                </h3>
                <ul className="space-y-2">
                  {selectedExercise.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="text-emerald-500 mt-1">✓</span>
                      <span className="text-zinc-600 text-slate-600">
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mistakes */}
              {selectedExercise.mistakes && selectedExercise.mistakes.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-600 text-red-600 mb-3">
                    ⚠️ Greșeli Comune de Evitat
                  </h3>
                  <ul className="space-y-2">
                    {selectedExercise.mistakes.map((mistake, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="text-red-500 mt-1">✗</span>
                        <span className="text-zinc-600 text-slate-600">
                          {mistake}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              <div>
                <h3 className="font-medium text-zinc-900 text-slate-900 mb-2">
                  🏷️ Căutare
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-1 bg-zinc-100 bg-slate-100 text-zinc-500 text-slate-500 rounded text-xs cursor-pointer hover:bg-zinc-200 hover:bg-slate-300"
                      onClick={() => {setSearchQuery(tag); setSelectedExercise(null);}}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
