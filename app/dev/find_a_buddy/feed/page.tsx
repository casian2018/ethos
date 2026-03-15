/**
 * FindABuddyFeed - Enhanced Feed page for browsing available training slots
 * 
 * Features:
 * - Top filters: City, Sport, Time
 * - Join button with Firestore update and Success Modal
 * - Empty State with CTA
 * - Mobile responsive design
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
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { 
  AvailabilitySlot, 
  sportTypeLabels, 
  genderPreferenceLabels,
  preferredSportsList,
} from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

const cities = [
  { id: "all", label: "Toate", labelEn: "All" },
  { id: "Bucharest", label: "București", labelEn: "Bucharest" },
  { id: "Cluj-Napoca", label: "Cluj-Napoca", labelEn: "Cluj-Napoca" },
  { id: "Timișoara", label: "Timișoara", labelEn: "Timișoara" },
  { id: "Iași", label: "Iași", labelEn: "Iași" },
  { id: "Constanța", label: "Constanța", labelEn: "Constanța" },
  { id: "Craiova", label: "Craiova", labelEn: "Craiova" },
  { id: "Brașov", label: "Brașov", labelEn: "Brașov" },
];

const timeSlots = [
  { id: "all", label: "Oricând", labelEn: "Any time" },
  { id: "morning", label: "Dimineață (6-12)", labelEn: "Morning (6-12)" },
  { id: "afternoon", label: "Prânz (12-18)", labelEn: "Afternoon (12-18)" },
  { id: "evening", label: "Seară (18-22)", labelEn: "Evening (18-22)" },
];

// Sport emoji mapping
const sportEmojis: Record<string, string> = {
  gym: "🏋️",
  running: "🏃",
  swimming: "🏊",
  football: "⚽",
  tennis: "🎾",
  basketball: "🏀",
  cycling: "🚴",
  yoga: "🧘",
  hiking: "🥾",
  boxing: "🥊",
};

// Extended slot type for display
interface ExtendedSlot extends AvailabilitySlot {
  id: string;
}

export default function FindABuddyFeedPage() {
  const { t, language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<ExtendedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [joinedSlot, setJoinedSlot] = useState<ExtendedSlot | null>(null);
  
  // Filters
  const today = new Date().toISOString().split('T')[0];
  const [cityFilter, setCityFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  // Fetch current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch slots
  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      try {
        const slotsRef = collection(db, "availability_slots");
        const q = query(
          slotsRef,
          where("status", "==", "open"),
          orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(q);
        const slotsData: ExtendedSlot[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          // Don't show user's own slots
          if (data.hostId !== user?.uid) {
            slotsData.push({
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              dateTime: data.dateTime?.toDate() || new Date(),
            } as ExtendedSlot);
          }
        }
        
        setSlots(slotsData);
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchSlots();
    }
  }, [user]);

  // Filter slots
  const filteredSlots = slots.filter(slot => {
    // City filter
    if (cityFilter !== "all" && slot.city !== cityFilter) return false;
    
    // Sport filter
    if (sportFilter !== "all" && slot.sportType !== sportFilter) return false;
    
    // Time filter
    if (timeFilter !== "all" && slot.dateTime) {
      const slotDate = slot.dateTime instanceof Date ? slot.dateTime : new Date(slot.dateTime);
      const slotHour = slotDate.getHours();
      if (timeFilter === "morning" && (slotHour < 6 || slotHour >= 12)) return false;
      if (timeFilter === "afternoon" && (slotHour < 12 || slotHour >= 18)) return false;
      if (timeFilter === "evening" && (slotHour < 18 || slotHour >= 22)) return false;
    }
    
    return true;
  });

  // Join slot
  async function handleJoin(slot: ExtendedSlot) {
    if (!user || !slot.id) return;
    
    setJoining(slot.id);
    setError("");
    
    try {
      // Update slot with buddy
      const slotRef = doc(db, "availability_slots", slot.id);
      await updateDoc(slotRef, {
        status: "matched",
        buddyId: user.uid,
        matchedAt: serverTimestamp(),
      });
      
      // Show success modal
      setJoinedSlot(slot);
      setShowSuccessModal(true);
      
    } catch (err) {
      console.error("Error joining slot:", err);
      setError(language === "ro" ? "Eroare la înregistrare" : "Error joining");
    } finally {
      setJoining(null);
    }
  }

  function closeSuccessModal() {
    setShowSuccessModal(false);
    setJoinedSlot(null);
    // Refresh slots
    window.location.reload();
  }

  // Format time from Date
  function formatTime(date: Date) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // Get sport emoji
  function getSportEmoji(sport: string) {
    return sportEmojis[sport] || "🏃";
  }

  // Get city label
  function getCityLabel(cityId: string) {
    const city = cities.find(c => c.id === cityId);
    return language === "ro" ? (city?.label || cityId) : (city?.labelEn || cityId);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {language === "ro" ? "Disponibilități" : "Availability"}
            </h1>
            <p className="text-slate-500 text-sm">
              {filteredSlots.length} {language === "ro" ? "sloturi disponibile" : "slots available"}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {language === "ro" ? "Adaugă" : "Add"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🏙️ {language === "ro" ? "Oraș" : "City"}
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {language === "ro" ? city.label : city.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🏃 {language === "ro" ? "Sport" : "Sport"}
              </label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              >
                <option value="all">{language === "ro" ? "Toate" : "All"}</option>
                {preferredSportsList.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {getSportEmoji(sport.value)} {sport.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ⏰ {language === "ro" ? "Oră" : "Time"}
              </label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              >
                {timeSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {language === "ro" ? slot.label : slot.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Slots List or Empty State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSlots.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {language === "ro" ? "Niciun partener disponibil" : "No partners available"}
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {language === "ro" 
                ? "Niciun partener disponibil? Fii tu cel care dă startul!"
                : "No partners available? Be the one to start!"}
            </p>
            <button
              onClick={() => window.location.href = "/dev/find_a_buddy"}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {language === "ro" ? "Adaugă Disponibilitate" : "Add Availability"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSlots.map((slot) => (
              <div 
                key={slot.id} 
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  {/* Slot Info */}
                  <div className="flex-1">
                    {/* Sport & City */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{getSportEmoji(slot.sportType)}</span>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {slot.sportType}
                        </h3>
                        <p className="text-sm text-slate-500">
                          🏙️ {getCityLabel(slot.city)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Date & Time */}
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {slot.dateTime instanceof Date ? slot.dateTime.toLocaleDateString() : new Date(slot.dateTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(slot.dateTime)}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        ⏱️ {slot.duration} min
                      </div>
                    </div>
                    
                    {/* Location & Price */}
                    <div className="flex items-center gap-2 text-sm">
                      {slot.location?.isPaid ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium">
                          💰 {slot.location?.price} Lei
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium">
                          🎉 {language === "ro" ? "Gratis" : "Free"}
                        </span>
                      )}
                      {slot.location?.name && (
                        <span className="text-slate-500">
                          📍 {slot.location?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Join Button */}
                  <button
                    onClick={() => handleJoin(slot)}
                    disabled={joining === slot.id}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    {joining === slot.id ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </span>
                    ) : (
                      language === "ro" ? "Alătură-te" : "Join"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && joinedSlot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center animate-in fade-in zoom-in">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Te-ai alăturat!" : "You joined!"}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === "ro" 
                  ? `Te-ai alăturat slotului de ${joinedSlot.sportType} în ${getCityLabel(joinedSlot.city)}. Contactează-l pe gazdă pentru detalii!`
                  : `You joined the ${joinedSlot.sportType} slot in ${getCityLabel(joinedSlot.city)}. Contact the host for details!`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeSuccessModal}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  {language === "ro" ? "Închide" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
