/**
 * EventCard - Card component for sport events with Join/Chat functionality
 * 
 * Features:
 * - Join event with medical profile check
 * - Medical warning for high intensity sports
 * - Average age display of participants
 * - Leave event
 * - Group chat button (unlocked after joining)
 * - Auto-archive expired events
 */

"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  doc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  getDoc,
  getDocs
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { 
  SportEvent, 
  sportTypeLabels, 
  EventChatMessage,
  sportIntensityMap,
  checkSportMedicalCompatibility,
  calculateAverageAge,
  MedicalCondition,
  UserProfile
} from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface EventCardProps {
  event: SportEvent;
  onUpdate?: (updatedEvent: SportEvent) => void;
}

export default function EventCardWithChat({ event, onUpdate }: EventCardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  
  // User profile state for medical conditions
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [participantBirthDates, setParticipantBirthDates] = useState<string[]>([]);
  const [averageAge, setAverageAge] = useState<number | null>(null);

  // Check if event has expired
  const isExpired = new Date(event.endTime) < new Date();
  const isFull = event.joinedUsers.length >= event.maxParticipants;

  // Get sport intensity
  const sportIntensity = event.intensity || sportIntensityMap[event.sportType as keyof typeof sportIntensityMap] || "medium";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsJoined(event.joinedUsers.includes(currentUser.uid));
        
        // Fetch user profile for medical conditions
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              birthDate: data.birthDate || "",
              medicalConditions: (data.medicalConditions || []) as MedicalCondition[],
              height: data.height || 0,
              weight: data.weight || 0,
              gender: data.gender || "other",
              preferredSports: (data.preferredSports || []) as import("@/lib/types").PreferredSport[],
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
            });
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      }
    });
    return () => unsubscribe();
  }, [event.joinedUsers]);

  // Fetch participant ages for average calculation
  useEffect(() => {
    const fetchParticipantAges = async () => {
      if (event.joinedUsers.length === 0) {
        setAverageAge(null);
        return;
      }

      try {
        const birthDates: string[] = [];
        // Fetch up to 20 participants for performance
        const userIds = event.joinedUsers.slice(0, 20);
        
        for (const userId of userIds) {
          try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists() && userDoc.data().birthDate) {
              birthDates.push(userDoc.data().birthDate);
            }
          } catch (e) {
            // Skip this user if error
          }
        }
        
        setParticipantBirthDates(birthDates);
        if (birthDates.length > 0) {
          setAverageAge(calculateAverageAge(birthDates));
        }
      } catch (err) {
        console.error("Error fetching participant ages:", err);
      }
    };

    fetchParticipantAges();
  }, [event.joinedUsers]);

  const handleJoinClick = () => {
    // Check medical compatibility before joining
    if (userProfile && userProfile.medicalConditions.length > 0) {
      const compatibility = checkSportMedicalCompatibility(sportIntensity, userProfile.medicalConditions);
      
      if (!compatibility.isSafe && compatibility.warning) {
        setWarningMessage(compatibility.warning);
        setShowWarning(true);
        return;
      }
    }
    
    // If safe or no profile, proceed with join
    handleJoin();
  };

  const handleJoin = async () => {
    if (!user || isFull || isExpired) return;
    
    setLoading(true);
    setShowWarning(false);
    try {
      const updatedJoinedUsers = [...event.joinedUsers, user.uid];
      
      await updateDoc(doc(db, "sport_events", event.id), {
        joinedUsers: updatedJoinedUsers,
        updatedAt: serverTimestamp(),
      });
      
      setIsJoined(true);
      
      // Update parent if callback provided
      if (onUpdate) {
        onUpdate({ ...event, joinedUsers: updatedJoinedUsers });
      }
    } catch (err) {
      console.error("Error joining event:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user || event.creatorId === user.uid) return; // Creator can't leave
    
    setLoading(true);
    try {
      const currentUser = user;
      const updatedJoinedUsers = event.joinedUsers.filter(id => id !== currentUser.uid);
      
      await updateDoc(doc(db, "sport_events", event.id), {
        joinedUsers: updatedJoinedUsers,
        updatedAt: serverTimestamp(),
      });
      
      setIsJoined(false);
      setShowChat(false);
      
      // Update parent if callback provided
      if (onUpdate) {
        onUpdate({ ...event, joinedUsers: updatedJoinedUsers });
      }
    } catch (err) {
      console.error("Error leaving event:", err);
    } finally {
      setLoading(false);
    }
  };

  const sport = sportTypeLabels[event.sportType as keyof typeof sportTypeLabels];

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

  // Get intensity badge color
  const getIntensityBadge = () => {
    const colors = {
      low: "bg-blue-100 text-blue-700 bg-blue-100 text-blue-700",
      medium: "bg-yellow-100 text-yellow-700 bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700 bg-red-100 text-red-700",
    };
    const labels = {
      low: "🟢 Ușor",
      medium: "🟡 Mediu",
      high: "🔴 Intens",
    };
    return (
      <span className={`badge text-xs ${colors[sportIntensity]}`}>
        {labels[sportIntensity]}
      </span>
    );
  };

  // Show expired badge
  if (isExpired && event.status !== "completed") {
    return (
      <>
        <div className="card p-4 opacity-60 bg-zinc-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-zinc-200 bg-slate-100 flex items-center justify-center text-2xl">
              {sport?.emoji || "🏃"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-500 truncate">
                  {sport?.label || event.sportType}
                </h3>
                <span className="badge bg-gray-200 text-gray-600 text-xs">
                  Expirat
                </span>
              </div>
              <p className="text-sm text-zinc-500">
                {formatDate(event.startTime)} • {formatTime(event.startTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Medical Warning Modal */}
        {showWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="font-bold text-red-600 text-red-600 text-lg">
                  Atenție Medicală
                </h3>
              </div>
              <p className="text-zinc-600 text-slate-600 text-center mb-6">
                {warningMessage}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowWarning(false)}
                  className="btn-secondary flex-1"
                >
                  Anulează
                </button>
                <button
                  onClick={handleJoin}
                  className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
                >
                  Alătură-te Oricum
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="card p-4 hover:border-emerald-500 transition-all">
        <div className="flex items-center gap-4">
          {/* Sport Icon */}
          <div className="w-14 h-14 rounded-xl bg-emerald-100 bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
            {sport?.emoji || "🏃"}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-zinc-900 text-slate-900 truncate">
                {sport?.label || event.sportType}
              </h3>
              {/* Intensity Badge */}
              {getIntensityBadge()}
              {/* Price Badge */}
              {event.isPaid ? (
                <span className="badge bg-yellow-100 text-yellow-700 text-xs">
                  💰 {event.price} RON
                </span>
              ) : (
                <span className="badge bg-emerald-100 text-emerald-700 text-xs">
                  🆓 Gratis
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-500 flex-wrap">
              <span className="flex items-center gap-1">
                📍 {event.city}
              </span>
              <span className="flex items-center gap-1">
                🕐 {formatDate(event.startTime)} • {formatTime(event.startTime)}
              </span>
            </div>

            <p className="text-sm text-zinc-500 mt-1 truncate">
              📍 {event.locationName}
            </p>

            {/* Average Age Display */}
            {averageAge !== null && averageAge > 0 && (
              <p className="text-xs text-zinc-400 mt-1">
                👥 Vârsta medie a grupului: ~{averageAge} ani
              </p>
            )}
          </div>

          {/* Participants */}
          <div className="text-right flex-shrink-0">
            <div className={`text-lg font-bold ${isFull ? "text-red-500" : "text-emerald-600"}`}>
              {event.joinedUsers.length}/{event.maxParticipants}
            </div>
            <div className="text-xs text-zinc-500">
              {isFull ? "Complet" : `${event.maxParticipants - event.joinedUsers.length} locuri`}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {isJoined ? (
            <>
              {/* Chat Button - unlocked after joining */}
              <button
                onClick={() => setShowChat(true)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                💬 Chat Grup
              </button>
              
              {/* Leave button (only if not creator) */}
              {event.creatorId !== user?.uid && (
                <button
                  onClick={handleLeave}
                  disabled={loading}
                  className="btn-secondary text-red-500"
                >
                  ✕
                </button>
              )}
            </>
          ) : (
            <>
              {/* Join Button */}
              <button
                onClick={handleJoinClick}
                disabled={loading || isFull}
                className={`btn-primary flex-1 ${isFull ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading 
                  ? "..." 
                  : isFull 
                    ? "Complet" 
                    : "✓ Alătură-te"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Medical Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="font-bold text-red-600 text-red-600 text-lg">
                Atenție Medicală
              </h3>
            </div>
            <p className="text-zinc-600 text-slate-600 text-center mb-6">
              {warningMessage}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWarning(false)}
                className="btn-secondary flex-1"
              >
                Anulează
              </button>
              <button
                onClick={handleJoin}
                className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
              >
                Alătură-te Oricum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Chat Modal */}
      {showChat && isJoined && (
        <GroupChatModal 
          event={event}
          user={user}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}

// ==================== GroupChatModal Component ====================

interface GroupChatModalProps {
  event: SportEvent;
  user: User | null;
  onClose: () => void;
}

function GroupChatModal({ event, user, onClose }: GroupChatModalProps) {
  const [messages, setMessages] = useState<EventChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Subscribe to chat messages in real-time
    const chatQuery = query(
      collection(db, `sport_events/${event.id}/event_chat`),
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [event.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    setSending(true);
    try {
      await addDoc(collection(db, `sport_events/${event.id}/event_chat`), {
        eventId: event.id,
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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sport = sportTypeLabels[event.sportType as keyof typeof sportTypeLabels];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-4 max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-200 border-slate-200">
          <div>
            <h2 className="font-bold text-zinc-900 text-slate-900">
              💬 Chat Grup
            </h2>
            <p className="text-sm text-zinc-500">
              {sport?.emoji} {sport?.label} - {event.locationName}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 text-2xl">
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 p-2 bg-zinc-50 bg-white rounded-lg min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-zinc-500 py-4">
              Încă niciun mesaj. Fii primul care scrie! 👋
            </p>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = user && msg.userId === user.uid;
              return (
                <div 
                  key={msg.id} 
                  className={`p-2 rounded-lg ${
                    isOwnMessage 
                      ? "bg-emerald-100 bg-emerald-100 ml-8" 
                      : "bg-zinc-100 bg-slate-100 mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-900 text-slate-900">
                      {msg.userName}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 text-slate-600">
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
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-primary px-4"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
