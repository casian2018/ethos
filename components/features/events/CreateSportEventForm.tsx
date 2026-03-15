/**
 * CreateSportEventForm - Reusable component for creating sport events
 * 
 * Features:
 * - Sport selection
 * - City input
 * - Time slot selection (availability)
 * - Location type (free/paid with price)
 * - Gender preference
 * - Past date validation
 * - Firestore save + redirect
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { 
  SportType, 
  GenderPreference,
  sportTypeLabels,
  genderPreferenceLabels,
  DayOfWeek,
  TimeSlot
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

// Days of week
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

interface CreateSportEventFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateSportEventForm({ onSuccess, onCancel }: CreateSportEventFormProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    sportType: "" as SportType | "",
    city: "",
    genderPreference: "anyone" as GenderPreference,
    date: "",
    startTime: "",
    endTime: "",
    locationName: "",
    locationType: "free" as "free" | "paid",
    price: "",
    maxParticipants: "10",
    description: "",
  });

  // Availability slots (for showing selected time)
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);

  // Check auth
  useState(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  });

  // Validation: check if date is in the past
  const isDateInPast = (dateStr: string) => {
    if (!dateStr) return false;
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate: cannot create event in the past
    if (isDateInPast(formData.date)) {
      setError("Nu poți crea un eveniment în trecut. Te rugăm să selectezi o dată viitoare.");
      return;
    }

    // Validate: end time must be after start time
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      setError("Ora de final trebuie să fie după ora de start.");
      return;
    }

    if (!user) {
      setError("Trebuie să fii autentificat pentru a crea un eveniment.");
      return;
    }

    setSubmitting(true);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      // Add event to Firestore
      const docRef = await addDoc(collection(db, "sport_events"), {
        creatorId: user.uid,
        creatorName: user.displayName || "Utilizator",
        sportType: formData.sportType,
        city: formData.city,
        genderPreference: formData.genderPreference,
        startTime: startDateTime,
        endTime: endDateTime,
        locationName: formData.locationName,
        locationType: formData.locationType,
        isPaid: formData.locationType === "paid",
        price: formData.locationType === "paid" ? parseInt(formData.price) || 0 : 0,
        priceNote: formData.locationType === "paid" ? "Per persoană" : undefined,
        maxParticipants: parseInt(formData.maxParticipants) || 10,
        joinedUsers: [user.uid],
        description: formData.description || "",
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Success - redirect to events list
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dev/events");
      }
    } catch (err) {
      console.error("Error creating event:", err);
      setError(err instanceof Error ? err.message : "A apărut o eroare la crearea evenimentului.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

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
          <option value="">Selectează sport...</option>
          {Object.entries(sportTypeLabels).map(([key, { label, emoji }]) => (
            <option key={key} value={key}>
              {emoji} {label}
            </option>
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
          <option value="">Selectează oraș...</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Gender Preference */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Preferință Partener
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["anyone", "M", "F"] as GenderPreference[]).map((pref) => (
            <button
              key={pref}
              type="button"
              onClick={() => setFormData({ ...formData, genderPreference: pref })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                formData.genderPreference === pref
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
              }`}
            >
              <span className="text-lg block mb-1">
                {pref === "anyone" ? "👥" : pref === "M" ? "👨" : "👩"}
              </span>
              <span className="text-xs text-zinc-700 dark:text-zinc-300">
                {genderPreferenceLabels[pref]}
              </span>
            </button>
          ))}
        </div>
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
          {isDateInPast(formData.date) && (
            <p className="text-xs text-red-500 mt-1">Data nu poate fi în trecut</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Start *
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
            Final *
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

      {/* Location Type & Price */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Tip Locație
        </label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, locationType: "free", price: "" })}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              formData.locationType === "free"
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <span className="text-2xl block">🆓</span>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Gratuit</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, locationType: "paid" })}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              formData.locationType === "paid"
                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <span className="text-2xl block">💰</span>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Plătit</span>
          </button>
        </div>
        
        {formData.locationType === "paid" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Preț (RON) *
            </label>
            <input
              required={formData.locationType === "paid"}
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="input"
              placeholder="35"
              min="1"
            />
            <p className="text-xs text-zinc-500 mt-1">Preț per persoană</p>
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
          placeholder="Detalii suplimentare despre eveniment..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            Anulează
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || isDateInPast(formData.date)}
          className="btn-primary flex-1"
        >
          {submitting 
            ? "Se creează..." 
            : "Creează Eveniment"}
        </button>
      </div>
    </form>
  );
}
