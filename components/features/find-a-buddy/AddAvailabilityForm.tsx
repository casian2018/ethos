"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { createFindBuddySlot, type FindBuddySlot } from "@/lib/findBuddy";
import { getProfileHeadline, profileNeedsOnboarding, type DetailedUserProfile } from "@/lib/profile";
import { sportTypeLabels, type GenderPreference, type SportType } from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface AddAvailabilityFormProps {
  initialMode?: "duo" | "group";
  onSuccess?: (slotId?: string) => void;
  onCancel?: () => void;
}

const suggestedCities = [
  "București",
  "Cluj-Napoca",
  "Timișoara",
  "Iași",
  "Constanța",
  "Brașov",
  "Sibiu",
  "Oradea",
];

const durationOptions = [45, 60, 75, 90, 120];
const duoParticipantOptions = [2];
const groupParticipantOptions = [4, 6, 10];

function isSupportedSport(value: string): value is SportType {
  return value in sportTypeLabels;
}

export default function AddAvailabilityForm({
  initialMode = "duo",
  onSuccess,
  onCancel,
}: AddAvailabilityFormProps) {
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DetailedUserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [sessionMode, setSessionMode] = useState<"duo" | "group">(initialMode);
  const [sportType, setSportType] = useState<SportType | "">("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(initialMode === "group" ? 4 : 2);
  const [genderPreference, setGenderPreference] = useState<GenderPreference>("anyone");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoadingProfile(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", currentUser.uid));
        if (snapshot.exists()) {
          const data = snapshot.data() as DetailedUserProfile;
          setProfile(data);
          setCity(data.city || "");

          const supportedSports = (data.preferredSports || []).filter(isSupportedSport);
          if (supportedSports.length > 0) {
            setSportType(supportedSports[0]);
          }
        }
      } catch (err) {
        console.error("Error loading find buddy profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setMaxParticipants(sessionMode === "group" ? 4 : 2);
  }, [sessionMode]);

  const supportedSports = Object.entries(sportTypeLabels).map(([value, details]) => ({
    value: value as SportType,
    label: details.label,
    emoji: details.emoji,
  }));

  const preferredSports = (profile?.preferredSports || []).filter(isSupportedSport);
  const availableSports =
    preferredSports.length > 0
      ? supportedSports.filter((sport) => preferredSports.includes(sport.value))
      : supportedSports;

  const participantOptions = sessionMode === "group" ? groupParticipantOptions : duoParticipantOptions;
  const minDate = new Date().toISOString().split("T")[0];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!user) {
      setError(language === "ro" ? "Trebuie să fii autentificat." : "You must be signed in.");
      return;
    }

    if (!profile || profileNeedsOnboarding(profile)) {
      setError(language === "ro" ? "Completează profilul detaliat înainte să creezi un slot." : "Complete the detailed profile before creating a slot.");
      return;
    }

    if (!sportType || !city.trim() || !date || !time || !locationName.trim()) {
      setError(language === "ro" ? "Completează toate câmpurile obligatorii." : "Fill in all required fields.");
      return;
    }

    const dateTime = new Date(`${date}T${time}`);
    if (Number.isNaN(dateTime.getTime()) || dateTime <= new Date()) {
      setError(language === "ro" ? "Alege o dată și o oră din viitor." : "Choose a future date and time.");
      return;
    }

    if (isPaid && price && Number.isNaN(Number(price))) {
      setError(language === "ro" ? "Prețul trebuie să fie numeric." : "Price must be numeric.");
      return;
    }

    setSaving(true);

    try {
      const slotPayload: Omit<FindBuddySlot, "id" | "status" | "createdAt" | "updatedAt"> = {
        hostId: user.uid,
        hostName: getProfileHeadline(profile),
        hostExperienceLevel: profile.experienceLevel,
        hostGoals: profile.goals,
        hostGender: profile.gender,
        hostAvatarUrl: user.photoURL || undefined,
        sportType,
        city: city.trim(),
        dateTime,
        duration,
        maxParticipants,
        participants: [user.uid],
        participantNames: [getProfileHeadline(profile)],
        genderPreference,
        location: {
          name: locationName.trim(),
          address: locationAddress.trim(),
          isPaid,
          price: isPaid && price ? Number(price) : null,
          priceNote: isPaid ? (priceNote.trim() || `${price || "0"} RON / persoană`) : null,
        },
        description: description.trim(),
      };

      const slotId = await createFindBuddySlot(db, slotPayload);

      setDate("");
      setTime("");
      setLocationName("");
      setLocationAddress("");
      setIsPaid(false);
      setPrice("");
      setPriceNote("");
      setDescription("");
      setSessionMode(initialMode);
      setMaxParticipants(initialMode === "group" ? 4 : 2);

      onSuccess?.(slotId);
    } catch (err) {
      console.error("Error creating find buddy slot:", err);
      setError(err instanceof Error ? err.message : "Nu am putut crea slotul.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {language === "ro" ? "Trebuie să fii autentificat pentru a crea un slot." : "You must be signed in to create a slot."}
      </div>
    );
  }

  if (!profile || profileNeedsOnboarding(profile)) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-900">
          {language === "ro" ? "Profil incomplet pentru matching bun" : "Profile incomplete for proper matching"}
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-800">
          {language === "ro"
            ? "Completează profilul detaliat mai întâi. Logica de find a buddy folosește sporturile preferate, orașul, obiectivele și nivelul tău."
            : "Complete the detailed profile first. Find a buddy uses your preferred sports, city, goals, and level."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {language === "ro" ? "Cauți 1 persoană sau grup?" : "Looking for one person or a group?"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSessionMode("duo")}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                sessionMode === "duo"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              {language === "ro" ? "1 partener" : "1 buddy"}
            </button>
            <button
              type="button"
              onClick={() => setSessionMode("group")}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                sessionMode === "group"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              {language === "ro" ? "Grup" : "Group"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {language === "ro" ? "Câte locuri totale?" : "How many total spots?"}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {participantOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMaxParticipants(option)}
                className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  maxParticipants === option
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {language === "ro" ? `Tu +${option - 1}` : `You +${option - 1}`}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {language === "ro"
              ? "Capacitatea include și host-ul."
              : "Capacity includes the host too."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {language === "ro" ? "Sport" : "Sport"} *
          </label>
          <select
            value={sportType}
            onChange={(event) => setSportType(event.target.value as SportType)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
            required
          >
            <option value="">{language === "ro" ? "Selectează sportul" : "Select sport"}</option>
            {availableSports.map((sport) => (
              <option key={sport.value} value={sport.value}>
                {sport.emoji} {sport.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {language === "ro" ? "Oraș" : "City"} *
          </label>
          <input
            list="buddy-cities"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
            placeholder={language === "ro" ? "București" : "Bucharest"}
            required
          />
          <datalist id="buddy-cities">
            {suggestedCities.map((suggestedCity) => (
              <option key={suggestedCity} value={suggestedCity} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {language === "ro" ? "Data" : "Date"} *
          </label>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {language === "ro" ? "Ora" : "Time"} *
          </label>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {language === "ro" ? "Durată" : "Duration"}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {durationOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(option)}
                className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  duration === option
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {option}m
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {language === "ro" ? "Preferință de gen" : "Gender preference"}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "anyone", labelRo: "Oricine", labelEn: "Anyone" },
              { value: "M", labelRo: "Bărbați", labelEn: "Men" },
              { value: "F", labelRo: "Femei", labelEn: "Women" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGenderPreference(option.value as GenderPreference)}
                className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  genderPreference === option.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {language === "ro" ? option.labelRo : option.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {language === "ro" ? "Locație" : "Location"} *
          </label>
          <input
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
            placeholder={language === "ro" ? "World Class, Parcul Herăstrău..." : "Gym, park, venue..."}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {language === "ro" ? "Adresă" : "Address"}
          </label>
          <input
            value={locationAddress}
            onChange={(event) => setLocationAddress(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
            placeholder={language === "ro" ? "Adresă sau reper" : "Address or landmark"}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isPaid}
            onChange={(event) => setIsPaid(event.target.checked)}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <div>
            <p className="font-medium text-slate-900">
              {language === "ro" ? "Locația este plătită" : "This location is paid"}
            </p>
            <p className="text-sm text-slate-500">
              {language === "ro" ? "Arată clar costul per persoană." : "Clearly show the per-person cost."}
            </p>
          </div>
        </label>

        {isPaid && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
              placeholder={language === "ro" ? "Preț / persoană" : "Price / person"}
            />
            <input
              value={priceNote}
              onChange={(event) => setPriceNote(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
              placeholder={language === "ro" ? "Notă opțională" : "Optional note"}
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {language === "ro" ? "Descriere" : "Description"}
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
          placeholder={
            language === "ro"
              ? "Ex: caut încă 3 oameni pentru baschet, nivel intermediar, ritm relaxat."
              : "Example: looking for 3 more people for basketball, intermediate level, relaxed pace."
          }
        />
      </div>

      <div className="rounded-3xl bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-900">
          {language === "ro" ? "Rezumat slot" : "Slot summary"}
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          {language === "ro"
            ? `${getProfileHeadline(profile)} caută ${sessionMode === "duo" ? "1 partener" : `până la ${maxParticipants - 1} persoane`} pentru ${sportType ? sportTypeLabels[sportType].label : "sport"} în ${city || "orașul tău"}`
            : `${getProfileHeadline(profile)} is looking for ${sessionMode === "duo" ? "1 buddy" : `up to ${maxParticipants - 1} people`} for ${sportType ? sportTypeLabels[sportType].label : "a sport"} in ${city || "your city"}`}
          .
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {language === "ro" ? "Anulează" : "Cancel"}
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
        >
          {saving
            ? (language === "ro" ? "Se salvează..." : "Saving...")
            : (language === "ro" ? "Publică slotul" : "Publish slot")}
        </button>
      </div>
    </form>
  );
}
