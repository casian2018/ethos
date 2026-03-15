"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import ScheduledWorkoutsSection from "@/components/ScheduledWorkoutsSection";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import {
  activityLevelOptions,
  calculateAge,
  dietaryPreferenceOptions,
  equipmentOptions,
  experienceOptions,
  formatTagList,
  genderOptions,
  getOptionLabel,
  getProfileHeadline,
  goalOptions,
  medicalConditionOptions,
  motivationOptions,
  profileNeedsOnboarding,
  sexOptions,
  sportOptions,
  stressLevelOptions,
  trainingEnvironmentOptions,
  type DetailedUserProfile,
} from "@/lib/profile";

const auth = firebaseAuth!;
const db = firebaseDb!;

function InfoBlock({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function TagSection({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <span
              key={value}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              {value}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">Nu este completat.</span>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<DetailedUserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }

      setUserId(user.uid);

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (!snapshot.exists()) {
          router.replace("/dev/profile/setup");
          return;
        }

        const data = snapshot.data() as DetailedUserProfile;
        if (profileNeedsOnboarding(data)) {
          router.replace("/dev/profile/setup");
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error("Error loading detailed profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile || !userId) {
    return null;
  }

  const displayName = getProfileHeadline(profile);
  const age = profile.age || calculateAge(profile.birthDate);
  const preferredSports = formatTagList(profile.preferredSports, sportOptions, language);
  const goals = formatTagList(profile.goals, goalOptions, language);
  const medicalConditions = formatTagList(profile.medicalConditions, medicalConditionOptions, language);
  const equipment = formatTagList(profile.homeEquipment, equipmentOptions, language);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 text-white shadow-2xl shadow-slate-300/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">🧬 Detailed profile</p>
              <h1 className="mt-3 text-4xl font-bold">{displayName}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                Profilul de mai jos este sursa unică pentru onboarding, workout generation și nutrition.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dev/profile/setup"
                className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                📝 Editează profilul complet
              </Link>
              <Link
                href="/dev/nutrition"
                className="rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                🥗 Vezi nutriția
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-200">Vârstă</p>
              <p className="mt-2 text-3xl font-bold">{age}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-200">BMI</p>
              <p className="mt-2 text-3xl font-bold">{profile.bmi}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-200">Înălțime</p>
              <p className="mt-2 text-3xl font-bold">{profile.height} cm</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-200">Greutate</p>
              <p className="mt-2 text-3xl font-bold">{profile.weight} kg</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-200">Workout / săpt.</p>
              <p className="mt-2 text-3xl font-bold">{profile.daysPerWeek}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-200">Somn</p>
              <p className="mt-2 text-3xl font-bold">{profile.sleepHours} h</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock title="Email" value={profile.email || "Necompletat"} />
              <InfoBlock title="Telefon" value={profile.phoneNumber || "Necompletat"} />
              <InfoBlock title="Oraș" value={profile.city} />
              <InfoBlock title="Ocupație" value={profile.occupation || "Necompletat"} />
              <InfoBlock title="Educație" value={profile.education || "Necompletat"} />
              <InfoBlock
                title="Gen / sex"
                value={`${getOptionLabel(genderOptions, profile.gender, language)} / ${getOptionLabel(sexOptions, profile.sex, language)}`}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock
                title="Experiență"
                value={getOptionLabel(experienceOptions, profile.experienceLevel, language)}
              />
              <InfoBlock
                title="Activitate zilnică"
                value={getOptionLabel(activityLevelOptions, profile.activityLevel, language)}
              />
              <InfoBlock
                title="Motivație"
                value={getOptionLabel(motivationOptions, profile.motivationType, language)}
              />
              <InfoBlock
                title="Mediu de antrenament"
                value={getOptionLabel(trainingEnvironmentOptions, profile.trainingEnvironment, language)}
              />
              <InfoBlock
                title="Stres"
                value={getOptionLabel(stressLevelOptions, profile.stressLevel, language)}
              />
              <InfoBlock
                title="Dietă"
                value={getOptionLabel(dietaryPreferenceOptions, profile.dietaryPreference, language)}
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Signals used by generators</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Workout generation</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Citește experiența, obiectivele, mediul de antrenament, echipamentul, accidentele, somnul, stresul și istoricul medical.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Nutrition generation</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Calculează target-urile pornind de la vârstă, sex, greutate, nivel de activitate, obiectiv principal, alergii și preferințe alimentare.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Buddy matching</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Folosește sporturile preferate, orașul și opțiunea de workout buddy când aceasta este activată.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <TagSection title="Obiective" values={goals} />
          <TagSection title="Sporturi preferate" values={preferredSports} />
          <TagSection title="Echipament disponibil" values={equipment} />
          <TagSection title="Condiții medicale" values={medicalConditions} />
          <TagSection title="Accidentări / limitări" values={profile.injuries} />
          <TagSection title="Hobby-uri" values={profile.hobbies} />
          <TagSection title="Alergii / intoleranțe" values={profile.foodAllergies} />
          <TagSection title="Alimente de evitat" values={profile.foodsToAvoid} />
          <TagSection title="Suplimente" values={profile.supplements} />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <InfoBlock title="Obiectiv principal" value={getOptionLabel(goalOptions, profile.priorityGoal, language)} />
          <InfoBlock title="Durată preferată" value={`${profile.workoutDuration} minute`} />
          <InfoBlock title="Pași zilnici" value={String(profile.dailySteps)} />
          <InfoBlock title="Apă / zi" value={`${profile.waterIntakeLiters} L`} />
          <InfoBlock title="Mese / zi" value={String(profile.mealsPerDay)} />
          <InfoBlock title="Body fat" value={profile.bodyFatPercentage ? `${profile.bodyFatPercentage}%` : "Necompletat"} />
          <InfoBlock title="Workout buddy" value={profile.lookingForBuddy ? "Activ" : "Inactiv"} />
          <InfoBlock title="Birth date" value={profile.birthDate} />
        </section>

        <ScheduledWorkoutsSection userId={userId} />
      </div>
    </div>
  );
}
