/**
 * FindABuddyFeed - Modern Redesigned with Matchmaking Cards
 */

"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { AvailabilitySlot } from "@/lib/types";
import { MatchmakingCard } from "@/components/features/find-a-buddy/MatchmakingCard";
import { BuddyCard } from "@/components/features/find-a-buddy/BuddyCard";
import { EvolutionChart } from "@/components/features/find-a-buddy/EvolutionChart";
import SlotChatModal from "@/components/features/find-a-buddy/SlotChatModal";
import { Search, Filter, Sparkles } from "lucide-react";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface ExtendedSlot extends AvailabilitySlot {
  id: string;
}

// Demo buddies for display
const demoBuddies = [
  {
    name: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1765958516447-79fa73ef4fa9?w=200&h=200&fit=crop",
    sports: ["Basketball", "Tennis"],
    level: "Advanced Athlete",
    rating: 4.9,
    matchScore: 95,
    available: true,
  },
  {
    name: "Jessica Kim",
    avatar: "https://images.unsplash.com/photo-1754257319723-6a775bedb0fc?w=200&h=200&fit=crop",
    sports: ["Pilates", "Yoga"],
    level: "Certified Instructor",
    rating: 5.0,
    matchScore: 88,
    available: true,
  },
  {
    name: "Marcus Thompson",
    avatar: "https://images.unsplash.com/photo-1631326658197-faa42ff125b1?w=200&h=200&fit=crop",
    sports: ["Running", "Cycling"],
    level: "Marathon Runner",
    rating: 4.8,
    matchScore: 92,
    available: false,
  },
  {
    name: "Sofia Patel",
    avatar: "https://images.unsplash.com/photo-1721417264655-2ccbf19152c6?w=200&h=200&fit=crop",
    sports: ["Volleyball", "Swimming"],
    level: "Intermediate",
    rating: 4.7,
    matchScore: 85,
    available: true,
  },
];

export default function FindABuddyFeedPage() {
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<ExtendedSlot[]>([]);
  const [mySlots, setMySlots] = useState<ExtendedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatSlot, setActiveChatSlot] = useState<ExtendedSlot | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [joinedSlot, setJoinedSlot] = useState<ExtendedSlot | null>(null);
  
  // Fetch current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch slots
  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      try {
        const slotsRef = collection(db, "availability_slots");
        const q = query(slotsRef, orderBy("createdAt", "desc"));
        
        const snapshot = await getDocs(q);
        const slotsData: ExtendedSlot[] = [];
        const mySlotsData: ExtendedSlot[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const slot: ExtendedSlot = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            dateTime: data.dateTime?.toDate() || new Date(),
          } as ExtendedSlot;
          
          const participants = data.participants || [];
          const isHost = data.hostId === user?.uid;
          const isParticipant = participants.includes(user?.uid);
          const maxParticipants = data.maxParticipants || 1;
          const isFull = participants.length >= maxParticipants;
          
          // Add to my slots if I'm host or participant
          if (isHost || isParticipant) {
            mySlotsData.push(slot);
          } else if (!isFull && data.status !== "closed") {
            slotsData.push(slot);
          }
        }
        
        setSlots(slotsData);
        setMySlots(mySlotsData);
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchSlots();
    }
  }, [user]);

  // Join slot
  async function handleJoin(slot: ExtendedSlot) {
    if (!user || !slot.id) return;
    
    setJoining(slot.id);
    
    try {
      const slotRef = doc(db, "availability_slots", slot.id);
      const maxParticipants = slot.maxParticipants || 1;
      const currentParticipants = slot.participants || [];
      
      await updateDoc(slotRef, {
        participants: [...currentParticipants, user.uid],
        status: currentParticipants.length + 1 >= maxParticipants ? "closed" : "open",
        matchedAt: serverTimestamp(),
      });
      
      setJoinedSlot(slot);
      setShowSuccessModal(true);
      
    } catch (err) {
      console.error("Error joining slot:", err);
    } finally {
      setJoining(null);
    }
  }

  // Get sport emoji
  function getSportEmoji(sport: string) {
    const emojis: Record<string, string> = {
      gym: "🏋️",
      running: "🏃",
      swimming: "🏊",
      football: "⚽",
      tennis: "🎾",
      basketball: "🏀",
      cycling: "🚴",
      yoga: "🧘",
      hiking: "🥾",
      boxing: "🥊",
      volleyball: "🏐",
    };
    return emojis[sport?.toLowerCase()] || "🏃";
  }

  // Format date
  function formatDate(date: Date) {
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.toDateString() === today.toDateString()) {
      return language === "ro" ? "Astăzi" : "Today";
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return language === "ro" ? "Mâine" : "Tomorrow";
    }
    return d.toLocaleDateString(language === "ro" ? "ro-RO" : "en-US", { 
      month: "short", 
      day: "numeric" 
    });
  }

  // Format time
  function formatTime(date: Date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString(language === "ro" ? "ro-RO" : "en-US", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  }

  // Filter slots by search
  const filteredSlots = slots.filter(slot => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      slot.sportType?.toLowerCase().includes(query) ||
      slot.city?.toLowerCase().includes(query) ||
      slot.location?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#F9F7F2]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-[#D4896F]" />
                <h1 className="text-4xl tracking-tight text-slate-900">
                  {language === "ro" ? "Găsește Partenerul" : "Find Your Buddy"}
                </h1>
              </div>
              <p className="text-slate-500 text-lg">
                {language === "ro" 
                  ? "Conectează-te cu sportivi pasionați și fă din mișcare o experiență comună"
                  : "Connect with passionate athletes and make movement a shared experience"
                }
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === "ro" ? "Caută sport, locații..." : "Search sports, locations..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-12 pr-4 py-4 bg-white rounded-2xl text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D4896F]/20 transition-all shadow-sm"
                />
              </div>
              <button className="h-14 px-6 rounded-2xl border border-slate-200 hover:bg-white gap-2 flex items-center text-slate-600 transition-colors">
                <Filter className="w-5 h-5" />
                <span>{language === "ro" ? "Filtre" : "Filters"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* My Slots Section */}
        {mySlots.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl text-slate-900 mb-1">
                  {language === "ro" ? "Sloturile Mele" : "My Sessions"}
                </h2>
                <p className="text-slate-500">
                  {language === "ro" ? "Sesiunile tale active" : "Your active sessions"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mySlots.map((slot) => (
                <MatchmakingCard
                  key={slot.id}
                  title={`${getSportEmoji(slot.sportType)} ${slot.sportType} ${language === "ro" ? "cu tine" : "with you"}`}
                  host={{
                    name: "Tu",
                    avatar: user?.photoURL || "https://images.unsplash.com/photo-1721417264655-2ccbf19152c6?w=200&h=200&fit=crop",
                    rating: 5.0,
                  }}
                  sport={slot.sportType || "Gym"}
                  time={formatTime(slot.dateTime)}
                  date={formatDate(slot.dateTime)}
                  location={slot.location?.name || "Location"}
                  currentPlayers={slot.participants?.length || 1}
                  maxPlayers={slot.maxParticipants || 1}
                  onJoin={() => setActiveChatSlot(slot)}
                  slotId={slot.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Sessions */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl text-slate-900 mb-1">
                {language === "ro" ? "Sesiuni Disponibile" : "Happening Soon"}
              </h2>
              <p className="text-slate-500">
                {language === "ro" 
                  ? "Alătură-te sesiunilor viitoare în zona ta"
                  : "Join upcoming sessions in your area"
                }
              </p>
            </div>
            <button
              onClick={() => window.location.href = "/dev/find_a_buddy"}
              className="text-[#D4896F] hover:bg-[#D4896F]/10 px-4 py-2 rounded-xl font-medium transition-colors"
            >
              {language === "ro" ? "Creează o sesiune →" : "Create session →"}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#D4896F] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Nicio sesiune disponibilă" : "No sessions available"}
              </h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {language === "ro" 
                  ? "Nu există sesiuni disponibile. Fii primul care creează una!"
                  : "No sessions available at the moment. Be the first to create one!"
                }
              </p>
              <button
                onClick={() => window.location.href = "/dev/find_a_buddy"}
                className="bg-[#D4896F] hover:bg-[#c4785f] text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
              >
                {language === "ro" ? "Creează Sesiune" : "Create Session"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSlots.map((slot) => (
                <MatchmakingCard
                  key={slot.id}
                  title={`${getSportEmoji(slot.sportType)} ${slot.sportType} ${language === "ro" ? "în" : "in"} ${slot.city}`}
                  host={{
                    name: slot.hostName || "Host",
                    avatar: "https://images.unsplash.com/photo-1721417264655-2ccbf19152c6?w=200&h=200&fit=crop",
                    rating: 4.8,
                  }}
                  sport={slot.sportType || "Gym"}
                  time={formatTime(slot.dateTime)}
                  date={formatDate(slot.dateTime)}
                  location={slot.location?.name || "Location"}
                  currentPlayers={slot.participants?.length || 1}
                  maxPlayers={slot.maxParticipants || 1}
                  featured={slot.participants?.length >= (slot.maxParticipants || 1) - 1}
                  onJoin={() => handleJoin(slot)}
                  slotId={slot.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recommended Buddies */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl text-slate-900 mb-1">
                {language === "ro" ? "Potrivi Perfecte" : "Perfect Matches"}
              </h2>
              <p className="text-slate-500">
                {language === "ro" 
                  ? "Sportivi cu interese și obiective similare"
                  : "Athletes with similar interests and goals"
                }
              </p>
            </div>
            <button className="text-[#D4896F] hover:bg-[#D4896F]/10 px-4 py-2 rounded-xl font-medium transition-colors">
              {language === "ro" ? "Vezi mai mulți →" : "See more buddies →"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoBuddies.map((buddy, index) => (
              <BuddyCard key={index} {...buddy} />
            ))}
          </div>
        </section>

        {/* Evolution Stats */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl text-slate-900 mb-1">
              {language === "ro" ? "Evoluția Ta" : "Your Evolution"}
            </h2>
            <p className="text-slate-500">
              {language === "ro" 
                ? "Urmărește progresul și sărbătorește realizările"
                : "Track your progress and celebrate milestones"
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EvolutionChart
              title={language === "ro" ? "Sesiuni Active" : "Active Sessions"}
              value="24"
              change="+12%"
              data={[15, 18, 22, 19, 24, 28, 24]}
              color="emerald"
            />
            <EvolutionChart
              title={language === "ro" ? "Ore Antrenament" : "Hours Trained"}
              value="47h"
              change="+8%"
              data={[32, 38, 35, 42, 45, 48, 47]}
              color="blue"
            />
            <EvolutionChart
              title={language === "ro" ? "Conexiuni Noi" : "New Connections"}
              value="18"
              change="+25%"
              data={[8, 10, 12, 14, 15, 16, 18]}
              color="amber"
            />
          </div>
        </section>

        {/* Success Modal */}
        {showSuccessModal && joinedSlot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {language === "ro" ? "Te-ai alăturat!" : "You joined!"}
              </h3>
              <p className="text-slate-600 mb-6">
                {language === "ro" 
                  ? `Te-ai alăturat sesiunii de ${joinedSlot.sportType}. Discută cu ceilalți participanți!`
                  : `You joined the ${joinedSlot.sportType} session. Discuss with other participants!`
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setActiveChatSlot(joinedSlot);
                  }}
                  className="flex-1 bg-[#D4896F] hover:bg-[#c4785f] text-white px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  💬 {language === "ro" ? "Deschide Chat" : "Open Chat"}
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  {language === "ro" ? "Închide" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {activeChatSlot && (
          <SlotChatModal 
            slot={activeChatSlot} 
            userId={user?.uid || null}
            onClose={() => setActiveChatSlot(null)} 
          />
        )}
      </div>
    </div>
  );
}
