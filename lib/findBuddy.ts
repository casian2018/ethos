import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { profileNeedsOnboarding, type DetailedUserProfile } from "./profile";
import {
  genderPreferenceLabels,
  sportTypeLabels,
  type GenderPreference,
  type SlotStatus,
  type SportType,
} from "./types";

export interface FindBuddySlot {
  id: string;
  hostId: string;
  hostName: string;
  hostExperienceLevel?: string;
  hostGoals: string[];
  hostGender?: string;
  hostAvatarUrl?: string;
  sportType: SportType;
  city: string;
  dateTime: Date;
  duration: number;
  maxParticipants: number;
  participants: string[];
  participantNames: string[];
  genderPreference: GenderPreference;
  location: {
    name: string;
    address?: string;
    isPaid: boolean;
    price?: number | null;
    priceNote?: string | null;
  };
  status: SlotStatus;
  description?: string;
  matchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindBuddyRecommendation {
  hostId: string;
  hostName: string;
  city: string;
  sports: SportType[];
  goals: string[];
  level: string;
  availableSlots: number;
  nextAvailableAt: Date | null;
  matchScore: number;
  slotIds: string[];
  avatarUrl?: string;
}

export interface FindBuddyFilters {
  searchQuery: string;
  sportType: "all" | SportType;
  city: string;
  mode: "all" | "duo" | "group";
  onlyOpen: boolean;
}

const englishSportLabels: Record<SportType, string> = {
  gym: "Gym",
  ping_pong: "Ping Pong",
  football: "Football",
  tennis: "Tennis",
  swimming: "Swimming",
  running: "Running",
  cycling: "Cycling",
  basketball: "Basketball",
  volleyball: "Volleyball",
  yoga: "Yoga",
  dancing: "Dancing",
  martial_arts: "Martial arts",
  padel: "Padel",
  badminton: "Badminton",
  hiking: "Hiking",
  calisthenics: "Calisthenics",
  pickleball: "Pickleball",
  climbing: "Climbing",
  rowing: "Rowing",
  skating: "Skating",
};

function parseDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function experienceToNumber(level?: string): number {
  switch (level) {
    case "advanced":
      return 3;
    case "intermediate":
      return 2;
    default:
      return 1;
  }
}

function arrayOverlapScore(currentValues: string[] = [], candidateValues: string[] = []): number {
  if (currentValues.length === 0 || candidateValues.length === 0) {
    return 0;
  }

  const currentSet = new Set(currentValues);
  const overlap = candidateValues.filter((value) => currentSet.has(value)).length;
  return overlap * 6;
}

export function normalizeFindBuddySlot(id: string, data: Record<string, unknown>): FindBuddySlot {
  return {
    id,
    hostId: String(data.hostId || ""),
    hostName: String(data.hostName || "Host"),
    hostExperienceLevel: typeof data.hostExperienceLevel === "string" ? data.hostExperienceLevel : undefined,
    hostGoals: Array.isArray(data.hostGoals) ? data.hostGoals.map((goal) => String(goal)) : [],
    hostGender: typeof data.hostGender === "string" ? data.hostGender : undefined,
    hostAvatarUrl: typeof data.hostAvatarUrl === "string" ? data.hostAvatarUrl : undefined,
    sportType: String(data.sportType || "gym") as SportType,
    city: String(data.city || ""),
    dateTime: parseDate(data.dateTime),
    duration: typeof data.duration === "number" ? data.duration : 60,
    maxParticipants: typeof data.maxParticipants === "number" ? data.maxParticipants : 2,
    participants: Array.isArray(data.participants) ? data.participants.map((participant) => String(participant)) : [],
    participantNames: Array.isArray(data.participantNames) ? data.participantNames.map((name) => String(name)) : [],
    genderPreference: String(data.genderPreference || "anyone") as GenderPreference,
    location: {
      name: typeof data.location === "object" && data.location && "name" in data.location ? String(data.location.name || "") : "",
      address: typeof data.location === "object" && data.location && "address" in data.location ? String(data.location.address || "") : "",
      isPaid: typeof data.location === "object" && data.location && "isPaid" in data.location ? Boolean(data.location.isPaid) : false,
      price: typeof data.location === "object" && data.location && "price" in data.location && typeof data.location.price === "number" ? data.location.price : null,
      priceNote: typeof data.location === "object" && data.location && "priceNote" in data.location ? String(data.location.priceNote || "") : null,
    },
    status: String(data.status || "open") as SlotStatus,
    description: typeof data.description === "string" ? data.description : "",
    matchedAt: data.matchedAt ? parseDate(data.matchedAt) : undefined,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
  };
}

export function isFutureSlot(slot: FindBuddySlot): boolean {
  return slot.dateTime.getTime() >= Date.now();
}

export function getOpenSpots(slot: FindBuddySlot): number {
  return Math.max(slot.maxParticipants - slot.participants.length, 0);
}

export function getRequestedBuddies(slot: FindBuddySlot): number {
  return Math.max(slot.maxParticipants - 1, 1);
}

export function getSlotMode(slot: FindBuddySlot): "duo" | "group" {
  return slot.maxParticipants <= 2 ? "duo" : "group";
}

export function getSlotModeLabel(slot: FindBuddySlot, language: "ro" | "en"): string {
  if (getSlotMode(slot) === "duo") {
    return language === "ro" ? "Cauți 1 partener" : "Looking for 1 buddy";
  }

  return language === "ro"
    ? `Cauți până la ${getRequestedBuddies(slot)} persoane`
    : `Looking for up to ${getRequestedBuddies(slot)} people`;
}

export function getGenderPreferenceLabel(preference: GenderPreference, language: "ro" | "en"): string {
  if (language === "ro") {
    return genderPreferenceLabels[preference];
  }

  if (preference === "M") {
    return "Men only";
  }
  if (preference === "F") {
    return "Women only";
  }
  return "Anyone";
}

export function getSportLabel(sportType: SportType, language: "ro" | "en" = "ro"): string {
  if (language === "en") {
    return englishSportLabels[sportType] || sportType;
  }

  return sportTypeLabels[sportType]?.label || sportType;
}

export function matchesGenderPreference(
  preference: GenderPreference,
  profile?: Pick<DetailedUserProfile, "gender"> | null
): boolean {
  if (preference === "anyone" || !profile) {
    return true;
  }

  if (preference === "M") {
    return profile.gender === "male";
  }

  if (preference === "F") {
    return profile.gender === "female";
  }

  return true;
}

export function canUserJoinSlot(
  slot: FindBuddySlot,
  userId: string,
  profile?: DetailedUserProfile | null
): boolean {
  if (!slot.id || !isFutureSlot(slot)) {
    return false;
  }

  if (slot.hostId === userId) {
    return false;
  }

  if (slot.participants.includes(userId)) {
    return false;
  }

  if (slot.status === "closed" || slot.status === "cancelled") {
    return false;
  }

  if (getOpenSpots(slot) <= 0) {
    return false;
  }

  if (!profile || profileNeedsOnboarding(profile)) {
    return false;
  }

  return matchesGenderPreference(slot.genderPreference, profile);
}

export function calculateSlotMatchScore(
  slot: FindBuddySlot,
  currentProfile?: DetailedUserProfile | null,
  hostProfile?: Partial<DetailedUserProfile> | null
): number {
  if (!currentProfile) {
    return 60;
  }

  if (!matchesGenderPreference(slot.genderPreference, currentProfile)) {
    return 0;
  }

  let score = 40;

  if (currentProfile.city && currentProfile.city.toLowerCase() === slot.city.toLowerCase()) {
    score += 18;
  }

  if (currentProfile.preferredSports.includes(slot.sportType)) {
    score += 20;
  }

  score += arrayOverlapScore(currentProfile.goals, slot.hostGoals || hostProfile?.goals || []);

  const slotDurationDelta = Math.abs(currentProfile.workoutDuration - slot.duration);
  if (slotDurationDelta <= 15) {
    score += 8;
  } else if (slotDurationDelta <= 30) {
    score += 4;
  }

  const hostExperience = hostProfile?.experienceLevel || slot.hostExperienceLevel;
  const experienceDelta = Math.abs(
    experienceToNumber(currentProfile.experienceLevel) - experienceToNumber(hostExperience)
  );
  if (experienceDelta === 0) {
    score += 10;
  } else if (experienceDelta === 1) {
    score += 6;
  } else {
    score += 2;
  }

  if (currentProfile.lookingForBuddy) {
    score += 4;
  }

  if (slot.location.isPaid === false) {
    score += 2;
  }

  return clamp(Math.round(score), 1, 99);
}

export function filterFindBuddySlots(
  slots: FindBuddySlot[],
  filters: FindBuddyFilters
): FindBuddySlot[] {
  return slots.filter((slot) => {
    if (filters.onlyOpen && getOpenSpots(slot) <= 0) {
      return false;
    }

    if (filters.sportType !== "all" && slot.sportType !== filters.sportType) {
      return false;
    }

    if (filters.city && slot.city.toLowerCase() !== filters.city.toLowerCase()) {
      return false;
    }

    if (filters.mode !== "all" && getSlotMode(slot) !== filters.mode) {
      return false;
    }

    const query = filters.searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [
      slot.hostName,
      slot.city,
      slot.location.name,
      slot.description || "",
      getSportLabel(slot.sportType),
    ].some((value) => value.toLowerCase().includes(query));
  });
}

export function buildFindBuddyRecommendations(
  slots: FindBuddySlot[],
  currentUserId: string,
  currentProfile?: DetailedUserProfile | null,
  hostProfiles?: Record<string, Partial<DetailedUserProfile>>
): FindBuddyRecommendation[] {
  const grouped = new Map<string, FindBuddyRecommendation>();

  for (const slot of slots) {
    if (slot.hostId === currentUserId || getOpenSpots(slot) <= 0) {
      continue;
    }

    const hostProfile = hostProfiles?.[slot.hostId];
    const matchScore = calculateSlotMatchScore(slot, currentProfile, hostProfile);
    if (matchScore <= 0) {
      continue;
    }

    const existing = grouped.get(slot.hostId);
    const nextDate = slot.dateTime;

    if (!existing) {
      grouped.set(slot.hostId, {
        hostId: slot.hostId,
        hostName: slot.hostName,
        city: slot.city,
        sports: [slot.sportType],
        goals: hostProfile?.goals || slot.hostGoals || [],
        level: hostProfile?.experienceLevel || slot.hostExperienceLevel || "beginner",
        availableSlots: 1,
        nextAvailableAt: nextDate,
        matchScore,
        slotIds: [slot.id],
        avatarUrl: slot.hostAvatarUrl,
      });
      continue;
    }

    existing.availableSlots += 1;
    if (!existing.sports.includes(slot.sportType)) {
      existing.sports.push(slot.sportType);
    }
    if (!existing.slotIds.includes(slot.id)) {
      existing.slotIds.push(slot.id);
    }
    if (!existing.nextAvailableAt || nextDate < existing.nextAvailableAt) {
      existing.nextAvailableAt = nextDate;
    }
    existing.matchScore = Math.max(existing.matchScore, matchScore);
  }

  return Array.from(grouped.values()).sort((left, right) => {
    if (right.matchScore !== left.matchScore) {
      return right.matchScore - left.matchScore;
    }

    return left.hostName.localeCompare(right.hostName);
  });
}

export async function createFindBuddySlot(
  db: Firestore,
  slotData: Omit<FindBuddySlot, "id" | "status" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, "availability_slots"), {
    ...slotData,
    participantNames: slotData.participantNames.length > 0 ? slotData.participantNames : [slotData.hostName],
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, `availability_slots/${docRef.id}/chat`), {
    type: "system",
    userId: "system",
    userName: "Ethos",
    content: `Slot creat pentru ${getSportLabel(slotData.sportType)} la ${slotData.location.name}.`,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function joinFindBuddySlot(
  db: Firestore,
  slotId: string,
  participant: {
    userId: string;
    userName: string;
    profile?: DetailedUserProfile | null;
  }
): Promise<FindBuddySlot> {
  const slotRef = doc(db, "availability_slots", slotId);

  const updatedSlot = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(slotRef);
    if (!snapshot.exists()) {
      throw new Error("Slotul nu mai există.");
    }

    const slot = normalizeFindBuddySlot(snapshot.id, snapshot.data() as Record<string, unknown>);

    if (!canUserJoinSlot(slot, participant.userId, participant.profile)) {
      throw new Error("Nu te poți alătura acestui slot.");
    }

    const nextParticipants = [...slot.participants, participant.userId];
    const nextParticipantNames = [...slot.participantNames, participant.userName];
    const nextOpenSpots = Math.max(slot.maxParticipants - nextParticipants.length, 0);
    const nextStatus: SlotStatus =
      nextOpenSpots <= 0 ? "closed" : nextParticipants.length > 1 ? "matched" : "open";

    transaction.update(slotRef, {
      participants: nextParticipants,
      participantNames: nextParticipantNames,
      status: nextStatus,
      matchedAt: nextParticipants.length > 1 ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });

    return {
      ...slot,
      participants: nextParticipants,
      participantNames: nextParticipantNames,
      status: nextStatus,
      matchedAt: nextParticipants.length > 1 ? new Date() : slot.matchedAt,
      updatedAt: new Date(),
    };
  });

  await addDoc(collection(db, `availability_slots/${slotId}/chat`), {
    type: "system",
    userId: participant.userId,
    userName: participant.userName,
    content: `${participant.userName} s-a alăturat sesiunii.`,
    createdAt: serverTimestamp(),
  });

  return updatedSlot;
}
