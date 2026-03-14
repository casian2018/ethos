/**
 * Sport Events - Find and join sports events
 * 
 * Firestore Collection: sport_events
 * Sub-collection: sport_events/{eventId}/event_chat
 * 
 * Route: /dev/events
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  query, 
  getDocs,
  addDoc,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import { 
  SportEvent, 
  SportType, 
  GenderPreference,
  sportTypeLabels,
  genderPreferenceLabels,
  EventChatMessage
} from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

// Romanian cities
const cities = [
  "Bucharest",
  "Cluj-Napoca",
  "Timișoara", 
  "Iași",
  "Constanța",
  "Craiova",
  "Brașov",
  "Sibiu",
  "Oradea",
  "Ploiești"
];

export default function SportEventsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filters
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterSport, setFilterSport] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUser(currentUser);
      loadEvents();
    });
    return () => unsubscribe();
  }, [router]);

  const loadEvents = async () => {
    try {
      // Load upcoming events
      const eventsQuery = query(
        collection(db, "sport_events"),
        where("status", "==", "open"),
        orderBy("startTime", "asc"),
        limit(50)
      );
      
      const snapshot = await getDocs(eventsQuery);
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
          locationName: "Parcul Titan - Teren 3",
          isPaid: false,
          maxParticipants: 10,
          joinedUsers: ["user1", "user2", "user3"],
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
          joinedUsers: ["user2", "user4"],
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
          priceNote: "Per sesiune",
          maxParticipants: 1,
          joinedUsers: ["user3"],
          status: "open",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "4",
          creatorId: "user5",
          creatorName: "Elena I.",
          sportType: "yoga",
          city: "Timișoara",
          genderPreference: "F",
          startTime: new Date(now.getTime() + 86400000 * 4),
          endTime: new Date(now.getTime() + 86400000 * 4 + 5400000),
          locationName: "Parcul Roses",
          isPaid: false,
          maxParticipants: 15,
          joinedUsers: ["user5", "user6"],
          status: "open",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "5",
          creatorId: "user7",
          creatorName: "Andrei B.",
          sportType: "basketball",
          city: "Iași",
          genderPreference: "anyone",
          startTime: new Date(now.getTime() + 86400000 * 5),
          endTime: new Date(now.getTime() + 86400000 * 5 + 7200000),
          locationName: "Parcul Copou - Teren Basket",
          isPaid: false,
          maxParticipants: 10,
          joinedUsers: ["user7", "user8", "user9", "user10"],
          status: "open",
          createdAt: now,
          updatedAt: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filterCity && event.city !== filterCity) return false;
    if (filterSport && event.sportType !== filterSport) return false;
    if (filterDate) {
      const eventDate = new Date(event.startTime).toDateString();
      const filterD = new Date(filterDate).toDateString();
      if (eventDate !== filterD) return false;
    }
    return true;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ro-RO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSpotsLeft = (event: SportEvent) => {
    return event.maxParticipants - event.joinedUsers.length;
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
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {language === "ro" ? "Evenimente Sportive" : "Sport Events"}
          </h1>
          <p className="text-zinc-500">
            {language === "ro" 
              ? "Alătură-te la evenimente sportive în orașul tău"
              : "Join sports events in your city"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          + {language === "ro" ? "Creează Eveniment" : "Create Event"}
        </button>
      </header>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {language === "ro" ? "Oraș" : "City"}
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="input"
            >
              <option value="">{language === "ro" ? "Toate orașele" : "All cities"}</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {language === "ro" ? "Sport" : "Sport"}
            </label>
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="input"
            >
              <option value="">{language === "ro" ? "Toate sporturile" : "All sports"}</option>
              {Object.entries(sportTypeLabels).map(([key, { label, emoji }]) => (
                <option key={key} value={key}>{emoji} {label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {language === "ro" ? "Dată" : "Date"}
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
        
        {/* Clear filters */}
        {(filterCity || filterSport || filterDate) && (
          <button
            onClick={() => {
              setFilterCity("");
              setFilterSport("");
              setFilterDate("");
            }}
            className="text-sm text-emerald-600 mt-3"
          >
            {language === "ro" ? "Șterge filtrele" : "Clear filters"}
          </button>
        )}
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            {language === "ro" ? "Niciun eveniment găsit" : "No events found"}
          </h3>
          <p className="text-zinc-500 mb-4">
            {language === "ro" 
              ? "Fii primul care creează un eveniment!"
              : "Be the first to create an event!"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            + {language === "ro" ? "Creează Eveniment" : "Create Event"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map(event => {
            const sport = sportTypeLabels[event.sportType as SportType];
            const spotsLeft = getSpotsLeft(event);
            const isFull = spotsLeft <= 0;
            
            return (
              <div key={event.id} className="card p-4 hover:border-emerald-500 transition-colors">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sport?.emoji || "🏃"}</span>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {sport?.label || event.sportType}
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {event.city}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {event.genderPreference !== "anyone" && (
                    <span className={`badge ${
                      event.genderPreference === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                    }`}>
                      {genderPreferenceLabels[event.genderPreference as GenderPreference]}
                    </span>
                  )}
                </div>

                {/* Date & Time */}
                <div className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                    <span className="text-lg">📅</span>
                    <span className="font-medium">{formatDate(event.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 mt-1">
                    <span>🕐</span>
                    <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                    <span>📍</span>
                    <span className="font-medium">{event.locationName}</span>
                  </div>
                  {event.isPaid && event.price && (
                    <div className="flex items-center gap-2 text-yellow-600 mt-1">
                      <span>💰</span>
                      <span className="font-medium">{event.price} RON</span>
                      {event.priceNote && <span className="text-sm">({event.priceNote})</span>}
                    </div>
                  )}
                  {!event.isPaid && (
                    <div className="flex items-center gap-2 text-emerald-600 mt-1">
                      <span>🆓</span>
                      <span className="font-medium">{language === "ro" ? "Gratuit" : "Free"}</span>
                    </div>
                  )}
                </div>

                {/* Participants */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-zinc-500">
                      {language === "ro" ? "Participanți" : "Participants"}
                    </span>
                    <span className={`font-medium ${isFull ? "text-red-500" : "text-emerald-600"}`}>
                      {event.joinedUsers.length} / {event.maxParticipants}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isFull ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${(event.joinedUsers.length / event.maxParticipants) * 100}%` }}
                    />
                  </div>
                  {!isFull && (
                    <p className="text-sm text-emerald-600 mt-1">
                      {spotsLeft} {language === "ro" ? "locuri disponibile" : "spots left"}
                    </p>
                  )}
                  {isFull && (
                    <p className="text-sm text-red-500 mt-1">
                      {language === "ro" ? "Eveniment complet" : "Event full"}
                    </p>
                  )}
                </div>

                {/* Creator */}
                <div className="text-sm text-zinc-500 mb-4">
                  {language === "ro" ? "Organizator" : "Organizer"}: <span className="text-zinc-700 dark:text-zinc-300">{event.creatorName}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link 
                    href={`/dev/events/${event.id}`}
                    className="btn-secondary flex-1 text-center text-sm"
                  >
                    💬 {language === "ro" ? "Chat" : "Chat"}
                  </Link>
                  <button 
                    disabled={isFull}
                    className={`btn-primary flex-1 text-sm ${isFull ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {!isFull 
                      ? `✓ ${language === "ro" ? "Alătură-te" : "Join"}`
                      : `${language === "ro" ? "Complet" : "Full"}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal 
          onClose={() => setShowCreateModal(false)}
          userId={user?.uid || ""}
          userName={user?.displayName || "Utilizator"}
        />
      )}
    </div>
  );
}

// ==================== Create Event Modal ====================

interface CreateEventModalProps {
  onClose: () => void;
  userId: string;
  userName: string;
}

function CreateEventModal({ onClose, userId, userName }: CreateEventModalProps) {
  const { language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    sportType: "" as SportType | "",
    city: "",
    genderPreference: "anyone" as GenderPreference,
    date: "",
    startTime: "",
    endTime: "",
    locationName: "",
    isPaid: false,
    price: "",
    maxParticipants: "10",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const startTime = new Date(`${formData.date}T${formData.startTime}`);
      const endTime = new Date(`${formData.date}T${formData.endTime}`);

      await addDoc(collection(db, "sport_events"), {
        creatorId: userId,
        creatorName: userName,
        sportType: formData.sportType,
        city: formData.city,
        genderPreference: formData.genderPreference,
        startTime,
        endTime,
        locationName: formData.locationName,
        isPaid: formData.isPaid,
        price: formData.isPaid ? parseInt(formData.price) : 0,
        maxParticipants: parseInt(formData.maxParticipants),
        joinedUsers: [userId], // Creator auto-joins
        description: formData.description,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      onClose();
    } catch (err) {
      console.error("Error creating event:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {language === "ro" ? "Creează Eveniment" : "Create Event"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sport Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Sport *
            </label>
            <select
              required
              value={formData.sportType}
              onChange={(e) => setFormData({ ...formData, sportType: e.target.value as SportType })}
              className="input"
            >
              <option value="">Selectează...</option>
              {Object.entries(sportTypeLabels).map(([key, { label, emoji }]) => (
                <option key={key} value={key}>{emoji} {label}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Oraș *
            </label>
            <select
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input"
            >
              <option value="">Selectează...</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Gender Preference */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Preferință Gen
            </label>
            <select
              value={formData.genderPreference}
              onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value as GenderPreference })}
              className="input"
            >
              <option value="anyone">Oricine</option>
              <option value="M">Doar Bărbați</option>
              <option value="F">Doar Femei</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Dată *
              </label>
              <input
                required
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Ora Start *
              </label>
              <input
                required
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Ora Final *
              </label>
              <input
                required
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="input"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Locație *
            </label>
            <input
              required
              type="text"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              className="input"
              placeholder="Ex: Parcul Titan, Sala World Class"
            />
          </div>

          {/* Paid & Price */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="isPaid" className="text-sm text-zinc-700 dark:text-zinc-300">
                Eveniment Plătit
              </label>
            </div>
            {formData.isPaid && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Preț (RON)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input"
                  placeholder="35"
                />
              </div>
            )}
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nr. Maxim Participanți *
            </label>
            <input
              required
              type="number"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
              className="input"
              min="2"
              max="100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Descriere (opțional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Detalii despre eveniment..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting 
              ? (language === "ro" ? "Se creează..." : "Creating...")
              : (language === "ro" ? "Creează Eveniment" : "Create Event")}
          </button>
        </form>
      </div>
    </div>
  );
}
