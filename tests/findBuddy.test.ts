import test from "node:test";
import assert from "node:assert/strict";
import { buildProfileDocument, createEmptyProfileForm } from "../lib/profile";
import {
  buildFindBuddyRecommendations,
  canUserJoinSlot,
  filterFindBuddySlots,
  type FindBuddySlot,
} from "../lib/findBuddy";

function buildProfile(overrides: Partial<ReturnType<typeof buildProfileDocument>> = {}) {
  return {
    ...buildProfileDocument({
      ...createEmptyProfileForm(),
      firstName: "Matei",
      lastName: "Tester",
      birthDate: "1998-03-14",
      gender: "male",
      sex: "male",
      height: "182",
      weight: "84",
      city: "Bucharest",
      education: "University",
      occupation: "Engineer",
      medicalConditions: ["none"],
      experienceLevel: "intermediate",
      activityLevel: "active",
      goals: ["muscle-gain", "strength"],
      priorityGoal: "muscle-gain",
      motivationType: "performance",
      preferredSports: ["gym", "running", "football"],
      trainingEnvironment: "gym",
      homeEquipment: ["dumbbells"],
      daysPerWeek: "4",
      workoutDuration: "60",
      sleepHours: "7.5",
      stressLevel: "medium",
      dailySteps: "9000",
      dietaryPreference: "high-protein",
      foodAllergies: ["none"],
      foodsToAvoid: ["none"],
      mealsPerDay: "4",
      waterIntakeLiters: "3",
      supplements: ["creatine"],
    }),
    ...overrides,
  };
}

function buildSlot(overrides: Partial<FindBuddySlot> = {}): FindBuddySlot {
  const dateTime = new Date(Date.now() + 1000 * 60 * 60 * 24);

  return {
    id: "slot-1",
    hostId: "host-1",
    hostName: "Alex Host",
    hostExperienceLevel: "intermediate",
    hostGoals: ["strength"],
    hostGender: "male",
    sportType: "gym",
    city: "Bucharest",
    dateTime,
    duration: 60,
    maxParticipants: 2,
    participants: ["host-1"],
    participantNames: ["Alex Host"],
    genderPreference: "anyone",
    location: {
      name: "World Class",
      isPaid: false,
      price: null,
      priceNote: null,
    },
    status: "open",
    description: "Morning session",
    createdAt: dateTime,
    updatedAt: dateTime,
    ...overrides,
  };
}

test("filterFindBuddySlots supports city, mode, search and open spots", () => {
  const slots = [
    buildSlot(),
    buildSlot({
      id: "slot-2",
      sportType: "football",
      city: "Cluj",
      maxParticipants: 4,
      participants: ["host-2", "u1", "u2", "u3"],
      participantNames: ["Bogdan", "u1", "u2", "u3"],
      hostId: "host-2",
      hostName: "Bogdan Host",
      location: { name: "Arena", isPaid: false, price: null, priceNote: null },
    }),
    buildSlot({
      id: "slot-3",
      sportType: "running",
      city: "Bucharest",
      maxParticipants: 4,
      participants: ["host-3", "u1"],
      participantNames: ["Cristi", "u1"],
      hostId: "host-3",
      hostName: "Cristi Host",
      location: { name: "Herastrau", isPaid: false, price: null, priceNote: null },
    }),
  ];

  const filtered = filterFindBuddySlots(slots, {
    searchQuery: "hera",
    sportType: "all",
    city: "Bucharest",
    mode: "group",
    onlyOpen: true,
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.id, "slot-3");
});

test("canUserJoinSlot requires a complete compatible profile", () => {
  const maleProfile = buildProfile();
  const incompleteProfile = { ...maleProfile, goals: [] };
  const femaleProfile = buildProfile({ gender: "female" });
  const slot = buildSlot({ genderPreference: "M" });

  assert.equal(canUserJoinSlot(slot, "user-1", maleProfile), true);
  assert.equal(canUserJoinSlot(slot, "user-1", incompleteProfile), false);
  assert.equal(canUserJoinSlot(slot, "user-1", femaleProfile), false);
});

test("buildFindBuddyRecommendations groups slots by host and ranks best match first", () => {
  const profile = buildProfile();
  const slots = [
    buildSlot({
      id: "slot-a1",
      hostId: "host-a",
      hostName: "Andrei Pop",
      sportType: "gym",
      hostGoals: ["muscle-gain", "strength"],
    }),
    buildSlot({
      id: "slot-a2",
      hostId: "host-a",
      hostName: "Andrei Pop",
      sportType: "running",
      hostGoals: ["strength"],
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 48),
    }),
    buildSlot({
      id: "slot-b1",
      hostId: "host-b",
      hostName: "Sorin Ionescu",
      sportType: "tennis",
      city: "Cluj",
      hostExperienceLevel: "beginner",
      hostGoals: ["mobility"],
    }),
  ];

  const recommendations = buildFindBuddyRecommendations(slots, "user-1", profile);

  assert.equal(recommendations.length, 2);
  assert.equal(recommendations[0]?.hostId, "host-a");
  assert.equal(recommendations[0]?.availableSlots, 2);
  assert.deepEqual(recommendations[0]?.sports, ["gym", "running"]);
  assert.deepEqual(recommendations[0]?.slotIds, ["slot-a1", "slot-a2"]);
  assert.ok((recommendations[0]?.matchScore || 0) > (recommendations[1]?.matchScore || 0));
});
