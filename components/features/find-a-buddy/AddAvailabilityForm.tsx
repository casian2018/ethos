/**
 * AddAvailabilityForm - Form for creating availability slots
 * 
 * Features:
 * - Sport selection from user's preferred sports
 * - City selection (default from profile)
 * - Date and time picker
 * - Location with price input
 * - Save to Firestore
 */

"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  addDoc, 
  collection, 
  serverTimestamp 
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { 
  SportType, 
  GenderPreference, 
  preferredSportsList,
  genderPreferenceLabels,
  PreferredSport,
  UserProfile,
  MedicalCondition
} from "@/lib/types";

const auth = firebaseAuth;
const db = firebaseDb;

interface AddAvailabilityFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

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
  "Bacău"
];

const durationOptions = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 oră" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 ore" },
  { value: 180, label: "3 ore" },
];

export default function AddAvailabilityForm({ onSuccess, onCancel }: AddAvailabilityFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [sportType, setSportType] = useState<SportType | "">("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [genderPreference, setGenderPreference] = useState<GenderPreference>("anyone");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [description, setDescription] = useState("");

  // Fetch user and profile
  useEffect(() => {
    if (!auth || !db) {
      setError("Configurație Firebase lipsă. Contactează administratorul.");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const profile: UserProfile = {
              birthDate: data.birthDate || "",
              medicalConditions: (data.medicalConditions || []) as MedicalCondition[],
              height: data.height || 0,
              weight: data.weight || 0,
              gender: data.gender || "other",
              preferredSports: (data.preferredSports || []) as PreferredSport[],
              experienceLevel: data.experienceLevel || "beginner",
              trainsRegularly: data.trainsRegularly || false,
              goals: data.goals || [],
              priorityGoal: data.priorityGoal || "",
              trainingEnvironment: data.trainingEnvironment || "gym",
              homeEquipment: data.homeEquipment || [],
              daysPerWeek: data.daysPerWeek || 0,
              workoutDuration: data.workoutDuration || 0,
              injuries: data.injuries || [],
              activityLevel: data.activityLevel || "sedentary",
              sleepHours: data.sleepHours || 0,
              stressLevel: data.stressLevel || "low",
              dailySteps: data.dailySteps || 0,
              motivationType: data.motivationType || "",
              city: data.city || "",
              lookingForBuddy: data.lookingForBuddy || false,
            };
            setUserProfile(profile);
            
            // Set default city from profile
            if (data.city) {
              setCity(data.city);
            }
            
            // Set default sport from preferred sports
            if (data.preferredSports && data.preferredSports.length > 0) {
              setSportType(data.preferredSports[0] as SportType);
            }
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Get user's preferred sports as options
  const userSports = userProfile?.preferredSports || [];
  const availableSports = userSports.length > 0 
    ? preferredSportsList.filter(s => userSports.includes(s.value))
    : preferredSportsList;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!user) {
      setError("Trebuie să fii autentificat");
      return;
    }
    
    // Validation
    if (!sportType || !city || !date || !time || !locationName) {
      setError("Completează toate câmpurile obligatorii");
      return;
    }
    
    // Check date is not in the past
    const dateTime = new Date(`${date}T${time}`);
    if (dateTime < new Date()) {
      setError("Data și ora trebuie să fie în viitor");
      return;
    }
    
    setLoading(true);
    try {
      if (!db || !auth) {
        setError("Configurație Firebase lipsă. Contactează administratorul.");
        return;
      }

      await addDoc(collection(db, "availability_slots"), {
        hostId: user.uid,
        hostName: user.displayName || "Utilizator",
        sportType,
        city,
        dateTime: dateTime,
        duration,
        genderPreference,
        location: {
          name: locationName,
          address: locationAddress || "",
          isPaid,
          price: isPaid && price ? parseFloat(price) : undefined,
          priceNote: isPaid ? (priceNote || `${price} RON`) : undefined,
        },
        status: "open",
        buddyId: null,
        description: description || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Reset form
      setSportType("");
      setDate("");
      setTime("");
      setLocationName("");
      setLocationAddress("");
      setIsPaid(false);
      setPrice("");
      setPriceNote("");
      setDescription("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error creating slot:", err);
      setError("Eroare la crearea slotului. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  // Get today's date for min date
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="card p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-zinc-900 text-slate-900">
          ➕ Creează Slot Available
        </h2>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="text-zinc-500 hover:text-zinc-700 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 bg-red-50 border border-red-200 border-red-200 rounded-lg text-red-600 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Sport Type */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-2">
            Sport *
          </label>
          <select
            value={sportType}
            onChange={(e) => setSportType(e.target.value as SportType)}
            className="input"
            required
          >
            <option value="">Selectează sportul...</option>
            {availableSports.map((sport) => (
              <option key={sport.value} value={sport.value}>
                {sport.emoji} {sport.label}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-2">
            Oraș *
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input"
            required
          >
            <option value="">Selectează orașul...</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-2">
              Ora *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-2">
            Durată
          </label>
          <div className="grid grid-cols-3 gap-2">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDuration(opt.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  duration === opt.value
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-100 bg-white text-zinc-600 text-slate-500 hover:bg-zinc-200 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gender Preference */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-2">
            Preferință gen
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["anyone", "M", "F"] as GenderPreference[]).map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => setGenderPreference(pref)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  genderPreference === pref
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-100 bg-white text-zinc-600 text-slate-500 hover:bg-zinc-200 hover:bg-slate-200"
                }`}
              >
                {genderPreferenceLabels[pref]}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-2">
            Locație *
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Nume locație (ex: Sala Sporturilor)"
            className="input mb-2"
            required
          />
          <input
            type="text"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            placeholder="Adresă (opțional)"
            className="input"
          />
        </div>

        {/* Price Toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div 
              onClick={() => setIsPaid(!isPaid)}
              className={`w-12 h-6 rounded-full transition-colors ${
                isPaid ? "bg-emerald-500" : "bg-zinc-300 bg-slate-200"
              }`}
            >
              <div 
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  isPaid ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-zinc-700 text-slate-600">
              Locație plătită
            </span>
          </label>
          
          {isPaid && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Preț (RON)"
                className="input"
                min="0"
                step="1"
              />
              <input
                type="text"
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                placeholder="Note (ex: 25 RON/oră)"
                className="input"
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-2">
            Descriere (opțional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalii despre sesiune..."
            className="input min-h-[80px] resize-none"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Se salvează...
            </span>
          ) : (
            "💾 Creează Slot"
          )}
        </button>
      </form>
    </div>
  );
}
