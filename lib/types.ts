/**
 * Ethos - User Profile Types
 * 
 * TypeScript definitions for user profiles and related data.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Firestore } from "firebase/firestore";

// ==================== Medical Conditions ====================

export type MedicalCondition = 
  | "obesity"        // Obezitate
  | "anorexia"        // Anorexie  
  | "anemia"          // Anemie
  | "none";          // Niciuna

// Recommended workout modifications based on medical conditions
export const medicalConditionRecommendations: Record<MedicalCondition, {
  maxIntensity: "low" | "medium" | "high";
  restTimeMultiplier: number;
  avoidExercises: string[];
  recommendations: string[];
}> = {
  obesity: {
    maxIntensity: "medium",
    restTimeMultiplier: 1.5,
    avoidExercises: ["jumping_jacks", "burpees", "high_jumps"],
    recommendations: [
      "Start with low impact exercises",
      "Focus on longer rest periods",
      "Include more cardio intervals",
      "Avoid high-impact jumping exercises"
    ]
  },
  anorexia: {
    maxIntensity: "low",
    restTimeMultiplier: 2.0,
    avoidExercises: ["extreme_cardio", "high_intensity_intervals"],
    recommendations: [
      "Focus on strength training with light weights",
      "Include longer rest periods",
      "Avoid excessive cardio",
      "Prioritize proper nutrition guidance"
    ]
  },
  anemia: {
    maxIntensity: "medium",
    restTimeMultiplier: 1.75,
    avoidExercises: ["prolonged_standing", "heavy_lifting", "high_intensity"],
    recommendations: [
      "Avoid extreme intensity without breaks",
      "Include longer rest periods between sets",
      "Don't recommend exercises that cause dizziness",
      "Focus on controlled movements"
    ]
  },
  none: {
    maxIntensity: "high",
    restTimeMultiplier: 1.0,
    avoidExercises: [],
    recommendations: [
      "All exercise types are suitable",
      "Standard rest periods apply"
    ]
  }
};

// ==================== Preferred Sports ====================

export type PreferredSport = 
  | "gym"           // Sala
  | "ping_pong"     // Ping Pong
  | "football"      // Fotbal
  | "tennis"        // Tenis
  | "swimming"     // Înot
  | "running"       // Alergat
  | "cycling"       // Ciclism
  | "basketball"    // Baschet
  | "volleyball"    // Volei
  | "yoga"          // Yoga
  | "dancing"       // Dans
  | "martial_arts"; // Arte marțiale

export const preferredSportsList: { value: PreferredSport; label: string; emoji: string }[] = [
  { value: "gym", label: "Sala", emoji: "🏋️" },
  { value: "ping_pong", label: "Ping Pong", emoji: "🏓" },
  { value: "football", label: "Fotbal", emoji: "⚽" },
  { value: "tennis", label: "Tenis", emoji: "🎾" },
  { value: "swimming", label: "Înot", emoji: "🏊" },
  { value: "running", label: "Alergat", emoji: "🏃" },
  { value: "cycling", label: "Ciclism", emoji: "🚴" },
  { value: "basketball", label: "Baschet", emoji: "🏀" },
  { value: "volleyball", label: "Volei", emoji: "🏐" },
  { value: "yoga", label: "Yoga", emoji: "🧘" },
  { value: "dancing", label: "Dans", emoji: "💃" },
  { value: "martial_arts", label: "Arte Marțiale", emoji: "🥋" },
];

// ==================== Medical Conditions List ====================

export const medicalConditionsList: { value: MedicalCondition; label: string; description: string }[] = [
  { value: "none", label: "Niciuna", description: "Nu am nicio afecțiune medicală" },
  { value: "obesity", label: "Obezitate", description: "Indicele de masă corporală peste 30" },
  { value: "anorexia", label: "Anorexie", description: "Tulburare de alimentație" },
  { value: "anemia", label: "Anemie", description: "Nivel scăzut de fier în sânge" },
];

// ==================== User Profile ====================

export interface UserProfile {
  // Personal Info
  id?: string;
  birthDate: string;          // ISO string (YYYY-MM-DD)
  gender: "male" | "female" | "other";
  height: number;             // cm
  weight: number;             // kg
  
  // Medical & Health
  medicalConditions: MedicalCondition[];
  
  // Sports Preferences
  preferredSports: PreferredSport[];
  
  // Fitness Experience
  experienceLevel: "beginner" | "intermediate" | "advanced";
  trainsRegularly: boolean;
  
  // Goals
  goals: string[];
  priorityGoal: string;
  
  // Training Environment
  trainingEnvironment: "gym" | "home" | "outdoor";
  homeEquipment: string[];
  
  // Time Availability
  daysPerWeek: number;
  workoutDuration: number;     // minutes
  
  // Limitations
  injuries: string[];
  
  // Physical Condition
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  
  // Lifestyle
  sleepHours: number;
  stressLevel: "low" | "medium" | "high";
  dailySteps: number;
  
  // Motivation
  motivationType: string;
  
  // Basic Info
  city: string;
  lookingForBuddy: boolean;
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  onboardingComplete?: boolean;
}

// ==================== Helper Functions ====================

/**
 * Calculate age from birthDate ISO string
 */
export function calculateAge(birthDateString: string): number {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birthday hasn't occurred yet this year, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get workout recommendations based on medical conditions
 */
export function getWorkoutRecommendations(conditions: MedicalCondition[]): {
  maxIntensity: "low" | "medium" | "high";
  restTimeMultiplier: number;
  avoidExercises: string[];
  recommendations: string[];
} {
  // If no conditions, return default
  if (conditions.length === 0 || conditions.includes("none")) {
    return medicalConditionRecommendations["none"];
  }
  
  // Find the most restrictive recommendation
  const priority: MedicalCondition[] = ["anorexia", "anemia", "obesity", "none"];
  
  for (const condition of priority) {
    if (conditions.includes(condition)) {
      return medicalConditionRecommendations[condition];
    }
  }
  
  return medicalConditionRecommendations["none"];
}

/**
 * Get BMI from height (cm) and weight (kg)
 */
export function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): {
  category: string;
  color: string;
} {
  if (bmi < 18.5) return { category: "Subponderal", color: "text-blue-500" };
  if (bmi < 25) return { category: "Normal", color: "text-green-500" };
  if (bmi < 30) return { category: "Supraponderal", color: "text-yellow-500" };
  return { category: "Obez", color: "text-red-500" };
}

// ==================== Firestore Collection Types ====================

export interface FirestoreUser {
  // Stored as ISO string in Firestore
  birthDate: string;
  // Stored as derived value for queries
  age: number;
  gender: string;
  height: number;
  weight: number;
  bmi: number;
  medicalConditions: string[];
  preferredSports: string[];
  experienceLevel: string;
  trainsRegularly: boolean;
  goals: string[];
  priorityGoal: string;
  trainingEnvironment: string;
  homeEquipment: string[];
  daysPerWeek: number;
  workoutDuration: number;
  injuries: string[];
  activityLevel: string;
  sleepHours: number;
  stressLevel: string;
  dailySteps: number;
  motivationType: string;
  city: string;
  lookingForBuddy: boolean;
  createdAt: Date;
  updatedAt: Date;
  onboardingComplete: boolean;
}

// ==================== Buddy Matching Types ====================

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface TimeSlot {
  day: DayOfWeek;
  startHour: number; // 0-23
  endHour: number;   // 0-23
}

export interface UserAvailability {
  slots: TimeSlot[];
}

export interface BuddyProfile {
  userId: string;
  displayName: string;
  age: number;
  city: string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  goals: string[];
  preferredSports: PreferredSport[];
  availability: UserAvailability;
  lookingForBuddy: boolean;
  createdAt: Date;
}

export interface Venue {
  id: string;
  name: string;
  sport: PreferredSport[];
  city: string;
  type: "free" | "paid";
  address: string;
  pricePerHour?: number;
  priceNote?: string;
  rating?: number;
  facilities?: string[];
}

export interface MatchResult {
  userId: string;
  displayName: string;
  age: number;
  city: string;
  experienceLevel: string;
  goals: string[];
  sports: PreferredSport[];
  availability: TimeSlot[];
  matchScore: number;
  overlapHours: number;
}

// ==================== Venue Database ====================

export const venuesDatabase: Venue[] = [
  // Bucharest - Free
  { id: "1", name: "Parcul Herăstrău", sport: ["running", "cycling", "yoga"], city: "Bucharest", type: "free", address: "Herăstrău Park", facilities: ["track", "bike lanes"] },
  { id: "2", name: "Parcul Titan", sport: ["football", "basketball", "running"], city: "Bucharest", type: "free", address: "Titan Park", facilities: ["football field", "basketball court"] },
  { id: "3", name: "Tei Park", sport: ["running", "football"], city: "Bucharest", type: "free", address: "Tei Lake Area", facilities: ["football field"] },
  { id: "4", name: "Circului Park", sport: ["basketball", "running"], city: "Bucharest", type: "free", address: "Circului Park", facilities: ["basketball court"] },
  
  // Bucharest - Paid
  { id: "5", name: "World Class Romania", sport: ["gym", "swimming", "tennis"], city: "Bucharest", type: "paid", address: "Various locations", priceNote: "Abonament necesar - de la 199 RON/lună" },
  { id: "6", name: "Fit Studio", sport: ["gym"], city: "Bucharest", type: "paid", address: "Sector 1", pricePerHour: 50, priceNote: "50 RON/oră drop-in" },
  { id: "7", name: "Aqua World", sport: ["swimming"], city: "Bucharest", type: "paid", address: "Băneasa", pricePerHour: 40, priceNote: "40 RON/oră" },
  { id: "8", name: "Clubul Sportiv Titan", sport: ["swimming", "basketball", "tennis"], city: "Bucharest", type: "paid", address: "Titan", pricePerHour: 35, priceNote: "35 RON/oră" },
  
  // Cluj - Free
  { id: "9", name: "Parcul Central", sport: ["running", "yoga", "cycling"], city: "Cluj-Napoca", type: "free", address: "Central Park", facilities: ["track"] },
  { id: "10", name: "Someșul Rece", sport: ["running", "cycling"], city: "Cluj-Napoca", type: "free", address: "River bank", facilities: ["bike lanes"] },
  
  // Cluj - Paid
  { id: "11", name: "FitZone Cluj", sport: ["gym", "martial_arts"], city: "Cluj-Napoca", type: "paid", address: "Centru", pricePerHour: 45, priceNote: "45 RON/oră" },
  { id: "12", name: "S piscine Cluj", sport: ["swimming"], city: "Cluj-Napoca", type: "paid", address: "Someș", pricePerHour: 38, priceNote: "38 RON/oră" },
  
  // Timișoara - Free
  { id: "13", name: "Parcul Roses", sport: ["running", "tennis"], city: "Timișoara", type: "free", address: "Roses Park", facilities: ["tennis court"] },
  { id: "14", name: "Pădurea Bega", sport: ["running", "cycling"], city: "Timișoara", type: "free", address: "Bega Forest", facilities: ["trails"] },
  
  // Timișoara - Paid
  { id: "15", name: "Gym Zone Timișoara", sport: ["gym"], city: "Timișoara", type: "paid", address: "Centru", pricePerHour: 40, priceNote: "40 RON/oră" },
  
  // Iași - Free
  { id: "16", name: "Parcul Copou", sport: ["running", "basketball"], city: "Iași", type: "free", address: "Copou", facilities: ["basketball court"] },
  { id: "17", name: "Circului Park Iași", sport: ["football"], city: "Iași", type: "free", address: "Circului", facilities: ["football field"] },
  
  // Iași - Paid
  { id: "18", name: "Fit Style Iași", sport: ["gym", "swimming"], city: "Iași", type: "paid", address: "Copou", pricePerHour: 35, priceNote: "35 RON/oră" },
  
  // Constanța - Free
  { id: "19", name: "Faleza Nord", sport: ["running", "cycling"], city: "Constanța", type: "free", address: "Sea front", facilities: ["promenade"] },
  { id: "20", name: "City Park", sport: ["football", "basketball"], city: "Constanța", type: "free", address: "City Park", facilities: ["football field", "basketball court"] },
];

/**
 * Get venues by city and sport
 */
export function getVenuesByCityAndSport(city: string, sports: PreferredSport[]): Venue[] {
  return venuesDatabase.filter(v => 
    v.city.toLowerCase() === city.toLowerCase() &&
    v.sport.some(s => sports.includes(s))
  );
}

/**
 * Calculate overlap between two time slots
 */
function calculateSlotOverlap(slot1: TimeSlot, slot2: TimeSlot): number {
  if (slot1.day !== slot2.day) return 0;
  
  const overlapStart = Math.max(slot1.startHour, slot2.startHour);
  const overlapEnd = Math.min(slot1.endHour, slot2.endHour);
  
  return Math.max(0, overlapEnd - overlapStart);
}

/**
 * Calculate total overlapping hours between two availability schedules
 */
export function calculateAvailabilityOverlap(
  availability1: UserAvailability, 
  availability2: UserAvailability
): number {
  let totalOverlap = 0;
  
  for (const slot1 of availability1.slots) {
    for (const slot2 of availability2.slots) {
      totalOverlap += calculateSlotOverlap(slot1, slot2);
    }
  }
  
  return totalOverlap;
}

/**
 * Check if two users have sufficient time overlap for matching
 */
export function hasSufficientTimeOverlap(
  availability1: UserAvailability,
  availability2: UserAvailability,
  minimumHours: number = 1
): boolean {
  return calculateAvailabilityOverlap(availability1, availability2) >= minimumHours;
}

// ==================== Sport Events (Find a Buddy) ====================

export type SportType = 
  | "gym" 
  | "ping_pong" 
  | "football" 
  | "tennis" 
  | "swimming" 
  | "running" 
  | "cycling" 
  | "basketball" 
  | "volleyball" 
  | "yoga" 
  | "dancing" 
  | "martial_arts";

export type GenderPreference = "M" | "F" | "anyone";

export interface SportEvent {
  id: string;
  creatorId: string;
  creatorName: string;
  sportType: SportType;
  intensity?: SportIntensity; // Optional - defaults based on sport type
  city: string;
  genderPreference: GenderPreference;
  startTime: Date;
  endTime: Date;
  locationName: string;
  locationAddress?: string;
  isPaid: boolean;
  price?: number; // RON per person
  priceNote?: string;
  maxParticipants: number;
  joinedUsers: string[]; // Array of user IDs
  description?: string;
  status: "open" | "full" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface EventChatMessage {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: Date;
}

// Sport event labels
export const sportTypeLabels: Record<SportType, { label: string; emoji: string }> = {
  gym: { label: "Sala", emoji: "🏋️" },
  ping_pong: { label: "Ping Pong", emoji: "🏓" },
  football: { label: "Fotbal", emoji: "⚽" },
  tennis: { label: "Tenis", emoji: "🎾" },
  swimming: { label: "Înot", emoji: "🏊" },
  running: { label: "Alergat", emoji: "🏃" },
  cycling: { label: "Ciclism", emoji: "🚴" },
  basketball: { label: "Baschet", emoji: "🏀" },
  volleyball: { label: "Volei", emoji: "🏐" },
  yoga: { label: "Yoga", emoji: "🧘" },
  dancing: { label: "Dans", emoji: "💃" },
  martial_arts: { label: "Arte Marțiale", emoji: "🥋" },
};

export const genderPreferenceLabels: Record<GenderPreference, string> = {
  M: "Doar Bărbați",
  F: "Doar Femei",
  anyone: "Oricine",
};

// ==================== Sport Intensity ====================

export type SportIntensity = "low" | "medium" | "high";

// Map sport types to their intensity levels
export const sportIntensityMap: Record<SportType, SportIntensity> = {
  gym: "medium",
  ping_pong: "low",
  football: "high",
  tennis: "medium",
  swimming: "medium",
  running: "high",
  cycling: "medium",
  basketball: "high",
  volleyball: "medium",
  yoga: "low",
  dancing: "medium",
  martial_arts: "high",
};

// Medical conditions that are risky for high intensity sports
const riskyConditionsForHighIntensity: MedicalCondition[] = ["obesity", "anemia", "anorexia"];

// Medical conditions that are risky for medium+ intensity sports
const riskyConditionsForMediumIntensity: MedicalCondition[] = ["anorexia", "anemia"];

/**
 * Check if a sport is safe for user's medical conditions
 * Returns warning message if not safe, null if safe
 */
export function checkSportMedicalCompatibility(
  sportType: SportIntensity,
  medicalConditions: MedicalCondition[]
): { isSafe: boolean; warning?: string } {
  // If no medical conditions or "none", it's safe
  const conditions = medicalConditions.filter(c => c !== "none");
  
  if (conditions.length === 0) {
    return { isSafe: true };
  }
  
  // Check high intensity sports
  if (sportType === "high") {
    const hasRiskyCondition = conditions.some(c => riskyConditionsForHighIntensity.includes(c));
    if (hasRiskyCondition) {
      const conditionNames = conditions
        .filter(c => riskyConditionsForHighIntensity.includes(c))
        .map(c => {
          const found = medicalConditionsList.find(m => m.value === c);
          return found?.label || c;
        })
        .join(", ");
      
      return {
        isSafe: false,
        warning: `Atenție! ${conditionNames} poate fi riscant la efort intens. Te rugăm să consulți un medic.`
      };
    }
  }
  
  // Check medium intensity for anorexia/anemia
  if (sportType === "medium") {
    const hasRiskyCondition = conditions.some(c => riskyConditionsForMediumIntensity.includes(c));
    if (hasRiskyCondition) {
      const conditionNames = conditions
        .filter(c => riskyConditionsForMediumIntensity.includes(c))
        .map(c => {
          const found = medicalConditionsList.find(m => m.value === c);
          return found?.label || c;
        })
        .join(", ");
      
      return {
        isSafe: false,
        warning: `Atenție! ${conditionNames} necesită atenție la efort mediu-intens. Consultă un medic înainte.`
      };
    }
  }
  
  return { isSafe: true };
}

/**
 * Calculate average age from array of birth dates
 */
export function calculateAverageAge(birthDates: string[]): number {
  if (birthDates.length === 0) return 0;
  
  const totalAge = birthDates.reduce((sum, birthDate) => {
    const age = calculateAge(birthDate);
    return sum + (isNaN(age) ? 0 : age);
  }, 0);
  
  return Math.round(totalAge / birthDates.length);
}

// ==================== Availability Slots (Find a Buddy) ====================

export type SlotStatus = "open" | "matched" | "closed" | "cancelled";

export interface AvailabilitySlot {
  id?: string;
  hostId: string;
  hostName: string;
  sportType: SportType;
  city: string;
  dateTime: Date;          // Start timestamp
  duration: number;         // Minutes
  maxParticipants: number;   // Max buddies that can join (default 1)
  participants: string[];   // Array of user IDs who joined
  genderPreference: GenderPreference;
  location: {
    name: string;
    address?: string;
    isPaid: boolean;
    price?: number | null;         // RON per person
    priceNote?: string | null;
  };
  status: SlotStatus;
  description?: string;
  matchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new availability slot
 */
export async function createAvailabilitySlot(
  db: Firestore,
  slotData: Omit<AvailabilitySlot, "id" | "createdAt" | "updatedAt" | "status" | "buddyId">
): Promise<string> {
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
  
  const docRef = await addDoc(collection(db, "availability_slots"), {
    ...slotData,
    status: "open",
    buddyId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
}

/**
 * Join an availability slot (becoming the buddy)
 */
export async function joinAvailabilitySlot(
  db: Firestore,
  slotId: string,
  buddyId: string
): Promise<void> {
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  
  await updateDoc(doc(db, "availability_slots", slotId), {
    buddyId: buddyId,
    status: "matched",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Leave an availability slot
 */
export async function leaveAvailabilitySlot(
  db: Firestore,
  slotId: string
): Promise<void> {
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  
  await updateDoc(doc(db, "availability_slots", slotId), {
    buddyId: null,
    status: "open",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Create a chat for matched slot
 */
export async function createSlotChat(
  db: Firestore,
  slot: AvailabilitySlot,
  hostId: string,
  buddyId: string
): Promise<void> {
  const { doc, setDoc, serverTimestamp, collection } = await import("firebase/firestore");
  
  // Create a welcome message
  const chatRef = doc(db, `availability_slots/${slot.id}/chat`);
  await setDoc(chatRef, {
    slotId: slot.id,
    type: "system",
    content: `💬 Chat deschis pentru antrenamentul de ${sportTypeLabels[slot.sportType]?.label || slot.sportType} - ${slot.location.name}`,
    createdAt: serverTimestamp(),
  });
}

/**
 * Clean up expired slots (older than current time)
 */
export async function cleanupExpiredSlots(db: Firestore): Promise<number> {
  const { collection, getDocs, deleteDoc, doc, query, where } = await import("firebase/firestore");
  
  const now = new Date();
  // Query slots where dateTime is less than now
  const expiredQuery = query(
    collection(db, "availability_slots"),
    where("dateTime", "<=", now)
  );
  
  const snapshot = await getDocs(expiredQuery);
  let deletedCount = 0;
  
  for (const docSnap of snapshot.docs) {
    try {
      await deleteDoc(doc(db, "availability_slots", docSnap.id));
      deletedCount++;
    } catch (err) {
      console.error("Error deleting slot:", err);
    }
  }
  
  return deletedCount;
}
