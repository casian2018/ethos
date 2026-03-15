/**
 * ScheduledWorkoutsSection - Shows user's scheduled workouts
 * 
 * Displays:
 * - Slots where user is hostId
 * - Slots where user is buddyId
 * - Chronological list with sport, date/time, location, partner info
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  getDoc,
  doc
} from "firebase/firestore";
import { db as firebaseDb } from "@/lib/firebase";
import { AvailabilitySlot, sportTypeLabels } from "@/lib/types";
import SlotChatModal from "@/components/features/find-a-buddy/SlotChatModal";

const db = firebaseDb!;

interface ScheduledWorkoutsSectionProps {
  userId: string | null;
}

interface SlotWithPartner extends AvailabilitySlot {
  partnerName?: string;
  partnerId?: string;
  isHost: boolean;
}

export default function ScheduledWorkoutsSection({ userId }: ScheduledWorkoutsSectionProps) {
  const [slots, setSlots] = useState<SlotWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatSlot, setChatSlot] = useState<SlotWithPartner | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchSlots = async () => {
      setLoading(true);
      try {
        // Query slots where user is host OR buddy
        const slotsQuery = query(
          collection(db, "availability_slots"),
          where("status", "in", ["open", "matched"]),
          orderBy("dateTime", "asc")
        );
        
        const snapshot = await getDocs(slotsQuery);
        const fetchedSlots: SlotWithPartner[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          
          // Check if user is host or buddy
          const isHost = data.hostId === userId;
          const isBuddy = data.participants?.includes(userId) || false;
          
          if (!isHost && !isBuddy) continue;
          
          // Get partner info
          let partnerName: string | undefined;
          let partnerId: string | undefined;
          
          if (isHost && data.participants && data.participants.length > 0) {
            // User is host, get first participant info
            const buddyId = data.participants[0];
            try {
              const buddyDoc = await getDoc(doc(db, "users", buddyId));
              if (buddyDoc.exists()) {
                partnerName = buddyDoc.data().displayName || "Partener";
                partnerId = buddyId;
              }
            } catch (err) {
              console.error("Error fetching buddy:", err);
            }
          } else if (isBuddy) {
            // User is buddy, get host info
            partnerName = data.hostName;
            partnerId = data.hostId;
          }
          
          fetchedSlots.push({
            id: docSnap.id,
            hostId: data.hostId,
            hostName: data.hostName,
            sportType: data.sportType,
            city: data.city,
            dateTime: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(),
            duration: data.duration,
            maxParticipants: data.maxParticipants || 1,
            participants: data.participants || [],
            genderPreference: data.genderPreference,
            location: data.location,
            status: data.status,
            description: data.description,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
            partnerName,
            partnerId,
            isHost,
          });
        }
        
        // Sort by date
        fetchedSlots.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        
        setSlots(fetchedSlots);
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSlots();
  }, [userId]);

  // Format date
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

  // Filter upcoming vs past
  const now = new Date();
  const upcomingSlots = slots.filter(s => s.dateTime >= now);
  const pastSlots = slots.filter(s => s.dateTime < now);

  if (loading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Antrenamente Programate
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Antrenamente Programate
        </h2>
        <div className="p-4 bg-zinc-50 bg-white rounded-xl text-center">
          <p className="text-zinc-500 text-slate-500">
            Nu ai niciun antrenament programat.
          </p>
          <Link 
            href="/dev/find_a_buddy/feed"
            className="text-emerald-600 hover:text-emerald-700 text-sm mt-2 inline-block"
          >
            Găsește un partener →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-600 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Antrenamente Programate
        <span className="text-sm font-normal text-zinc-500">
          ({upcomingSlots.length} viitoare)
        </span>
      </h2>

      {/* Upcoming Slots */}
      {upcomingSlots.length > 0 && (
        <div className="space-y-3 mb-6">
          {upcomingSlots.map((slot) => {
            const sport = sportTypeLabels[slot.sportType as keyof typeof sportTypeLabels];
            
            return (
              <div 
                key={slot.id}
                className="p-4 bg-zinc-50 bg-white rounded-xl"
              >
                <div className="flex items-start gap-3">
                  {/* Sport Icon */}
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">
                    {sport?.emoji || "🏃"}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-zinc-900 text-slate-900">
                        {sport?.label || slot.sportType}
                      </h3>
                      <span className={`badge text-xs ${
                        slot.status === "matched" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {slot.isHost ? "Ești host" : "Te-ai alăturat"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
                      <span>📅 {formatDate(slot.dateTime)}</span>
                      <span>🕐 {formatTime(slot.dateTime)}</span>
                      <span>({slot.duration} min)</span>
                    </div>
                    
                    <p className="text-sm text-zinc-500 mt-1">
                      📍 {slot.location.name}, {slot.city}
                    </p>
                    
                    {/* Partner Info */}
                    <div className="mt-2 pt-2 border-t border-zinc-200 border-slate-200">
                      {slot.status === "matched" && slot.partnerName ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm">
                            <span className="text-zinc-500">Partener: </span>
                            {slot.partnerId ? (
                              <Link 
                                href={`/dev/profile/${slot.partnerId}`}
                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                {slot.partnerName}
                              </Link>
                            ) : (
                              <span className="font-medium text-zinc-900 text-slate-900">
                                {slot.partnerName}
                              </span>
                            )}
                          </p>
                          <button
                            onClick={() => {
                              setChatSlot(slot);
                              setShowChat(true);
                            }}
                            className="text-xs bg-emerald-100 bg-emerald-100 text-emerald-700 text-emerald-600 px-3 py-1 rounded-lg hover:bg-emerald-200 hover:bg-emerald-200"
                          >
                            💬 Chat
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-yellow-600 text-yellow-600 font-medium">
                          🔍 Se caută partener...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past Slots */}
      {pastSlots.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-500 text-slate-500 mb-3">
            Antrenamente trecute ({pastSlots.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {pastSlots.slice(0, 5).map((slot) => {
              const sport = sportTypeLabels[slot.sportType as keyof typeof sportTypeLabels];
              
              return (
                <div 
                  key={slot.id}
                  className="p-3 bg-zinc-100 bg-white/50 rounded-xl flex items-center gap-3"
                >
                  <span className="text-lg">{sport?.emoji || "🏃"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-700 text-slate-600 text-sm">
                      {sport?.label || slot.sportType}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(slot.dateTime)} • {slot.location.name}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400">
                    ✓ Finalizat
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && chatSlot && (
        <SlotChatModal 
          slot={chatSlot} 
          userId={userId}
          onClose={() => {
            setShowChat(false);
            setChatSlot(null);
          }} 
        />
      )}
    </div>
  );
}
