/**
 * Sport Event Detail & Chat Page
 * 
 * Route: /dev/events/[eventId]
 * 
 * Features:
 * - Event details
 * - Join/Leave event
 * - Group chat (event_chat sub-collection)
 */

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  query, 
  addDoc,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
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

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<SportEvent | null>(null);
  const [messages, setMessages] = useState<EventChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUser(currentUser);
      loadEvent(currentUser.uid);
    });
    return () => unsubscribe();
   
  }, [eventId, router]);

  const loadEvent = async (_: string) => {
    try {
      // Get event
      const eventDoc = await getDoc(doc(db, "sport_events", eventId));
      if (!eventDoc.exists()) {
        router.push("/dev/events");
        return;
      }
      
      const eventData = eventDoc.data();
      setEvent({
        id: eventDoc.id,
        ...eventData,
        startTime: eventData.startTime?.toDate ? eventData.startTime.toDate() : new Date(eventData.startTime),
        endTime: eventData.endTime?.toDate ? eventData.endTime.toDate() : new Date(eventData.endTime),
        createdAt: eventData.createdAt?.toDate ? eventData.createdAt.toDate() : new Date(),
      } as SportEvent);

      // Subscribe to chat messages
      const chatQuery = query(
        collection(db, `sport_events/${eventId}/event_chat`),
        orderBy("createdAt", "asc"),
        limit(100)
      );

      const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
        const msgs: EventChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          msgs.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          } as EventChatMessage);
        });
        setMessages(msgs);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error loading event:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    setSending(true);
    try {
      await addDoc(collection(db, `sport_events/${eventId}/event_chat`), {
        eventId,
        userId: user.uid,
        userName: user.displayName || "Utilizator",
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const joinEvent = async () => {
    if (!user || !event) return;
    
    try {
      const updatedJoinedUsers = [...event.joinedUsers, user.uid];
      await updateDoc(doc(db, "sport_events", eventId), {
        joinedUsers: updatedJoinedUsers,
        updatedAt: serverTimestamp(),
      });
      setEvent({ ...event, joinedUsers: updatedJoinedUsers });
    } catch (err) {
      console.error("Error joining event:", err);
    }
  };

  const leaveEvent = async () => {
    if (!user || !event) return;
    
    try {
      const updatedJoinedUsers = event.joinedUsers.filter(id => id !== user.uid);
      await updateDoc(doc(db, "sport_events", eventId), {
        joinedUsers: updatedJoinedUsers,
        updatedAt: serverTimestamp(),
      });
      setEvent({ ...event, joinedUsers: updatedJoinedUsers });
    } catch (err) {
      console.error("Error leaving event:", err);
    }
  };

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

  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <p className="text-zinc-500">Eveniment negăsit</p>
      </div>
    );
  }

  const sport = sportTypeLabels[event.sportType as SportType];
  const isJoined = user && event.joinedUsers.includes(user.uid);
  const isCreator = user && event.creatorId === user.uid;
  const spotsLeft = event.maxParticipants - event.joinedUsers.length;
  const isFull = spotsLeft <= 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <Link href="/dev/events" className="text-zinc-500 dark:text-zinc-400 mb-2 inline-flex items-center gap-1">
          ← Înapoi la Evenimente
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{sport?.emoji || "🏃"}</span>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {sport?.label || event.sportType}
            </h1>
            <p className="text-zinc-500">{event.city}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Event Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Main Info Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Detalii Eveniment
            </h2>
            
            {/* Date & Time */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white mb-1">
                <span>📅</span>
                <span className="font-medium">{formatDate(event.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <span>🕐</span>
                <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white mb-1">
                <span>📍</span>
                <span className="font-medium">{event.locationName}</span>
              </div>
              {event.isPaid && event.price ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <span>💰</span>
                  <span>{event.price} RON</span>
                  {event.priceNote && <span className="text-sm">({event.priceNote})</span>}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
                  <span>🆓</span>
                  <span>Gratuit</span>
                </div>
              )}
            </div>

            {/* Gender Preference */}
            {event.genderPreference !== "anyone" && (
              <div className="mb-4">
                <span className={`badge ${
                  event.genderPreference === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                }`}>
                  {genderPreferenceLabels[event.genderPreference as GenderPreference]}
                </span>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <p className="text-zinc-700 dark:text-zinc-300">{event.description}</p>
              </div>
            )}

            {/* Organizer */}
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-sm text-zinc-500">
                Organizator: <span className="text-zinc-900 dark:text-white font-medium">{event.creatorName}</span>
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Participanți ({event.joinedUsers.length}/{event.maxParticipants})
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {event.joinedUsers.map((userId, index) => (
                <div 
                  key={userId} 
                  className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {userId === event.creatorId ? "Organizator" : `Participant ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>

            {!isFull && (
              <p className="text-sm text-emerald-600 mt-3">
                {spotsLeft} locuri disponibile
              </p>
            )}
            {isFull && (
              <p className="text-sm text-red-500 mt-3">
                Eveniment complet
              </p>
            )}
          </div>
        </div>

        {/* Actions & Chat */}
        <div className="space-y-4">
          {/* Join/Leave Button */}
          <div className="card p-4">
            {!isJoined ? (
              <button
                onClick={joinEvent}
                disabled={isFull}
                className={`w-full btn-primary ${isFull ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isFull ? "Complet" : "Alătură-te"}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="w-full btn-primary bg-emerald-600">
                  ✓ Te-ai alăturat
                </div>
                {!isCreator && (
                  <button
                    onClick={leaveEvent}
                    className="w-full btn-secondary text-red-500"
                  >
                    Părăsește
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="card p-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
              💬 Chat Grup
            </h3>
            
            {/* Messages */}
            <div className="h-64 overflow-y-auto space-y-2 mb-3 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              {messages.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  Niciun mesaj încă. Fii primul!
                </p>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = user && msg.userId === user.uid;
                  return (
                    <div 
                      key={msg.id} 
                      className={`p-2 rounded-lg ${
                        isOwnMessage 
                          ? "bg-emerald-100 dark:bg-emerald-900/30 ml-8" 
                          : "bg-zinc-100 dark:bg-zinc-700 mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-zinc-900 dark:text-white">
                          {msg.userName}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        {msg.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Scrie un mesaj..."
                className="input flex-1"
                disabled={!isJoined}
              />
              <button
                type="submit"
                disabled={!isJoined || !newMessage.trim() || sending}
                className="btn-primary px-4"
              >
                ➤
              </button>
            </form>
            {!isJoined && (
              <p className="text-xs text-zinc-500 text-center mt-2">
                Alătură-te pentru a scrie în chat
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
