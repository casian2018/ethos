"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc,
  Timestamp 
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface BuddyUser {
  id: string;
  age: number;
  city: string;
  occupation: string;
  fitnessLevel: string;
  hobbies: string[];
  goals: string[];
  displayName?: string;
}

export default function FindBuddyPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [users, setUsers] = useState<BuddyUser[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.uid);

      // Fetch users looking for buddies
      const usersQuery = query(
        collection(db, "users"),
        where("lookingForBuddy", "==", true)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: BuddyUser[] = [];
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        // Exclude current user
        if (doc.id !== user.uid) {
          usersData.push({
            id: doc.id,
            age: data.age || 0,
            city: data.city || "",
            occupation: data.occupation || "",
            fitnessLevel: data.fitnessLevel || "",
            hobbies: data.hobbies || [],
            goals: data.goals || [],
            displayName: data.displayName,
          });
        }
      });
      
      setUsers(usersData);

      // Fetch existing requests sent by current user
      const requestsQuery = query(
        collection(db, "buddy_requests"),
        where("senderId", "==", user.uid)
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestIds = new Set<string>();
      requestsSnapshot.forEach((doc) => {
        const data = doc.data();
        requestIds.add(data.receiverId);
      });
      setSentRequests(requestIds);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSendRequest(receiverId: string) {
    if (!userId) return;

    setSending(receiverId);
    try {
      await addDoc(collection(db, "buddy_requests"), {
        senderId: userId,
        receiverId: receiverId,
        status: "pending",
        createdAt: Timestamp.now(),
      });

      setSentRequests(prev => new Set(prev).add(receiverId));
    } catch (err) {
      console.error("Error sending request:", err);
    } finally {
      setSending(null);
    }
  }

  function getFitnessBadge(level: string) {
    switch (level) {
      case "beginner": return "badge-beginner";
      case "intermediate": return "badge-intermediate";
      case "advanced": return "badge-advanced";
      default: return "badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t("buddy.title")}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t("buddy.subtitle")}</p>
        </div>

        {/* Users Grid */}
        {users.length === 0 ? (
          <div className="card p-12 text-center dark:bg-zinc-900">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{t("buddy.noBuddies")}</h3>
            <p className="text-zinc-500 dark:text-zinc-400">{t("buddy.checkBack")}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="card-hover p-6 flex flex-col dark:bg-zinc-900"
              >
                {/* Avatar & Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                    {user.displayName?.charAt(0).toUpperCase() || user.city?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{user.displayName || user.city || "Anonymous"}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.occupation || t("profile.notSet")}</p>
                  </div>
                </div>

                {/* Location & Fitness */}
                <div className="flex items-center gap-3 mb-4">
                  {user.city && (
                    <span className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {user.city}
                    </span>
                  )}
                  {user.fitnessLevel && (
                    <span className={getFitnessBadge(user.fitnessLevel)}>
                      {user.fitnessLevel}
                    </span>
                  )}
                </div>

                {/* Goals */}
                {user.goals.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t("buddy.goals")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.goals.map((goal) => (
                        <span 
                          key={goal} 
                          className="badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        >
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hobbies */}
                {user.hobbies.length > 0 && (
                  <div className="mb-4 flex-1">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t("buddy.hobbies")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.hobbies.slice(0, 4).map((hobby) => (
                        <span 
                          key={hobby} 
                          className="badge-primary"
                        >
                          {hobby}
                        </span>
                      ))}
                      {user.hobbies.length > 4 && (
                        <span className="badge bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          +{user.hobbies.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Send Request Button */}
                <button
                  onClick={() => handleSendRequest(user.id)}
                  disabled={sending === user.id || sentRequests.has(user.id)}
                  className={`w-full py-2.5 rounded-xl font-medium transition-all ${
                    sentRequests.has(user.id)
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-default"
                      : "btn-primary"
                  }`}
                >
                  {sentRequests.has(user.id) ? t("buddy.requestSent") : sending === user.id ? t("buddy.sending") : t("buddy.sendRequest")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
