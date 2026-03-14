/**
 * Ethos Exercise Database Types
 * TypeScript interfaces for Firestore exercise collection
 */

// Main exercise categories
export type ExerciseCategory = 'Sala' | 'Acasa' | 'Stretching';

// Muscle groups
export type MuscleGroup = 
  | 'Piept'
  | 'Spate'
  | 'Umeri'
  | 'Biceps'
  | 'Triceps'
  | 'Antebrat'
  | 'Abdomen'
  | 'Fese'
  | 'Cvadricepsi'
  | 'Ischiogambieri'
  | 'Gambiere'
  | 'Glezne'
  | 'Full Body'
  | 'Cardio';

// Equipment types
export type Equipment = 
  | 'Halteră'
  | 'Gantera'
  | 'Bancă'
  | 'Bancă inclinată'
  | 'Mașină deSmith'
  | 'Mașină dePresă'
  | 'Mașină pentruGambiere'
  | 'Cablu'
  | 'Elastice'
  | 'Kettlebell'
  | 'Greutate corporală'
  | 'Niciunul'
  | 'Minge medicinală'
  | 'Bară'
  | 'Rozetă'
  | 'Scaun'
  | 'Step';

// Difficulty levels
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/**
 * Main Exercise Interface
 * Firestore collection: 'exercises'
 */
export interface Exercise {
  // ID & Identification
  id: string;                    // Firestore document ID
  slug: string;                  // Unique slug for URL (e.g., 'impins-la-piept-cu-haltera')
  
  // Basic Info
  name: string;                  // Exercise name (e.g., 'Împins la piept cu haltera')
  category: ExerciseCategory;    // Main category
  muscleGroup: MuscleGroup;       // Primary muscle group
  secondaryMuscles?: MuscleGroup[]; // Secondary muscles worked
  
  // Technical Details
  equipment: Equipment[];         // Required equipment (can have multiple)
  difficulty: DifficultyLevel;   // Difficulty level
  
  // Instructions & Guidance
  instructions: string[];        // Step-by-step instructions (array of strings)
  tips: string[];                 // Tips & tricks for proper form
  mistakes?: string[];            // Common mistakes to avoid
  
  // Media
  imageUrl?: string;             // Main image URL
  gifUrl?: string;                // Animated GIF URL
  videoUrl?: string;              // Tutorial video URL (YouTube embed)
  videoThumbnail?: string;        // Video thumbnail for preview
  videoDuration?: number;         // Video duration in seconds
  
  // Video Tutorial Timestamps (optional, for step-by-step video guidance)
  videoTimestamps?: {
    time: number;       // Time in seconds
    title: string;     // Step title
    description?: string; // Optional description
  }[];
  
  // Search & Discovery
  tags: string[];                 // Search tags (includes popular names in multiple languages)
  synonyms?: string[];            // Alternative names (e.g., 'bench press' = 'impins la piept')
  
  // Metadata
  language?: 'ro' | 'en';        // Language of the exercise
  isVerified?: boolean;          // Verified by admin/expert
  createdAt?: Date;              // Creation timestamp
  updatedAt?: Date;              // Last update timestamp
  createdBy?: string;            // User ID who added it
  
  // Statistics
  popularityScore?: number;      // For sorting/ranking exercises
  completionRate?: number;       // How often users complete this exercise
}

/**
 * Exercise Variation Interface
 * Sub-collection: exercises/{exerciseId}/variations
 */
export interface ExerciseVariation {
  id: string;
  name: string;                  // e.g., 'Cu priză largă', 'Inclinat'
  slug: string;
  instructions: string[];
  tips?: string[];
  imageUrl?: string;
}

/**
 * Exercise Set/Rep Scheme
 * For workout generation
 */
export interface ExerciseScheme {
  exerciseId: string;
  exerciseSlug: string;
  sets: number;
  reps: string;                  // e.g., "8-12" or "15" or "45 sec"
  rest: number;                  // Rest in seconds
  tempo?: string;                // e.g., "2-0-2" (down-pause-up)
  notes?: string;                // Special instructions
}

/**
 * Example JSON Documents for Firestore
 */

// Example 1: Basic strength exercise
export const exampleExerciseJSON = {
  "id": "ex_001",
  "slug": "impins-la-piept-cu-haltera",
  "name": "Împins la piept cu haltera",
  "category": "Sala",
  "muscleGroup": "Piept",
  "secondaryMuscles": ["Triceps", "Umeri"],
  "equipment": ["Halteră", "Bancă"],
  "difficulty": "Intermediate",
  "instructions": [
    "Așază-te pe bancă cu picioarele pe podea",
    "Ține haltera cu priză mai largă decât umerii",
    "Lasă haltera în jos până la piept, cu coatele la 45 grade",
    "Împinge haltera înapoi sus, fără a bloca coatele",
    "Repetă pentru numărul de repetări dorit"
  ],
  "tips": [
    "Păstrează coatele la un unghi de 45 grade pentru a proteja umerii",
    "Nu lăsa haltera să cadă pe piept - controlează mișcarea",
    "Ține scărița sub picioare pentru stabilitate",
    "Nu roti încheieturile în timpul mișcării"
  ],
  "mistakes": [
    "Ridicarea picioarelor de pe podea",
    "Coate foarte depărtate (90 grade)",
    "Mișcare prea rapidă fără control",
    "Arcuierea excesivă a spatelui"
  ],
  "imageUrl": "https://example.com/images/bench-press.jpg",
  "gifUrl": "https://example.com/gifs/bench-press.gif",
  "tags": [
    "bench press",
    "piept",
    "împins",
    "halteră",
    "sala",
    "forță",
    "pectoralis",
    "chest press"
  ],
  "synonyms": [
    "Bench Press",
    "Împins culcat",
    "Presă la piept"
  ],
  "language": "ro",
  "isVerified": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-03-20T14:45:00Z",
  "popularityScore": 95
};

// Example 2: Bodyweight exercise (home)
export const exampleBodyweightExercise = {
  "id": "ex_002",
  "slug": "flotari-standard",
  "name": "Flotări standard",
  "category": "Acasa",
  "muscleGroup": "Piept",
  "secondaryMuscles": ["Triceps", "Abdomen", "Umeri"],
  "equipment": ["Greutate corporală"],
  "difficulty": "Beginner",
  "instructions": [
    "Începe în poziție de plank, mâinile la lățimea umerilor",
    "Coboară corpul până când pieptul aproape atinge podeaua",
    "Menține corpul în linie dreaptă",
    "Împinge înapoi în poziția de start",
    "Repetă fără a lăsa șoldurile să coboare"
  ],
  "tips": [
    "Nu lăsa șoldurile să cadă",
    "Ține mușchii abdominali contractați",
    "Privește în jos pentru a menține gâtul neutru",
    "Mișcare lentă și controlată"
  ],
  "mistakes": [
    "Șolduri coborâte",
    "Coate foarte depărtate",
    "Mișcare rapidă fără control",
    "Capul ridicat"
  ],
  "imageUrl": "https://example.com/images/pushup.jpg",
  "tags": [
    "flotări",
    "push ups",
    "piept",
    "acasă",
    "greutate corporală",
    "începător",
    "bodyweight"
  ],
  "language": "ro",
  "isVerified": true,
  "popularityScore": 98
};

// Example 3: Stretching exercise
export const exampleStretchingExercise = {
  "id": "ex_003",
  "slug": "stretching-piept-usor",
  "name": "Stretching Piept - Ușor",
  "category": "Stretching",
  "muscleGroup": "Piept",
  "secondaryMuscles": ["Umeri"],
  "equipment": ["Niciunul"],
  "difficulty": "Beginner",
  "instructions": [
    "Stai drept, cu picioarele la lățimea umerilor",
    "Împreunează mâinile în spatele spatelui",
    "Ridică ușor brațele și deschide pieptul",
    "Ține poziția 20-30 de secunde",
    "Respiră adânc și relaxează"
  ],
  "tips": [
    "Nu forța mișcarea dacă simți durere",
    "Menține umerii relaxați",
    "Respiră ritmic și adânc"
  ],
  "imageUrl": "https://example.com/images/chest-stretch.jpg",
  "tags": [
    "stretching",
    "întindere",
    "piept",
    "mobilitate",
    "recuperare",
    "stretch"
  ],
  "language": "ro",
  "isVerified": true,
  "popularityScore": 75
};

// Export all examples as array
export const exampleExercises = [
  exampleExerciseJSON,
  exampleBodyweightExercise,
  exampleStretchingExercise
];
