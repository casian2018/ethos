/**
 * Find a Buddy - Advanced Matchmaking System
 * 
 * Features:
 * - City-based filtering
 * - Availability time slot matching
 * - Sport selection
 * - Smart venue suggestions
 * 
 * Route: /dev/find_a_buddy
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  query, 
  getDocs,
  where,
  orderBy,
  limit,
  doc,
  getDoc
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import { 
  preferredSportsList, 
  PreferredSport,
  Venue,
  DayOfWeek,
  getVenuesByCityAndSport,
  calculateAvailabilityOverlap,
  UserAvailability,
  calculateAge
} from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

// Day labels
const days: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const dayLabels: Record<DayOfWeek, string> = {
  monday: "Luni",
  tuesday: "Marți", 
  wednesday: "Miercuri",
  thursday: "Joi",
  friday: "Vineri",
  saturday: "Sâmbătă",
  sunday: "Duminică",
};

interface BuddyUser {
  id: string;
  userId: string;
  displayName: string;
  age?: number;
  birthDate?: string;
  city: string;
  experienceLevel: string;
  goals: string[];
  preferredSports: string[];
  availability?: UserAvailability;
  lookingForBuddy: boolean;
  createdAt: Date;
}

export default function FindBuddyPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [_user, setUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<BuddyUser | null>(null);
  const [buddies, setBuddies] = useState<BuddyUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedSports, setSelectedSports] = useState<PreferredSport[]>([]);
  const [userAvailability, setUserAvailability] = useState<UserAvailability>({ slots: [] });
  
  // UI State
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState<BuddyUser | null>(null);
  const [suggestedVenues, setSuggestedVenues] = useState<Venue[]>([]);

  // Available cities from users
  const cities = useMemo(() => {
    const citySet = new Set(buddies.map(b => b.city).filter(Boolean));
    return Array.from(citySet);
  }, [buddies]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUser(currentUser);
      
      // Load current user profile
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          const profile: BuddyUser = {
            id: userDoc.id,
            userId: currentUser.uid,
            displayName: profileData.displayName || "Utilizator",
            age: profileData.age,
            birthDate: profileData.birthDate,
            city: profileData.city || "",
            experienceLevel: profileData.experienceLevel || "beginner",
            goals: profileData.goals || [],
            preferredSports: profileData.preferredSports || [],
            availability: profileData.availability || { slots: [] },
            lookingForBuddy: profileData.lookingForBuddy || false,
            createdAt: profileData.createdAt,
          };
          setCurrentUserProfile(profile);
          setSelectedCity(profile.city || "");
          setUserAvailability(profile.availability || { slots: [] });
          setSelectedSports(profile.preferredSports as PreferredSport[] || []);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
      
      loadBuddies(currentUser.uid);
    });
    
    return () => unsubscribe();
  }, [router]);

  const loadBuddies = async (currentUserId: string) => {
    try {
      // Load users looking for buddy
      const buddiesQuery = query(
        collection(db, "users"),
        where("lookingForBuddy", "==", true),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      
      const snapshot = await getDocs(buddiesQuery);
      const buddiesData: BuddyUser[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== currentUserId && data.lookingForBuddy) {
          // Calculate age from birthDate if available
          let age = data.age;
          if (!age && data.birthDate) {
            age = calculateAge(data.birthDate);
          }
          
          buddiesData.push({
            id: doc.id,
            userId: data.userId,
            displayName: data.displayName || "Utilizator",
            age,
            city: data.city || "",
            experienceLevel: data.experienceLevel || "beginner",
            goals: data.goals || [],
            preferredSports: data.preferredSports || [],
            availability: data.availability || { slots: [] },
            lookingForBuddy: data.lookingForBuddy,
            createdAt: data.createdAt,
          });
        }
      });
      
      setBuddies(buddiesData);
    } catch (err) {
      console.error("Error loading buddies:", err);
      // Demo data fallback
      setBuddies([
        {
          id: "1",
          userId: "demo1",
          displayName: "Alex M.",
          age: 28,
          city: "Bucharest",
          experienceLevel: "intermediate",
          goals: ["Strength", "Weight Loss"],
          preferredSports: ["gym", "running"],
          availability: {
            slots: [
              { day: "monday", startHour: 18, endHour: 20 },
              { day: "wednesday", startHour: 18, endHour: 20 },
              { day: "saturday", startHour: 10, endHour: 12 }
            ]
          },
          lookingForBuddy: true,
          createdAt: new Date(),
        },
        {
          id: "2",
          userId: "demo2",
          displayName: "Maria D.",
          age: 25,
          city: "Bucharest",
          experienceLevel: "beginner",
          goals: ["Fitness General"],
          preferredSports: ["yoga", "swimming"],
          availability: {
            slots: [
              { day: "tuesday", startHour: 19, endHour: 21 },
              { day: "saturday", startHour: 9, endHour: 11 },
              { day: "sunday", startHour: 10, endHour: 12 }
            ]
          },
          lookingForBuddy: true,
          createdAt: new Date(),
        },
        {
          id: "3",
          userId: "demo3",
          displayName: "Cristian P.",
          age: 32,
          city: "Cluj-Napoca",
          experienceLevel: "advanced",
          goals: ["Muscle Building", "Competition"],
          preferredSports: ["gym", "tennis"],
          availability: {
            slots: [
              { day: "monday", startHour: 17, endHour: 19 },
              { day: "friday", startHour: 18, endHour: 20 }
            ]
          },
          lookingForBuddy: true,
          createdAt: new Date(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter buddies based on selections
  const filteredBuddies = useMemo(() => {
    return buddies.filter(buddy => {
      // City filter
      if (selectedCity && buddy.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      
      // Sport filter - must have at least one matching sport
      if (selectedSports.length > 0) {
        const hasMatchingSport = selectedSports.some(sport => 
          buddy.preferredSports.includes(sport)
        );
        if (!hasMatchingSport) return false;
      }
      
      // Availability filter - must have at least 1 hour overlap
      if (userAvailability.slots.length > 0 && buddy.availability?.slots) {
        const overlap = calculateAvailabilityOverlap(userAvailability, buddy.availability);
        if (overlap < 1) return false;
      }
      
      return true;
    });
  }, [buddies, selectedCity, selectedSports, userAvailability]);

  // Calculate match score for a buddy
  const calculateMatchScore = (buddy: BuddyUser): number => {
    let score = 0;
    
    // Same city: +30 points
    if (buddy.city.toLowerCase() === currentUserProfile?.city?.toLowerCase()) {
      score += 30;
    }
    
    // Common sports: +20 points per matching sport (max 40)
    if (currentUserProfile?.preferredSports && buddy.preferredSports) {
      const commonSports = selectedSports.filter(sport => 
        buddy.preferredSports.includes(sport)
      );
      score += Math.min(commonSports.length * 20, 40);
    }
    
    // Availability overlap: +30 points
    if (currentUserProfile?.availability?.slots && buddy.availability?.slots) {
      const overlap = calculateAvailabilityOverlap(
        currentUserProfile.availability, 
        buddy.availability
      );
      if (overlap >= 3) score += 30;
      else if (overlap >= 2) score += 20;
      else if (overlap >= 1) score += 10;
    }
    
    return Math.min(score, 100);
  };

  // Get overlap hours with a buddy
  const getOverlapHours = (buddy: BuddyUser): number => {
    if (!currentUserProfile?.availability?.slots || !buddy.availability?.slots) return 0;
    return calculateAvailabilityOverlap(currentUserProfile.availability, buddy.availability);
  };

  // Show venue suggestions for a buddy
  const showVenueSuggestions = (buddy: BuddyUser) => {
    setSelectedBuddy(buddy);
    const commonSports = selectedSports.length > 0 
      ? selectedSports.filter(s => buddy.preferredSports.includes(s))
      : (buddy.preferredSports as PreferredSport[]);
    
    const venues = getVenuesByCityAndSport(buddy.city, commonSports);
    setSuggestedVenues(venues);
    setShowVenueModal(true);
  };

  // Add/remove time slot
  const toggleTimeSlot = (day: DayOfWeek, startHour: number, endHour: number) => {
    const existing = userAvailability.slots.findIndex(
      s => s.day === day && s.startHour === startHour
    );
    
    if (existing >= 0) {
      const newSlots = [...userAvailability.slots];
      newSlots.splice(existing, 1);
      setUserAvailability({ slots: newSlots });
    } else {
      setUserAvailability({ 
        slots: [...userAvailability.slots, { day, startHour, endHour }] 
      });
    }
  };

  const isSlotSelected = (day: DayOfWeek, startHour: number): boolean => {
    return userAvailability.slots.some(
      s => s.day === day && s.startHour === startHour
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {language === "ro" ? "Găsește un Partener" : "Find a Buddy"}
        </h1>
        <p className="text-zinc-500">
          {language === "ro" 
            ? "Conectează-te cu sportivi din orașul tău"
            : "Connect with athletes in your city"}
        </p>
      </header>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {language === "ro" ? "Oraș" : "City"}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="input"
            >
              <option value="">{language === "ro" ? "Toate orașele" : "All cities"}</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
              {currentUserProfile?.city && !cities.includes(currentUserProfile.city) && (
                <option value={currentUserProfile.city}>{currentUserProfile.city}</option>
              )}
            </select>
          </div>

          {/* Sport Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {language === "ro" ? "Sport" : "Sport"}
            </label>
            <button
              onClick={() => {
                // Toggle sport selection UI would go here
                setShowAvailabilityModal(true);
              }}
              className="input text-left flex items-center justify-between"
            >
              <span>
                {selectedSports.length > 0 
                  ? `${selectedSports.length} selectate` 
                  : language === "ro" ? "Selectează sport" : "Select sport"}
              </span>
              <span className="text-zinc-400">▼</span>
            </button>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {language === "ro" ? "Disponibilitate" : "Availability"}
            </label>
            <button
              onClick={() => setShowAvailabilityModal(true)}
              className="input text-left flex items-center justify-between"
            >
              <span>
                {userAvailability.slots.length > 0 
                  ? `${userAvailability.slots.length} intervale` 
                  : language === "ro" ? "Setează disponibilitatea" : "Set availability"}
              </span>
              <span className="text-emerald-500">🕐</span>
            </button>
          </div>
        </div>

        {/* Selected Sports Tags */}
        {selectedSports.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedSports.map(sport => (
              <span key={sport} className="badge badge-primary">
                {preferredSportsList.find(s => s.value === sport)?.emoji} {" "}
                {preferredSportsList.find(s => s.value === sport)?.label}
                <button 
                  onClick={() => setSelectedSports(selectedSports.filter(s => s !== sport))}
                  className="ml-1 text-emerald-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-zinc-500">
          {filteredBuddies.length} {language === "ro" ? "parteneri găsiți" : "buddies found"}
          {selectedCity && ` ${language === "ro" ? "din" : "from"} ${selectedCity}`}
        </p>
      </div>

      {/* Buddy Cards */}
      {filteredBuddies.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            {language === "ro" ? "Niciun partener găsit" : "No buddies found"}
          </h3>
          <p className="text-zinc-500">
            {language === "ro" 
              ? "Încearcă să ajustezi filtrele sau să setezi disponibilitatea"
              : "Try adjusting your filters or set your availability"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBuddies.map(buddy => {
            const matchScore = calculateMatchScore(buddy);
            const overlapHours = getOverlapHours(buddy);
            
            return (
              <div key={buddy.id} className="card p-4 hover:border-emerald-500 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      {buddy.displayName}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {buddy.age} ani • {buddy.city}
                    </p>
                  </div>
                  {/* Match Score */}
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      matchScore >= 70 ? "bg-emerald-100 text-emerald-600" :
                      matchScore >= 40 ? "bg-yellow-100 text-yellow-600" :
                      "bg-zinc-100 text-zinc-600"
                    }`}>
                      {matchScore}%
                    </div>
                  </div>
                </div>

                {/* Experience Level */}
                <div className="mb-3">
                  <span className={`badge ${
                    buddy.experienceLevel === "advanced" ? "bg-red-100 text-red-700" :
                    buddy.experienceLevel === "intermediate" ? "bg-yellow-100 text-yellow-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {buddy.experienceLevel === "advanced" ? "Avansat" :
                     buddy.experienceLevel === "intermediate" ? "Intermediar" : "Începător"}
                  </span>
                </div>

                {/* Sports */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(buddy.preferredSports as string[]).slice(0, 4).map(sport => {
                    const sportInfo = preferredSportsList.find(s => s.value === sport);
                    return sportInfo ? (
                      <span key={sport} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                        {sportInfo.emoji} {sportInfo.label}
                      </span>
                    ) : null;
                  })}
                </div>

                {/* Availability Summary */}
                {buddy.availability?.slots && buddy.availability.slots.length > 0 && (
                  <div className="mb-3 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500 mb-1">
                      {language === "ro" ? "Disponibil:" : "Available:"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {buddy.availability.slots.slice(0, 3).map((slot, i) => (
                        <span key={i} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                          {dayLabels[slot.day as DayOfWeek]} {slot.startHour}:00-{slot.endHour}:00
                        </span>
                      ))}
                      {buddy.availability.slots.length > 3 && (
                        <span className="text-xs text-zinc-500">
                          +{buddy.availability.slots.length - 3} mai mult
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Time Overlap */}
                {overlapHours > 0 && (
                  <div className="mb-3 text-sm text-emerald-600">
                    ✓ {overlapHours}h {language === "ro" ? "suprapunere" : "overlap"} disponibilitate
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => showVenueSuggestions(buddy)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    📍 {language === "ro" ? "Propune locație" : "Suggest venue"}
                  </button>
                  <button className="btn-primary flex-1 text-sm">
                    🤝 {language === "ro" ? "Conectează-te" : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {language === "ro" ? "Disponibilitate" : "Availability"}
              </h2>
              <button 
                onClick={() => setShowAvailabilityModal(false)}
                className="text-zinc-500 text-2xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-zinc-500 mb-4">
              {language === "ro" 
                ? "Selectează intervalele orare când ești disponibil să te antrenezi"
                : "Select time slots when you're available to work out"}
            </p>

            {/* Sport Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {language === "ro" ? "Sporturi de interes" : "Sports of interest"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {preferredSportsList.map(sport => (
                  <button
                    key={sport.value}
                    onClick={() => {
                      if (selectedSports.includes(sport.value as PreferredSport)) {
                        setSelectedSports(selectedSports.filter(s => s !== sport.value));
                      } else {
                        setSelectedSports([...selectedSports, sport.value as PreferredSport]);
                      }
                    }}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      selectedSports.includes(sport.value as PreferredSport)
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <span className="text-xl block">{sport.emoji}</span>
                    <span className="text-xs">{sport.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-2">
              {days.map(day => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-20 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {dayLabels[day]}
                  </span>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(hour => (
                      <button
                        key={hour}
                        onClick={() => toggleTimeSlot(day, hour, hour + 1)}
                        className={`w-8 h-8 rounded text-xs transition-all ${
                          isSlotSelected(day, hour)
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 hover:bg-emerald-100"
                        }`}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Summary */}
            {userAvailability.slots.length > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {userAvailability.slots.length} {language === "ro" ? "intervale selectate" : "slots selected"}
                </p>
              </div>
            )}

            <button 
              onClick={() => setShowAvailabilityModal(false)}
              className="btn-primary w-full mt-4"
            >
              {language === "ro" ? "Salvează" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Venue Suggestion Modal */}
      {showVenueModal && selectedBuddy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {language === "ro" ? "Locații Recomandate" : "Recommended Venues"}
              </h2>
              <button 
                onClick={() => setShowVenueModal(false)}
                className="text-zinc-500 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-zinc-500 mb-4">
              {language === "ro" 
                ? `Locații în ${selectedBuddy.city} pentru antrenament cu ${selectedBuddy.displayName}`
                : `Venues in ${selectedBuddy.city} to train with ${selectedBuddy.displayName}`}
            </p>

            {suggestedVenues.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏢</div>
                <p className="text-zinc-500">
                  {language === "ro" 
                    ? "Nu am găsit locații în baza de date"
                    : "No venues found in database"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Free Venues */}
                {suggestedVenues.filter(v => v.type === "free").length > 0 && (
                  <>
                    <h3 className="font-medium text-emerald-600 dark:text-emerald-400">
                      🆓 {language === "ro" ? "Gratuit" : "Free"}
                    </h3>
                    {suggestedVenues.filter(v => v.type === "free").map(venue => (
                      <div key={venue.id} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-zinc-900 dark:text-white">
                              {venue.name}
                            </h4>
                            <p className="text-sm text-zinc-500">{venue.address}</p>
                            {venue.facilities && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {venue.facilities.map((f, i) => (
                                  <span key={i} className="text-xs bg-white dark:bg-zinc-800 px-2 py-0.5 rounded">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Paid Venues */}
                {suggestedVenues.filter(v => v.type === "paid").length > 0 && (
                  <>
                    <h3 className="font-medium text-yellow-600 dark:text-yellow-400 mt-4">
                      💰 {language === "ro" ? "Plătit" : "Paid"}
                    </h3>
                    {suggestedVenues.filter(v => v.type === "paid").map(venue => (
                      <div key={venue.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-zinc-900 dark:text-white">
                              {venue.name}
                            </h4>
                            <p className="text-sm text-zinc-500">{venue.address}</p>
                            {venue.priceNote && (
                              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-1">
                                {venue.priceNote}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            <button 
              onClick={() => setShowVenueModal(false)}
              className="btn-primary w-full mt-4"
            >
              {language === "ro" ? "Închide" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
