"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { CalendarDays, MessageCircle, Users } from "lucide-react";
import { db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import SlotChatModal from "@/components/features/find-a-buddy/SlotChatModal";
import {
  getOpenSpots,
  getSlotModeLabel,
  getSportLabel,
  isFutureSlot,
  normalizeFindBuddySlot,
  type FindBuddySlot,
} from "@/lib/findBuddy";
import { sportTypeLabels } from "@/lib/types";

const db = firebaseDb!;

interface ScheduledWorkoutsSectionProps {
  userId: string | null;
}

interface SlotWithContext extends FindBuddySlot {
  isHost: boolean;
  companionNames: string[];
}

function getCompanionNames(slot: FindBuddySlot, userId: string): string[] {
  return slot.participants
    .map((participantId, index) => ({
      id: participantId,
      name: slot.participantNames[index] || (participantId === slot.hostId ? slot.hostName : "Ethos Member"),
    }))
    .filter((participant) => participant.id !== userId)
    .map((participant) => participant.name);
}

export default function ScheduledWorkoutsSection({ userId }: ScheduledWorkoutsSectionProps) {
  const { language } = useLanguage();
  const [slots, setSlots] = useState<SlotWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatSlot, setChatSlot] = useState<SlotWithContext | null>(null);

  useEffect(() => {
    if (!userId) {
      setSlots([]);
      setLoading(false);
      return;
    }

    const currentUserId = userId;
    let cancelled = false;

    async function fetchScheduledSlots() {
      setLoading(true);

      try {
        const snapshot = await getDocs(
          query(collection(db, "availability_slots"), orderBy("dateTime", "asc"))
        );

        const nextSlots = snapshot.docs
          .map((slotDoc) => normalizeFindBuddySlot(slotDoc.id, slotDoc.data() as Record<string, unknown>))
          .filter((slot) => slot.hostId === currentUserId || slot.participants.includes(currentUserId))
          .map((slot) => ({
            ...slot,
            isHost: slot.hostId === currentUserId,
            companionNames: getCompanionNames(slot, currentUserId),
          }))
          .sort((left, right) => left.dateTime.getTime() - right.dateTime.getTime());

        if (!cancelled) {
          setSlots(nextSlots);
        }
      } catch (error) {
        console.error("Error fetching scheduled workouts:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchScheduledSlots();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const upcomingSlots = slots.filter((slot) => isFutureSlot(slot));
  const pastSlots = slots.filter((slot) => !isFutureSlot(slot)).reverse();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(language === "ro" ? "ro-RO" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(language === "ro" ? "ro-RO" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCompanionLabel = (slot: SlotWithContext): string => {
    if (slot.companionNames.length === 0) {
      return language === "ro" ? "Încă nu s-a alăturat nimeni." : "No one has joined yet.";
    }

    if (slot.companionNames.length === 1) {
      return slot.companionNames[0];
    }

    return `${slot.companionNames.slice(0, 2).join(", ")}${
      slot.companionNames.length > 2
        ? language === "ro"
          ? ` + încă ${slot.companionNames.length - 2}`
          : ` + ${slot.companionNames.length - 2} more`
        : ""
    }`;
  };

  if (loading) {
    return (
      <section>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            {language === "ro" ? "Antrenamente programate" : "Scheduled workouts"}
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      </section>
    );
  }

  if (slots.length === 0) {
    return (
      <section>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            {language === "ro" ? "Antrenamente programate" : "Scheduled workouts"}
          </h2>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-sm text-slate-500">
            {language === "ro" ? "Nu ai încă sesiuni programate." : "You do not have scheduled sessions yet."}
          </p>
          <Link
            href="/dev/find_a_buddy/feed"
            className="mt-3 inline-flex text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            {language === "ro" ? "Intră în find a buddy" : "Open find a buddy"}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-slate-900">
          {language === "ro" ? "Antrenamente programate" : "Scheduled workouts"}
        </h2>
        <span className="text-sm text-slate-500">
          ({upcomingSlots.length} {language === "ro" ? "viitoare" : "upcoming"})
        </span>
      </div>

      {upcomingSlots.length > 0 && (
        <div className="space-y-3">
          {upcomingSlots.map((slot) => {
            const sportEmoji = sportTypeLabels[slot.sportType]?.emoji || "🏃";
            const openSpots = getOpenSpots(slot);

            return (
              <article
                key={slot.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                    {sportEmoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {getSportLabel(slot.sportType, language)}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {slot.isHost
                          ? language === "ro"
                            ? "Ești host"
                            : "You are hosting"
                          : language === "ro"
                            ? "Te-ai alăturat"
                            : "You joined"}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        {getSlotModeLabel(slot, language)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(slot.dateTime)} • {formatTime(slot.dateTime)} • {slot.duration} min
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {slot.location.name}, {slot.city}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        <Users className="h-3.5 w-3.5" />
                        {slot.participants.length}/{slot.maxParticipants}
                      </span>
                      {openSpots > 0 && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                          {openSpots} {language === "ro" ? "locuri rămase" : "spots left"}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-medium text-slate-700">
                        {language === "ro" ? "Cu cine:" : "With:"}
                      </p>
                      <p className="mt-1">{getCompanionLabel(slot)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setChatSlot(slot)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {language === "ro" ? "Chat" : "Chat"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pastSlots.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-slate-500">
            {language === "ro" ? "Sesiuni trecute" : "Past sessions"} ({pastSlots.length})
          </h3>
          <div className="space-y-2">
            {pastSlots.slice(0, 5).map((slot) => (
              <div
                key={slot.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
              >
                <span className="text-xl">{sportTypeLabels[slot.sportType]?.emoji || "🏃"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-700">{getSportLabel(slot.sportType, language)}</p>
                  <p className="truncate text-xs text-slate-500">
                    {formatDate(slot.dateTime)} • {slot.location.name}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {language === "ro" ? "Finalizat" : "Completed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chatSlot && <SlotChatModal slot={chatSlot} onClose={() => setChatSlot(null)} />}
    </section>
  );
}
