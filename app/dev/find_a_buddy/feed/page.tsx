"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  Compass,
  Filter,
  MapPin,
  Search,
  Sparkles,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { BuddyCard } from "@/components/features/find-a-buddy/BuddyCard";
import { MatchmakingCard } from "@/components/features/find-a-buddy/MatchmakingCard";
import SlotChatModal from "@/components/features/find-a-buddy/SlotChatModal";
import {
  buildFindBuddyRecommendations,
  calculateSlotMatchScore,
  canUserJoinSlot,
  filterFindBuddySlots,
  getGenderPreferenceLabel,
  getOpenSpots,
  getSlotMode,
  getSlotModeLabel,
  getSportLabel,
  isFutureSlot,
  joinFindBuddySlot,
  matchesGenderPreference,
  normalizeFindBuddySlot,
  type FindBuddyFilters,
  type FindBuddySlot,
} from "@/lib/findBuddy";
import {
  experienceOptions,
  getProfileHeadline,
  goalOptions,
  profileNeedsOnboarding,
  type DetailedUserProfile,
} from "@/lib/profile";
import { sportTypeLabels, type SportType } from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

const defaultFilters: FindBuddyFilters = {
  searchQuery: "",
  sportType: "all",
  city: "",
  mode: "all",
  onlyOpen: true,
};

function isSupportedSport(value: string): value is SportType {
  return value in sportTypeLabels;
}

function formatDateLabel(date: Date, language: "ro" | "en"): string {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return language === "ro" ? "Astăzi" : "Today";
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return language === "ro" ? "Mâine" : "Tomorrow";
  }

  return date.toLocaleDateString(language === "ro" ? "ro-RO" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeLabel(date: Date, language: "ro" | "en"): string {
  return date.toLocaleTimeString(language === "ro" ? "ro-RO" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocalizedExperience(level: string | undefined, language: "ro" | "en"): string {
  const match = experienceOptions.find((option) => option.value === level);
  if (!match) {
    return language === "ro" ? "Nivel nespecificat" : "Level not specified";
  }

  return language === "ro" ? match.labelRo : match.labelEn;
}

function getLocalizedGoal(goal: string, language: "ro" | "en"): string {
  const match = goalOptions.find((option) => option.value === goal);
  if (!match) {
    return goal.replace(/-/g, " ");
  }

  return language === "ro" ? match.labelRo : match.labelEn;
}

function getPriceLabel(slot: FindBuddySlot, language: "ro" | "en"): string {
  if (!slot.location.isPaid) {
    return language === "ro" ? "Fără cost locație" : "No venue cost";
  }

  if (slot.location.priceNote?.trim()) {
    return slot.location.priceNote.trim();
  }

  if (typeof slot.location.price === "number") {
    return `${slot.location.price} RON ${language === "ro" ? "/ persoană" : "/ person"}`;
  }

  return language === "ro" ? "Locație cu plată" : "Paid venue";
}

function getSlotDescription(
  slot: FindBuddySlot,
  language: "ro" | "en"
): string {
  if (slot.description?.trim()) {
    return slot.description.trim();
  }

  if (slot.hostGoals.length > 0) {
    const formattedGoals = slot.hostGoals.slice(0, 3).map((goal) => getLocalizedGoal(goal, language));
    return language === "ro"
      ? `Obiective host: ${formattedGoals.join(", ")}`
      : `Host goals: ${formattedGoals.join(", ")}`;
  }

  return language === "ro"
    ? "Slot publicat pentru a găsi oameni compatibili pentru sesiune."
    : "Slot published to find compatible people for the session.";
}

function getJoinActionState(
  slot: FindBuddySlot,
  user: User | null,
  profile: DetailedUserProfile | null,
  language: "ro" | "en"
): { disabled: boolean; label: string } {
  if (!user) {
    return {
      disabled: true,
      label: language === "ro" ? "Autentifică-te" : "Sign in",
    };
  }

  if (!profile || profileNeedsOnboarding(profile)) {
    return {
      disabled: true,
      label: language === "ro" ? "Completează profilul" : "Complete your profile",
    };
  }

  if (slot.hostId === user.uid || slot.participants.includes(user.uid)) {
    return {
      disabled: true,
      label: language === "ro" ? "Deja e sesiunea ta" : "Already your session",
    };
  }

  if (slot.status === "closed" || getOpenSpots(slot) <= 0) {
    return {
      disabled: true,
      label: language === "ro" ? "Complet" : "Full",
    };
  }

  if (!matchesGenderPreference(slot.genderPreference, profile)) {
    return {
      disabled: true,
      label: language === "ro" ? "Preferință necompatibilă" : "Preference mismatch",
    };
  }

  if (!canUserJoinSlot(slot, user.uid, profile)) {
    return {
      disabled: true,
      label: language === "ro" ? "Indisponibil" : "Unavailable",
    };
  }

  return {
    disabled: false,
    label: language === "ro" ? "Alătură-te" : "Join",
  };
}

export default function FindABuddyFeedPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DetailedUserProfile | null>(null);
  const [filters, setFilters] = useState<FindBuddyFilters>(defaultFilters);
  const [slots, setSlots] = useState<FindBuddySlot[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [joiningSlotId, setJoiningSlotId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeChatSlot, setActiveChatSlot] = useState<FindBuddySlot | null>(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (cancelled) {
        return;
      }

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoadingProfile(false);
        router.replace("/auth");
        return;
      }

      setUser(currentUser);
      setLoadingProfile(true);

      void (async () => {
        try {
          const snapshot = await getDoc(doc(db, "users", currentUser.uid));
          if (cancelled) {
            return;
          }

          setProfile(snapshot.exists() ? (snapshot.data() as DetailedUserProfile) : null);
        } catch (profileError) {
          console.error("Error loading current user profile:", profileError);
          if (!cancelled) {
            setError(language === "ro" ? "Nu am putut încărca profilul tău." : "Could not load your profile.");
          }
        } finally {
          if (!cancelled) {
            setLoadingProfile(false);
          }
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [language, router]);

  useEffect(() => {
    if (!user) {
      setSlots([]);
      setLoadingSlots(false);
      return;
    }

    setLoadingSlots(true);

    const slotsQuery = query(collection(db, "availability_slots"), orderBy("dateTime", "asc"));
    const unsubscribe = onSnapshot(
      slotsQuery,
      (snapshot) => {
        const nextSlots = snapshot.docs
          .map((slotDoc) => normalizeFindBuddySlot(slotDoc.id, slotDoc.data() as Record<string, unknown>))
          .filter((slot) => slot.status !== "cancelled");

        setSlots(nextSlots);
        setLoadingSlots(false);
      },
      (snapshotError) => {
        console.error("Error subscribing to find buddy slots:", snapshotError);
        setError(language === "ro" ? "Nu am putut încărca sloturile." : "Could not load slots.");
        setLoadingSlots(false);
      }
    );

    return () => unsubscribe();
  }, [language, user]);

  const profileIncomplete = profileNeedsOnboarding(profile);
  const preferredSports = (profile?.preferredSports || []).filter(isSupportedSport);
  const futureSlots = slots.filter((slot) => isFutureSlot(slot));
  const mySlots = futureSlots
    .filter((slot) => (user ? slot.hostId === user.uid || slot.participants.includes(user.uid) : false))
    .sort((left, right) => left.dateTime.getTime() - right.dateTime.getTime());
  const discoverableSlots = futureSlots.filter((slot) =>
    user ? slot.hostId !== user.uid && !slot.participants.includes(user.uid) : false
  );
  const filteredSlots = filterFindBuddySlots(discoverableSlots, filters);
  const slotResults = filteredSlots
    .map((slot) => ({
      slot,
      matchScore: calculateSlotMatchScore(slot, profile),
      joinable: user ? canUserJoinSlot(slot, user.uid, profile) : false,
    }))
    .sort((left, right) => {
      if (Number(right.joinable) !== Number(left.joinable)) {
        return Number(right.joinable) - Number(left.joinable);
      }

      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      return left.slot.dateTime.getTime() - right.slot.dateTime.getTime();
    });

  const joinableSlots = discoverableSlots.filter((slot) =>
    user ? canUserJoinSlot(slot, user.uid, profile) : false
  );
  const recommendations = user
    ? buildFindBuddyRecommendations(joinableSlots, user.uid, profile).slice(0, 4)
    : [];
  const cityOptions = Array.from(
    new Set(
      [profile?.city || "", ...futureSlots.map((slot) => slot.city)]
        .map((city) => city.trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));
  const openDiscoverableCount = discoverableSlots.filter((slot) => getOpenSpots(slot) > 0).length;
  const topMatch = recommendations[0]?.matchScore || 0;

  const handleJoin = async (slot: FindBuddySlot) => {
    if (!user || !profile || profileNeedsOnboarding(profile)) {
      setError(
        language === "ro"
          ? "Completează profilul detaliat înainte să intri într-un slot."
          : "Complete the detailed profile before joining a slot."
      );
      return;
    }

    setError("");
    setJoiningSlotId(slot.id);

    try {
      const updatedSlot = await joinFindBuddySlot(db, slot.id, {
        userId: user.uid,
        userName: getProfileHeadline(profile),
        profile,
      });

      setActiveChatSlot(updatedSlot);
    } catch (joinError) {
      console.error("Error joining find buddy slot:", joinError);
      setError(joinError instanceof Error ? joinError.message : "Nu te-ai putut alătura slotului.");
    } finally {
      setJoiningSlotId(null);
    }
  };

  const applyRecommendedHost = (hostName: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      searchQuery: hostName,
    }));

    document.getElementById("discover-slots")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <header className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-600">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Find a buddy feed</span>
              </div>
              <h1 className="mt-4 text-4xl font-bold text-slate-900">
                {language === "ro" ? "Găsește oameni compatibili pentru sport" : "Find compatible people for sport"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {language === "ro"
                  ? "Aici vezi doar sloturi reale, cu filtru pe sport, oraș și tip de sesiune. Match score-ul folosește profilul tău detaliat, iar join-ul intră direct în chatul sesiunii."
                  : "This feed shows real slots with sport, city, and session-type filters. Match score uses your detailed profile, and joining takes you straight into the session chat."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dev/find_a_buddy"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {language === "ro" ? "Creează slot nou" : "Create new slot"}
              </Link>
              <Link
                href="/dev/profile/setup"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {language === "ro" ? "Editează profilul" : "Edit profile"}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{language === "ro" ? "Sloturi descoperibile" : "Discoverable slots"}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{openDiscoverableCount}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{language === "ro" ? "Sesiunile mele" : "My sessions"}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{mySlots.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{language === "ro" ? "Cel mai bun match" : "Top match"}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{topMatch ? `${topMatch}%` : "—"}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{language === "ro" ? "Orașe active" : "Active cities"}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{cityOptions.length}</p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {profileIncomplete && !loadingProfile && (
          <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <Compass className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-900">
                  {language === "ro" ? "Profil incomplet pentru matching și join" : "Profile incomplete for matching and joining"}
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  {language === "ro"
                    ? "Poți vedea feed-ul, dar nu poți intra în sloturi până nu completezi profilul detaliat. Matching-ul folosește genul, orașul, sporturile, obiectivele și nivelul tău."
                    : "You can browse the feed, but you cannot join slots until your detailed profile is complete. Matching uses your gender, city, sports, goals, and level."}
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {language === "ro" ? "Filtre și căutare" : "Search and filters"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {language === "ro"
                      ? "Poți căuta exact un om pentru un sport sau sloturi de grup în același oraș."
                      : "Search for exactly one person for a sport or for group sessions in the same city."}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                  <Filter className="h-4 w-4" />
                  {slotResults.length} {language === "ro" ? "rezultate" : "results"}
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={(event) =>
                      setFilters((currentFilters) => ({
                        ...currentFilters,
                        searchQuery: event.target.value,
                      }))
                    }
                    placeholder={language === "ro" ? "Caută host, sport, oraș, locație..." : "Search host, sport, city, venue..."}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  />
                </label>

                <select
                  value={filters.sportType}
                  onChange={(event) =>
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      sportType: event.target.value as FindBuddyFilters["sportType"],
                    }))
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                >
                  <option value="all">{language === "ro" ? "Toate sporturile" : "All sports"}</option>
                  {Object.entries(sportTypeLabels).map(([value, details]) => (
                    <option key={value} value={value}>
                      {details.emoji} {getSportLabel(value as SportType, language)}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.city}
                  onChange={(event) =>
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      city: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                >
                  <option value="">{language === "ro" ? "Toate orașele" : "All cities"}</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", labelRo: "Tot", labelEn: "All", icon: Compass },
                    { value: "duo", labelRo: "1 persoană", labelEn: "1 buddy", icon: UserRoundSearch },
                    { value: "group", labelRo: "Grup", labelEn: "Group", icon: Users },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFilters((currentFilters) => ({
                            ...currentFilters,
                            mode: option.value as FindBuddyFilters["mode"],
                          }))
                        }
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                          filters.mode === option.value
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {language === "ro" ? option.labelRo : option.labelEn}
                      </button>
                    );
                  })}
                </div>

                <label className="inline-flex items-center gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={filters.onlyOpen}
                    onChange={(event) =>
                      setFilters((currentFilters) => ({
                        ...currentFilters,
                        onlyOpen: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {language === "ro" ? "Arată doar sloturi cu locuri libere" : "Show only slots with open spots"}
                </label>
              </div>

              {preferredSports.length > 0 && (
                <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {language === "ro" ? "Scurtături din profilul tău" : "Quick picks from your profile"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {preferredSports.map((sport) => (
                      <button
                        key={sport}
                        type="button"
                        onClick={() =>
                          setFilters((currentFilters) => ({
                            ...currentFilters,
                            sportType: sport,
                          }))
                        }
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        {sportTypeLabels[sport].emoji} {getSportLabel(sport, language)}
                      </button>
                    ))}

                    {profile?.city && (
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((currentFilters) => ({
                            ...currentFilters,
                            city: profile.city,
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.city}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {mySlots.length > 0 && (
              <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {language === "ro" ? "Sesiunile mele" : "My sessions"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {language === "ro"
                        ? "Sloturile în care ești host sau participant."
                        : "Slots where you are either hosting or participating."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  {mySlots.map((slot) => {
                    const isHost = user ? slot.hostId === user.uid : false;

                    return (
                      <MatchmakingCard
                        key={slot.id}
                        title={
                          isHost
                            ? language === "ro"
                              ? `${getSportLabel(slot.sportType, language)} publicat de tine`
                              : `${getSportLabel(slot.sportType, language)} created by you`
                            : language === "ro"
                              ? `${getSportLabel(slot.sportType, language)} cu ${slot.hostName}`
                              : `${getSportLabel(slot.sportType, language)} with ${slot.hostName}`
                        }
                        subtitle={getSlotDescription(slot, language)}
                        hostName={slot.hostName}
                        hostLevel={getLocalizedExperience(slot.hostExperienceLevel, language)}
                        sportLabel={getSportLabel(slot.sportType, language)}
                        sportEmoji={sportTypeLabels[slot.sportType]?.emoji || "🏃"}
                        dateLabel={formatDateLabel(slot.dateTime, language)}
                        timeLabel={formatTimeLabel(slot.dateTime, language)}
                        locationLabel={slot.location.name}
                        cityLabel={slot.city}
                        currentPlayers={slot.participants.length}
                        maxPlayers={slot.maxParticipants}
                        participantNames={slot.participantNames}
                        modeLabel={getSlotModeLabel(slot, language)}
                        genderPreferenceLabel={getGenderPreferenceLabel(slot.genderPreference, language)}
                        priceLabel={getPriceLabel(slot, language)}
                        statusLabel={
                          isHost
                            ? language === "ro"
                              ? "Ești host"
                              : "Hosting"
                            : language === "ro"
                              ? "Te-ai alăturat"
                              : "Joined"
                        }
                        actionLabel={language === "ro" ? "Deschide chatul" : "Open chat"}
                        onAction={() => setActiveChatSlot(slot)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            <section
              id="discover-slots"
              className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50"
            >
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {language === "ro" ? "Sloturi de descoperit" : "Slots to discover"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {language === "ro"
                      ? "Rezultatele sunt ordonate după șansa reală de match și apoi după ora sesiunii."
                      : "Results are ordered by real match likelihood and then by session time."}
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  {loadingSlots
                    ? language === "ro"
                      ? "Se încarcă..."
                      : "Loading..."
                    : `${slotResults.length} ${language === "ro" ? "sloturi" : "slots"}`}
                </div>
              </div>

              {loadingSlots || loadingProfile ? (
                <div className="flex items-center justify-center py-14">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                </div>
              ) : slotResults.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    {language === "ro" ? "Nu există sloturi pe filtrele actuale" : "No slots match the current filters"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {language === "ro"
                      ? "Schimbă sportul, orașul sau tipul de sesiune. Dacă vrei, publică tu primul slot."
                      : "Change the sport, city, or session type. Or publish the first slot yourself."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  {slotResults.map(({ slot, matchScore, joinable }) => {
                    const actionState = getJoinActionState(slot, user, profile, language);

                    return (
                      <MatchmakingCard
                        key={slot.id}
                        title={
                          getSlotMode(slot) === "duo"
                            ? language === "ro"
                              ? `${slot.hostName} caută 1 om pentru ${getSportLabel(slot.sportType, language)}`
                              : `${slot.hostName} is looking for 1 person for ${getSportLabel(slot.sportType, language)}`
                            : language === "ro"
                              ? `${slot.hostName} caută grup pentru ${getSportLabel(slot.sportType, language)}`
                              : `${slot.hostName} is looking for a group for ${getSportLabel(slot.sportType, language)}`
                        }
                        subtitle={getSlotDescription(slot, language)}
                        hostName={slot.hostName}
                        hostLevel={getLocalizedExperience(slot.hostExperienceLevel, language)}
                        sportLabel={getSportLabel(slot.sportType, language)}
                        sportEmoji={sportTypeLabels[slot.sportType]?.emoji || "🏃"}
                        dateLabel={formatDateLabel(slot.dateTime, language)}
                        timeLabel={formatTimeLabel(slot.dateTime, language)}
                        locationLabel={slot.location.name}
                        cityLabel={slot.city}
                        currentPlayers={slot.participants.length}
                        maxPlayers={slot.maxParticipants}
                        participantNames={slot.participantNames}
                        matchScore={matchScore}
                        modeLabel={getSlotModeLabel(slot, language)}
                        genderPreferenceLabel={getGenderPreferenceLabel(slot.genderPreference, language)}
                        priceLabel={getPriceLabel(slot, language)}
                        description={getSlotDescription(slot, language)}
                        featured={joinable && matchScore >= 85}
                        actionLabel={actionState.label}
                        actionDisabled={actionState.disabled}
                        actionLoading={joiningSlotId === slot.id}
                        onAction={() => handleJoin(slot)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                {language === "ro" ? "Cum gândește matching-ul" : "How matching works"}
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                <li>
                  {language === "ro"
                    ? "Orașul și sporturile tale preferate cântăresc mult în scor."
                    : "Your city and preferred sports weigh heavily in the score."}
                </li>
                <li>
                  {language === "ro"
                    ? "Nivelul și obiectivele host-ului sunt comparate cu profilul tău."
                    : "The host's level and goals are compared against your profile."}
                </li>
                <li>
                  {language === "ro"
                    ? "Poți filtra separat dacă vrei un singur partener sau o sesiune de grup."
                    : "You can filter separately for one buddy or a group session."}
                </li>
              </ul>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                    {language === "ro" ? "Host-uri recomandate" : "Recommended hosts"}
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    {language === "ro" ? "Oameni cu șanse bune de match" : "People with strong match odds"}
                  </h2>
                </div>
              </div>

              {recommendations.length === 0 ? (
                <div className="mt-5 rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                  {profileIncomplete
                    ? language === "ro"
                      ? "Completează profilul și recomandările vor deveni mult mai bune."
                      : "Complete your profile to unlock better recommendations."
                    : language === "ro"
                      ? "Nu există încă host-uri recomandate pe baza filtrelor și a sloturilor disponibile."
                      : "There are no recommended hosts yet based on current filters and available slots."}
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {recommendations.map((recommendation) => (
                    <BuddyCard
                      key={recommendation.hostId}
                      name={recommendation.hostName}
                      sports={recommendation.sports.map((sport) => getSportLabel(sport, language))}
                      level={getLocalizedExperience(recommendation.level, language)}
                      city={recommendation.city}
                      matchScore={recommendation.matchScore}
                      availableSlots={recommendation.availableSlots}
                      nextAvailableLabel={
                        recommendation.nextAvailableAt
                          ? `${formatDateLabel(recommendation.nextAvailableAt, language)} • ${formatTimeLabel(
                              recommendation.nextAvailableAt,
                              language
                            )}`
                          : undefined
                      }
                      goalTags={recommendation.goals.slice(0, 2).map((goal) => getLocalizedGoal(goal, language))}
                      onView={() => applyRecommendedHost(recommendation.hostName)}
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>

        {activeChatSlot && <SlotChatModal slot={activeChatSlot} onClose={() => setActiveChatSlot(null)} />}
      </div>
    </div>
  );
}
