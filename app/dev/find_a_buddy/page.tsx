"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  query, 
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface Buddy {
  id: string;
  userId: string;
  displayName: string;
  goals: string[];
  availability: string;
  experienceLevel: string;
  createdAt: unknown;
}

export default function FindBuddyPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setCurrentUser(currentUser);
      
      // Load buddies
      try {
        const buddiesQuery = query(
          collection(db, "buddies"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        
        const snapshot = await getDocs(buddiesQuery);
        const buddiesData: Buddy[] = [];
        snapshot.forEach((doc) => {
          buddiesData.push({ id: doc.id, ...doc.data() } as Buddy);
        });
        
        // Filter out current user
        setBuddies(buddiesData.filter(b => b.userId !== currentUser.uid));
      } catch (err) {
        console.error("Error loading buddies:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-600 dark:text-zinc-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        {language === "ro" ? "Găsește un Partener de Antrenament" : "Find a Workout Buddy"}
      </h1>

      {buddies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {language === "ro" 
              ? "Nu există parteneri disponibili momentan." 
              : "No buddies available at the moment."}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            {language === "ro"
              ? "Revino mai târziu pentru a găsi parteneri de antrenament."
              : "Check back later to find workout buddies."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {buddies.map((buddy) => (
            <div 
              key={buddy.id} 
              className="bg-white dark:bg-zinc-800 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-medium text-lg">
                  {(buddy.displayName || buddy.userId).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-white">
                    {buddy.displayName || buddy.userId.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {buddy.experienceLevel || "Intermediate"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {language === "ro" ? "Obiective:" : "Goals:"}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(buddy.goals || []).slice(0, 3).map((goal, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {language === "ro" ? "Disponibilitate:" : "Availability:"}
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {buddy.availability || "Flexible"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
