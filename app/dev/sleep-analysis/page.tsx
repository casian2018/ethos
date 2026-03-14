"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  addDoc
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface SleepRecord {
  id: string;
  userId: string;
  date: string;
  sleepHours: number;
  sleepQuality: number;
  notes?: string;
  createdAt: unknown;
}

export default function SleepAnalysisPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState({ sleepHours: 7, sleepQuality: 3, notes: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      
      try {
        // Query without orderBy to avoid index requirement
        // We'll sort on client side instead
        const sleepQuery = query(
          collection(db, "sleep_records"),
          where("userId", "==", currentUser.uid),
          limit(30)
        );
        
        const snapshot = await getDocs(sleepQuery);
        const records: SleepRecord[] = [];
        snapshot.forEach((doc) => {
          records.push({ id: doc.id, ...doc.data() } as SleepRecord);
        });
        // Sort by date on client side
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSleepRecords(records);
      } catch (err) {
        console.error("Error loading sleep records:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSaveSleep = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      await addDoc(collection(db, "sleep_records"), {
        userId: currentUser.uid,
        date: today,
        sleepHours: newRecord.sleepHours,
        sleepQuality: newRecord.sleepQuality,
        notes: newRecord.notes,
        createdAt: new Date()
      });
      
      // Reload records - query without orderBy to avoid index requirement
      const sleepQuery = query(
        collection(db, "sleep_records"),
        where("userId", "==", currentUser.uid),
        limit(30)
      );
      
      const snapshot = await getDocs(sleepQuery);
      const records: SleepRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as SleepRecord);
      });
      // Sort by date on client side
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSleepRecords(records);
      setShowForm(false);
      setNewRecord({ sleepHours: 7, sleepQuality: 3, notes: "" });
    } catch (err) {
      console.error("Error saving sleep record:", err);
    }
  };

  const averageSleep = sleepRecords.length > 0
    ? (sleepRecords.reduce((sum, r) => sum + r.sleepHours, 0) / sleepRecords.length).toFixed(1)
    : "0";
  
  const averageQuality = sleepRecords.length > 0
    ? (sleepRecords.reduce((sum, r) => sum + r.sleepQuality, 0) / sleepRecords.length).toFixed(1)
    : "0";

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
          {language === "ro" ? "Analiza Somnului" : "Sleep Analysis"}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          {showForm 
            ? (language === "ro" ? "Anulează" : "Cancel")
            : (language === "ro" ? "Adaugă Somn" : "Add Sleep")
          }
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-6 border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-white mb-4">
            {language === "ro" ? "Adaugă înregistrare somn" : "Add Sleep Record"}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "ro" ? "Ore de somn" : "Sleep Hours"}: {newRecord.sleepHours}h
              </label>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={newRecord.sleepHours}
                onChange={(e) => setNewRecord({ ...newRecord, sleepHours: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "ro" ? "Calitate somn" : "Sleep Quality"}: {newRecord.sleepQuality}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={newRecord.sleepQuality}
                onChange={(e) => setNewRecord({ ...newRecord, sleepQuality: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                {language === "ro" ? "Notițe" : "Notes"}
              </label>
              <textarea
                value={newRecord.notes}
                onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                rows={2}
              />
            </div>
            
            <button
              onClick={handleSaveSleep}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              {language === "ro" ? "Salvează" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            {language === "ro" ? "Somn mediu" : "Average Sleep"}
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {averageSleep}h
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            {language === "ro" ? "Calitate medie" : "Average Quality"}
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {averageQuality}/5
          </p>
        </div>
      </div>

      {/* Sleep Records */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {language === "ro" ? "Istoricul somnului" : "Sleep History"}
        </h2>
        
        {sleepRecords.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
            {language === "ro" 
              ? "Nu ai înregistrări de somn încă." 
              : "No sleep records yet."}
          </p>
        ) : (
          sleepRecords.map((record) => (
            <div 
              key={record.id}
              className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">{record.date}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{record.notes}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-emerald-600 dark:text-emerald-400">
                  {record.sleepHours}h
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {"⭐".repeat(record.sleepQuality)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
