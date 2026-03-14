/**
 * FindABuddyFeed - Feed page for browsing available training slots
 * 
 * Features:
 * - List of open slots from other users
 * - Filters: City, Sport, Gender
 * - Join Training button with validation
 * - Prevent joining own slots
 * - Prevent overlapping slots
 */

"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  getDoc
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { 
  AvailabilitySlot, 
  sportTypeLabels, 
  genderPreferenceLabels,
  SlotStatus,
  SportType,
  GenderPreference,
  preferredSportsList,
  createSlotChat
} from "@/lib/types";
import AddAvailabilityForm from "@/components/AddAvailabilityForm";

const auth = firebaseAuth!;
const db = firebaseDb!;

const cities = [
  "Toate",
  "Bucharest",
  "Cluj-Napoca",
  "Timișoara",
  "Iași",
  "Constanța",
  "Craiova",
  "Brașov",
  "Sibiu",
  "Oradea",
  "Bacău"
];

export default function FindABuddyFeedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // User's existing slots for overlap checking
  const [userSlots, setUserSlots] = useState<AvailabilitySlot[]>([]);
  
  // Filters - Default to today's date
  const today = new Date().toISOString().split('T')[0];
  const [cityFilter, setCityFilter] = useState("Toate");
  const [sportFilter, setSportFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>(today); // Default to today
  const [timeFilter, setTimeFilter] = useState<string>("");

  // Fetch current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch slots
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        // Fetch all open slots
        const slotsQuery = query(
          collection(db, "availability_slots"),
          where("status", "==", "open"),
          orderBy("dateTime", "asc")
        );
        
        const snapshot = await getDocs(slotsQuery);
        const fetchedSlots: AvailabilitySlot[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedSlots.push({
            id: doc.id,
            hostId: data.hostId,
            hostName: data.hostName,
            sportType: data.sportType,
            city: data.city,
            dateTime: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(),
            duration: data.duration,
            genderPreference: data.genderPreference,
            location: data.location,
            status: data.status,
            buddyId: data.buddyId,
            description: data.description,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
          });
        });
        
        setSlots(fetchedSlots);
        
        // Also fetch user's own slots for overlap checking
        if (user) {
          const userSlotsQuery = query(
            collection(db, "availability_slots"),
            where("hostId", "==", user.uid)
          );
          const userSnapshot = await getDocs(userSlotsQuery);
          const userFetchedSlots: AvailabilitySlot[] = [];
          
          userSnapshot.forEach((doc) => {
            const data = doc.data();
            userFetchedSlots.push({
              id: doc.id,
              hostId: data.hostId,
              hostName: data.hostName,
              sportType: data.sportType,
              city: data.city,
              dateTime: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(),
              duration: data.duration,
              genderPreference: data.genderPreference,
              location: data.location,
              status: data.status,
              buddyId: data.buddyId,
              description: data.description,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
            });
          });
          
          setUserSlots(userFetchedSlots);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSlots();
  }, [user]);

  // Check if time overlaps with user's existing slots
  const hasTimeConflict = (newSlot: AvailabilitySlot): boolean => {
    if (!user) return false;
    
    const newStart = newSlot.dateTime.getTime();
    const newEnd = newStart + (newSlot.duration * 60 * 1000);
    
    for (const existingSlot of userSlots) {
      // Check if user is already matched to this slot
      if (existingSlot.status === "matched") {
        const existingStart = existingSlot.dateTime.getTime();
        const existingEnd = existingStart + (existingSlot.duration * 60 * 1000);
        
        // Check overlap
        if (newStart < existingEnd && newEnd > existingStart) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Handle join
  const handleJoin = async (slot: AvailabilitySlot) => {
    setError("");
    setSuccess("");
    
    if (!user) {
      setError("Trebuie să fii autentificat pentru a te alătura");
      return;
    }
    
    // Check if it's user's own slot
    if (slot.hostId === user.uid) {
      setError("Nu te poți alătura propriului tău slot");
      return;
    }
    
    // Check for time conflict
    if (hasTimeConflict(slot)) {
      setError("Ai deja un antrenament programat în această perioadă");
      return;
    }
    
    // Check gender preference
    if (slot.genderPreference !== "anyone" && user.uid) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userGender = userDoc.data().gender;
          if (slot.genderPreference === "M" && userGender !== "male") {
            setError("Acest slot este doar pentru bărbați");
            return;
          }
          if (slot.genderPreference === "F" && userGender !== "female") {
            setError("Acest slot este doar pentru femei");
            return;
          }
        }
      } catch (err) {
        console.error("Error checking user gender:", err);
      }
    }
    
    setJoining(slot.id!);
    try {
      // Update slot to matched
      await updateDoc(doc(db, "availability_slots", slot.id!), {
        buddyId: user.uid,
        status: "matched",
        updatedAt: serverTimestamp(),
      });
      
      // Create chat for the matched slot
      await createSlotChat(db, slot, slot.hostId, user.uid);
      
      setSuccess("Te-ai alăturat cu succes! Antrenamentul este confirmat.");
      
      // Refresh slots
      const snapshot = await getDocs(query(
        collection(db, "availability_slots"),
        where("status", "==", "open"),
        orderBy("dateTime", "asc")
      ));
      
      const updatedSlots: AvailabilitySlot[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        updatedSlots.push({
          id: doc.id,
          ...data,
          dateTime: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        } as AvailabilitySlot);
      });
      setSlots(updatedSlots);
      
    } catch (err) {
      console.error("Error joining slot:", err);
      setError("Eroare la alăturare. Încearcă din nou.");
    } finally {
      setJoining(null);
    }
  };

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    // Filter out past dates by default (only show today and future)
    const slotDate = new Date(slot.dateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If no date filter selected, only show future slots
    if (!dateFilter && slotDate < today) return false;
    
    // If date filter selected, only show that specific date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
      const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
      
      if (slotDateOnly.getTime() !== filterDateOnly.getTime()) return false;
    }
    
    // Time filter
    if (timeFilter) {
      const hour = slotDate.getHours();
      if (timeFilter === "morning" && (hour < 6 || hour >= 12)) return false;
      if (timeFilter === "afternoon" && (hour < 12 || hour >= 18)) return false;
      if (timeFilter === "evening" && (hour < 18 || hour >= 22)) return false;
    }
    
    if (cityFilter !== "Toate" && slot.city !== cityFilter) return false;
    if (sportFilter && slot.sportType !== sportFilter) return false;
    if (genderFilter && slot.genderPreference !== genderFilter) return false;
    // Don't show user's own slots
    if (user && slot.hostId === user.uid) return false;
    return true;
  });

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ro-RO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Add Availability Form Modal
  if (showAddForm) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 md:p-6">
        <div className="max-w-lg mx-auto">
          <AddAvailabilityForm 
            onSuccess={() => {
              setShowAddForm(false);
              // Refresh slots
              window.location.reload();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
              🔍 Găsește Partener
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Alătură-te unui antrenament disponibil
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            ➕ Adaugă Disponibilitatea Mea
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {/* City Filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="input flex-1 min-w-[140px]"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === "Toate" ? "🏙️ Toate orașele" : `🏙️ ${city}`}
                </option>
              ))}
            </select>

            {/* Sport Filter */}
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="input flex-1 min-w-[140px]"
            >
              <option value="">🏃 Toate sporturile</option>
              {preferredSportsList.map((sport) => (
                <option key={sport.value} value={sport.value}>
                  {sport.emoji} {sport.label}
                </option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="input flex-1 min-w-[140px]"
            >
              <option value="">👥 Oricine</option>
              <option value="anyone">👥 Oricine</option>
              <option value="M">👨 doar Bărbați</option>
              <option value="F">👩 doar Femei</option>
            </select>

            {/* Date Filter - Shows today's slots by default */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input flex-1 min-w-[140px]"
            >
              <option value="">📅 Toate zilele viitoare</option>
              <option value={today}>📅 Azi</option>
              <option value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}>📅 Mâine</option>
              <option value={new Date(Date.now() + 172800000).toISOString().split('T')[0]}>📅 Poimâine</option>
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="input flex-1 min-w-[140px]"
            >
              <option value="">🕐 Orice oră</option>
              <option value="morning">🌅 Dimineață (6-12)</option>
              <option value="afternoon">☀️ Prânz (12-18)</option>
              <option value="evening">🌆 Seară (18-22)</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm">
            {success}
          </div>
        )}

        {/* Slots List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
              Niciun slot disponibil
            </h3>
            <p className="text-zinc-500 text-sm">
              Încearcă alte filtre sau creează tu un slot
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSlots.map((slot) => {
              const sport = sportTypeLabels[slot.sportType as keyof typeof sportTypeLabels];
              const isOwnSlot = user?.uid === slot.hostId;
              
              return (
                <div 
                  key={slot.id} 
                  className="card p-4 hover:border-emerald-500 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Sport Icon */}
                    <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl flex-shrink-0">
                      {sport?.emoji || "🏃"}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          {sport?.label || slot.sportType}
                        </h3>
                        <span className="badge bg-emerald-100 text-emerald-700 text-xs">
                          {genderPreferenceLabels[slot.genderPreference]}
                        </span>
                        {slot.location.isPaid && (
                          <span className="badge bg-yellow-100 text-yellow-700 text-xs">
                            💰 {slot.location.price} RON
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-zinc-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          📍 {slot.city}
                        </span>
                        <span className="flex items-center gap-1">
                          📅 {formatDate(slot.dateTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          🕐 {formatTime(slot.dateTime)} ({slot.duration} min)
                        </span>
                      </div>

                      <p className="text-sm text-zinc-500 mt-1 truncate">
                        📍 {slot.location.name}
                      </p>
                      
                      <p className="text-xs text-zinc-400 mt-1">
                        👤 Host: {slot.hostName}
                      </p>

                      {slot.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 italic">
                          &ldquo;{slot.description}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Join Button */}
                  <div className="mt-4">
                    {isOwnSlot ? (
                      <button
                        disabled
                        className="btn-secondary w-full opacity-50 cursor-not-allowed"
                      >
                        Slotul tău
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(slot)}
                        disabled={joining === slot.id}
                        className="btn-primary w-full"
                      >
                        {joining === slot.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            Se alătură...
                          </span>
                        ) : (
                          "🎯 Join Training"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Add Availability Form Modal
  if (showAddForm) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 md:p-6">
        <div className="max-w-lg mx-auto">
          <AddAvailabilityForm 
            onSuccess={() => {
              setShowAddForm(false);
              // Refresh slots
              window.location.reload();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      </div>
    );
  }
}
