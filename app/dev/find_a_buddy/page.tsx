"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { Users, UserRoundSearch, Compass, CalendarDays } from "lucide-react";
import { auth as firebaseAuth } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import AddAvailabilityForm from "@/components/features/find-a-buddy/AddAvailabilityForm";

const auth = firebaseAuth!;

export default function FindBuddyPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [initialMode, setInitialMode] = useState<"duo" | "group">("duo");
  const [showCoachMark, setShowCoachMark] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return !localStorage.getItem("ethos_coachmark_fab");
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const closeCoachMark = () => {
    setShowCoachMark(false);
    localStorage.setItem("ethos_coachmark_fab", "true");
  };

  const startFlow = (mode: "duo" | "group") => {
    setInitialMode(mode);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Find a buddy</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">
            {language === "ro" ? "Găsește oameni reali pentru sportul tău" : "Find real people for your sport"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {language === "ro"
              ? "Fluxul este gândit pentru două cazuri: cauți exact 1 om pentru un sport sau cauți mai mulți pentru o sesiune de grup. Sloturile create aici ajung apoi în feed-ul cu filtre și match score."
              : "The flow supports two cases: you either need exactly one person for a sport or several people for a group session. The slots created here then appear in the feed with filters and match score."}
          </p>
        </header>

        {showCoachMark && (
          <div className="relative mt-6 rounded-[28px] bg-gradient-to-r from-emerald-500 to-sky-500 p-6 text-white shadow-xl">
            <button
              type="button"
              onClick={closeCoachMark}
              className="absolute right-4 top-4 text-white/80 hover:text-white"
            >
              ×
            </button>
            <div className="flex items-start gap-4">
              <Compass className="mt-1 h-6 w-6" />
              <div>
                <h2 className="text-lg font-semibold">
                  {language === "ro" ? "Cum funcționează bine acest modul" : "How this module works best"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90">
                  {language === "ro"
                    ? "Publici un slot cu sport, oraș, dată și numărul de locuri. Feed-ul îl filtrează, îl punctează după compatibilitate și permite intrarea într-un slot de 1 la 1 sau într-un grup."
                    : "You publish a slot with sport, city, date, and seat count. The feed then filters it, scores compatibility, and lets people join a one-on-one or a group slot."}
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {!showForm ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => startFlow("duo")}
                    className="rounded-[32px] border border-slate-200 bg-white p-8 text-left shadow-lg shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-emerald-300"
                  >
                    <UserRoundSearch className="h-10 w-10 text-emerald-600" />
                    <h2 className="mt-6 text-2xl font-bold text-slate-900">
                      {language === "ro" ? "Caut 1 persoană" : "I need 1 person"}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {language === "ro"
                        ? "Ideal pentru sală, tenis, alergare, înot sau orice sesiune în doi."
                        : "Ideal for gym, tennis, running, swimming, or any one-on-one session."}
                    </p>
                    <p className="mt-6 text-sm font-semibold text-emerald-600">
                      {language === "ro" ? "Deschide formularul pentru 1 partener →" : "Open 1-buddy form →"}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => startFlow("group")}
                    className="rounded-[32px] border border-slate-200 bg-white p-8 text-left shadow-lg shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-emerald-300"
                  >
                    <Users className="h-10 w-10 text-sky-600" />
                    <h2 className="mt-6 text-2xl font-bold text-slate-900">
                      {language === "ro" ? "Caut mai mulți" : "I need a group"}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {language === "ro"
                        ? "Potrivit pentru baschet, fotbal, volei sau orice sesiune unde ai nevoie de mai multe locuri."
                        : "Best for basketball, football, volleyball, or any session where you need multiple spots."}
                    </p>
                    <p className="mt-6 text-sm font-semibold text-sky-600">
                      {language === "ro" ? "Deschide formularul pentru grup →" : "Open group form →"}
                    </p>
                  </button>
                </div>

                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <CalendarDays className="h-6 w-6 text-emerald-600" />
                      <p className="mt-3 font-semibold text-slate-900">
                        {language === "ro" ? "Sloturi cu dată exactă" : "Exact-date slots"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {language === "ro" ? "Nu doar profiluri, ci sesiuni reale la care te poți alătura." : "Not just profiles, but real sessions you can join."}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <Compass className="h-6 w-6 text-sky-600" />
                      <p className="mt-3 font-semibold text-slate-900">
                        {language === "ro" ? "Filtre și căutare" : "Search and filters"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {language === "ro" ? "Poți filtra după sport, oraș și tipul slotului: duo sau grup." : "You can filter by sport, city, and slot type: duo or group."}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <Users className="h-6 w-6 text-violet-600" />
                      <p className="mt-3 font-semibold text-slate-900">
                        {language === "ro" ? "Compatibilitate reală" : "Real compatibility"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {language === "ro" ? "Match score-ul folosește orașul, sporturile, obiectivele și nivelul tău." : "Match score uses your city, sports, goals, and level."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {initialMode === "duo"
                        ? (language === "ro" ? "Creează un slot pentru 1 partener" : "Create a 1-buddy slot")
                        : (language === "ro" ? "Creează un slot de grup" : "Create a group slot")}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {language === "ro"
                        ? "Poți ajusta oricând modul și numărul de locuri din formular."
                        : "You can still change the mode and seat count inside the form."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {language === "ro" ? "Închide" : "Close"}
                  </button>
                </div>

                <AddAvailabilityForm
                  initialMode={initialMode}
                  onCancel={() => setShowForm(false)}
                  onSuccess={() => {
                    setShowForm(false);
                    router.push("/dev/find_a_buddy/feed");
                  }}
                />
              </div>
            )}
          </div>

          <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              {language === "ro" ? "Flux recomandat" : "Recommended flow"}
            </p>
            <ol className="mt-6 space-y-5">
              <li className="rounded-3xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">1. {language === "ro" ? "Alegi dacă vrei 1 om sau grup" : "Pick duo or group"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {language === "ro" ? "Asta setează capacitatea slotului și modul în care apare în feed." : "This sets slot capacity and how it appears in the feed."}
                </p>
              </li>
              <li className="rounded-3xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">2. {language === "ro" ? "Publici slotul" : "Publish the slot"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {language === "ro" ? "Sport, dată, durată, oraș, locație și condițiile slotului." : "Sport, date, duration, city, venue, and slot conditions."}
                </p>
              </li>
              <li className="rounded-3xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">3. {language === "ro" ? "Feed-ul găsește oameni" : "The feed finds people"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {language === "ro" ? "Poți filtra și intra doar în sloturile potrivite sau cu locuri libere." : "You can filter and join only the relevant open slots."}
                </p>
              </li>
            </ol>

            <Link
              href="/dev/find_a_buddy/feed"
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {language === "ro" ? "Intră direct în feed" : "Go directly to the feed"}
            </Link>
          </aside>
        </section>
      </div>
    </div>
  );
}
