/**
 * FindABuddyFeed - Main feed page for sport events
 * 
 * Features:
 * - Auto-detect city or manual selection
 * - Filters: Sport, Gender, Time slot
 * - Real-time Firestore queries (where)
 * - Event cards with sport, city, time, location, price badge
 * 
 * Route: /dev/feed
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  query, 
  getDocs,
  doc,
  getDoc,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import { 
  SportEvent, 
  SportType, 
  GenderPreference,
  sportTypeLabels,
  genderPreferenceLabels
} from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

// Romanian cities
const cities = [
  { value: "", label: "Toate orașele" },
  { value: "Bucharest", label: "Bucharest" },
  { value: "Cluj-Napoca", label: "Cluj-Napoca" },
  { value: "Timișoara", label: "Timișoara" },
  { value: "Iași", label: "Iași" },
  { value: "Constanța", label: "Constanța" },
  { value: "Craiova", label: "Craiova" },
  { value: "Brașov", label: "Brașov" },
  { value: "Sibiu", label: "Sibiu" },
  { value: "Oradea", label: "Oradea" },
  { value: "Ploiești", label: "Ploiești" }
];

// Days for filter
const days = [
  { value: "", label: "Orice zi" },
  { value: "monday", label: "Luni" },
  { value: "tuesday", label: "Marți" },
  { value: "wednesday", label: "Miercuri" },
  { value: "thursday", label: "Joi" },
  { value: "friday", label: "Vineri" },
  { value: "saturday", label: "Sâmbătă" },
  { value: "sunday", label: "Duminică" },
];

export default function FindABuddyFeedPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState<string>("");
  
  // Filters
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterSport, setFilterSport] = useState<string>("");
  const [filterGender, setFilterGender] = useState<string>("");
  const [filterDay, setFilterDay] = useState<string>("");
  const [filterTimeStart, setFilterTimeStart] = useState<string>("");
  const [filterTimeEnd, setFilterTimeEnd] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Try to get user's city from profile
      if (currentUser && db) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.city) {
              setUserCity(userData.city);
              setFilterCity(userData.city);
            }
          }
        } catch (err) {
          console.error("Error getting user city:", err);
        }
      }
      
      loadEvents();
    });
    
    return () => unsubscribe();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Base query - only open events
      const constraints = [
        where("status", "==", "open"),
        orderBy("startTime", "asc"),
        limit(100)
      ];
      
      const q = query(collection(db, "sport_events"), ...constraints);
      const snapshot = await getDocs(q);
      
      const eventsData: SportEvent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        eventsData.push({
          id: doc.id,
          ...data,
          startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
          endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        } as SportEvent);
      });
      
      setEvents(eventsData);
    } catch (err) {
      console.error("Error loading events:", err);
      // Demo data
      const now = new Date();
      setEvents([
        {
          id: "1",
          creatorId: "user1",
          creatorName: "Alex M.",
          sportType: "football",
          city: "Bucharest",
          genderPreference: "anyone",
          startTime: new Date(now.getTime() + 86400000 * 2),
          endTime: new Date(now.getTime() + 86400000 * 2 + 7200000),
          locationName: "Parcul Titan",
          isPaid: false,
          maxParticipants: 10,
          joinedUsers: ["user1", "user2"],
          status: "open",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "2",
          creatorId: "user2",
          creatorName: "Maria D.",
          sportType: "tennis",
          city: "Bucharest",
          genderPreference: "anyone",
          startTime: new Date(now.getTime() + 86400000 * 3),
          endTime: new Date(now.getTime() + 86400000 * 3 + 5400000),
          locationName: "Club Sportiv Titan",
          isPaid: true,
          price: 35,
          priceNote: "Per persoană",
          maxParticipants: 4,
          joinedUsers: ["user2"],
          status: "open",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "3",
          creatorId: "user3",
          creatorName: "Cristian P.",
          sportType: "gym",
          city: "Cluj-Napoca",
          genderPreference: "M",
          startTime: new Date(now.getTime() + 86400000),
          endTime: new Date(now.getTime() + 86400000 + 5400000),
          locationName: "FitZone Cluj",
          isPaid: true,
          price: 45,
          maxParticipants: 1,
          joinedUsers: ["user3"],
          status: "open",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "4",
          creatorId: "user4",
          creatorName: "Elena I.",
          sportType: "yoga",
          city: "Timișoara",
          genderPreference: "F",
          startTime: new Date(now.getTime() + 86400000 * 4),
          endTime: new Date(now.getTime() + 86400000 * 4 + 5400000),
          locationName: "Parcul Roses",
          isPaid: false,
          maxParticipants: 15,
          joinedUsers: ["user4"],
          status: "open",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "5",
          creatorId: "user5",
          creatorName: "Andrei B.",
          sportType: "basketball",
          city: "Iași",
          genderPreference: "anyone",
          startTime: new Date(now.getTime() + 86400000 * 5),
          endTime: new Date(now.getTime() + 86400000 * 5 + 7200000),
          locationName: "Parcul Copou",
          isPaid: false,
          maxParticipants: 10,
          joinedUsers: ["user5"],
          status: "open",
          createdAt: now,
          updatedAt: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering (for complex filters that Firestore can't handle easily)
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // City filter
      if (filterCity && event.city.toLowerCase() !== filterCity.toLowerCase()) {
        return false;
      }
      
      // Sport filter
      if (filterSport && event.sportType !== filterSport) {
        return false;
      }
      
      // Gender filter
      if (filterGender) {
        // If user has gender preference, check if current user matches
        if (event.genderPreference !== "anyone" && event.genderPreference !== filterGender && filterGender !== "anyone") {
          return false;
        }
      }
      
      // Day filter
      if (filterDay) {
        const eventDay = new Date(event.startTime).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        const dayMap: Record<string, string> = {
          monday: "monday", tuesday: "tuesday", wednesday: "wednesday",
          thursday: "thursday", friday: "friday", saturday: "saturday", sunday: "sunday"
        };
        if (dayMap[eventDay] !== filterDay) {
          return false;
        }
      }
      
      // Time range filter
      if (filterTimeStart) {
        const eventHour = new Date(event.startTime).getHours();
        if (eventHour < parseInt(filterTimeStart)) {
          return false;
        }
      }
      
      if (filterTimeEnd) {
        const eventHour = new Date(event.startTime).getHours();
        if (eventHour > parseInt(filterTimeEnd)) {
          return false;
        }
      }
      
      return true;
    });
  }, [events, filterCity, filterSport, filterGender, filterDay, filterTimeStart, filterTimeEnd]);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {language === "ro" ? "Găsește Parteneri de Sport" : "Find Sports Buddies"}
        </h1>
        <p className="text-zinc-500">
          {filteredEvents.length} {language === "ro" ? "evenimente disponibile" : "events available"}
        </p>
      </header>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* City */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Oraș
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="input text-sm"
            >
              {cities.map(city => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sport */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Sport
            </label>
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="input text-sm"
            >
              <option value="">Toate sporturile</option>
              {Object.entries(sportTypeLabels).map(([key, { label, emoji }]) => (
                <option key={key} value={key}>{emoji} {label}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Gen
            </label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="input text-sm"
            >
              <option value="">Oricine</option>
              <option value="M">👨 Bărbați</option>
              <option value="F">👩 Femei</option>
            </select>
          </div>

          {/* Day */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Ziua
            </label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="input text-sm"
            >
              {days.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              De la ora
            </label>
            <select
              value={filterTimeStart}
              onChange={(e) => setFilterTimeStart(e.target.value)}
              className="input text-sm"
            >
              <option value="">Orice oră</option>
              {Array.from({ length: 15 }, (_, i) => i + 6).map(hour => (
                <option key={hour} value={hour}>{hour}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Până la ora
            </label>
            <select
              value={filterTimeEnd}
              onChange={(e) => setFilterTimeEnd(e.target.value)}
              className="input text-sm"
            >
              <option value="">Orice oră</option>
              {Array.from({ length: 15 }, (_, i) => i + 12).map(hour => (
                <option key={hour} value={hour}>{hour}:00</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filterCity || filterSport || filterGender || filterDay || filterTimeStart || filterTimeEnd) && (
          <button
            onClick={() => {
              setFilterCity(userCity);
              setFilterSport("");
              setFilterGender("");
              setFilterDay("");
              setFilterTimeStart("");
              setFilterTimeEnd("");
            }}
            className="text-sm text-emerald-600 mt-3"
          >
            ✕ Șterge filtrele
          </button>
        )}
      </div>

      {/* Event Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Niciun eveniment găsit
          </h3>
          <p className="text-zinc-500">
            Încearcă să ajustezi filtrele
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map(event => {
            const sport = sportTypeLabels[event.sportType as SportType];
            const spotsLeft = event.maxParticipants - event.joinedUsers.length;
            const isFull = spotsLeft <= 0;
            
            return (
              <EventCard 
                key={event.id} 
                event={event} 
                sport={sport}
                isFull={isFull}
                spotsLeft={spotsLeft}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== EventCard Component ====================

interface EventCardProps {
  event: SportEvent;
  sport?: { label: string; emoji: string };
  isFull: boolean;
  spotsLeft: number;
}

function EventCard({ event, sport, isFull, spotsLeft }: EventCardProps) {
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

  return (
    <Link href={`/dev/events/${event.id}`}>
      <div className="card p-4 hover:border-emerald-500 transition-all hover:shadow-md">
        <div className="flex items-center gap-4">
          {/* Sport Icon */}
          <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl flex-shrink-0">
            {sport?.emoji || "🏃"}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                {sport?.label || event.sportType}
              </h3>
              {/* Price Badge */}
              {event.isPaid ? (
                <span className="badge bg-yellow-100 text-yellow-700 text-xs">
                  💰 {event.price} RON
                </span>
              ) : (
                <span className="badge bg-emerald-100 text-emerald-700 text-xs">
                  🆓 Gratis
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-500">
              {/* City */}
              <span className="flex items-center gap-1">
                📍 {event.city}
              </span>
              {/* Time */}
              <span className="flex items-center gap-1">
                🕐 {formatDate(event.startTime)} • {formatTime(event.startTime)}
              </span>
            </div>

            {/* Location */}
            <p className="text-sm text-zinc-500 mt-1 truncate">
              📍 {event.locationName}
            </p>
          </div>

          {/* Participants */}
          <div className="text-right flex-shrink-0">
            <div className={`text-lg font-bold ${isFull ? "text-red-500" : "text-emerald-600"}`}>
              {event.joinedUsers.length}/{event.maxParticipants}
            </div>
            <div className="text-xs text-zinc-500">
              {isFull ? "Complet" : `${spotsLeft} locuri`}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
