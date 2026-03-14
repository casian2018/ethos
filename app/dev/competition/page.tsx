"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  query, 
  getDocs,
  orderBy,
  limit,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface Competition {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  participants: string[];
  startDate: unknown;
  endDate: unknown;
  dailyStepGoal: number;
  createdAt: unknown;
}

export default function CompetitionPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCompetition, setNewCompetition] = useState({
    name: "",
    description: "",
    dailyStepGoal: 10000,
    days: 7
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      
      try {
        const competitionsQuery = query(
          collection(db, "competitions"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        
        const snapshot = await getDocs(competitionsQuery);
        const comps: Competition[] = [];
        snapshot.forEach((doc) => {
          comps.push({ id: doc.id, ...doc.data() } as Competition);
        });
        setCompetitions(comps);
      } catch (err) {
        console.error("Error loading competitions:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleCreateCompetition = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !newCompetition.name) return;

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + newCompetition.days);

      await addDoc(collection(db, "competitions"), {
        name: newCompetition.name,
        description: newCompetition.description,
        createdBy: currentUser.uid,
        participants: [currentUser.uid],
        startDate: startDate,
        endDate: endDate,
        dailyStepGoal: newCompetition.dailyStepGoal,
        createdAt: serverTimestamp()
      });

      // Reload competitions
      const competitionsQuery = query(
        collection(db, "competitions"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      
      const snapshot = await getDocs(competitionsQuery);
      const comps: Competition[] = [];
      snapshot.forEach((doc) => {
        comps.push({ id: doc.id, ...doc.data() } as Competition);
      });
      setCompetitions(comps);
      setShowForm(false);
      setNewCompetition({ name: "", description: "", dailyStepGoal: 10000, days: 7 });
    } catch (err) {
      console.error("Error creating competition:", err);
    }
  };

  // Helper function removed - formatDate not used

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-600 dark:text-zinc-400">
          {language === "ro" ? "Se încarcă..." : "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {language === "ro" ? "Competiții" : "Competitions"}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          {showForm 
            ? (language === "ro" ? "Anulează" : "Cancel")
            : (language === "ro" ? "Creează Competiție" : "Create Competition")
          }
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-6 border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-white mb-4">
            {language === "ro" ? "Creează o nouă competiție" : "Create New Competition"}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "ro" ? "Nume" : "Name"}
              </label>
              <input
                type="text"
                value={newCompetition.name}
                onChange={(e) => setNewCompetition({ ...newCompetition, name: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                placeholder={language === "ro" ? "Ex: Provocarea de Martie" : "e.g., March Challenge"}
              />
            </div>
            
            <div>
              <label className="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "ro" ? "Descriere" : "Description"}
              </label>
              <textarea
                value={newCompetition.description}
                onChange={(e) => setNewCompetition({ ...newCompetition, description: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "ro" ? "Scop zilnic (pași)" : "Daily Step Goal"}: {newCompetition.dailyStepGoal.toLocaleString()}
              </label>
              <input
                type="range"
                min="5000"
                max="30000"
                step="1000"
                value={newCompetition.dailyStepGoal}
                onChange={(e) => setNewCompetition({ ...newCompetition, dailyStepGoal: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "ro" ? "Durata (zile)" : "Duration (days)"}: {newCompetition.days}
              </label>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={newCompetition.days}
                onChange={(e) => setNewCompetition({ ...newCompetition, days: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <button
              onClick={handleCreateCompetition}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              {language === "ro" ? "Creează" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Competition List */}
      {competitions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {language === "ro" 
              ? "Nu există competiții momentan." 
              : "No competitions available at the moment."}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            {language === "ro"
              ? "Creează prima competiție!"
              : "Create the first competition!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {competitions.map((comp) => (
            <div 
              key={comp.id}
              className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                {comp.name}
              </h3>
              {comp.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  {comp.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {language === "ro" ? "Participanți" : "Participants"}: {comp.participants?.length || 0}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {language === "ro" ? "Scop" : "Goal"}: {comp.dailyStepGoal?.toLocaleString() || 10000}
                </span>
              </div>
              <button
                onClick={() => router.push(`/competition/${comp.id}`)}
                className="mt-3 w-full py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                {language === "ro" ? "Vezi Detalii" : "View Details"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
