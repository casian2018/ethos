"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth as firebaseAuth, db as firebaseDb, storage as firebaseStorage } from "@/lib/firebase";

const auth = firebaseAuth!;
const db = firebaseDb!;
const storage = firebaseStorage!;

interface HealthStats {
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
  source?: string;
}

function HealthStatsContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedStats, setExtractedStats] = useState<HealthStats | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedStats, setSavedStats] = useState<Array<{
    id: string;
    steps: number;
    calories: number;
    distance: number;
    activeMinutes: number;
    source: string;
    date: string;
    createdAt: Timestamp;
  }>>([]);

  async function loadSavedStats(uid: string) {
    const statsQuery = query(
      collection(db, "health_stats"),
      where("userId", "==", uid)
    );
    
    const snapshot = await getDocs(statsQuery);
    const stats: Array<{
      id: string;
      steps: number;
      calories: number;
      distance: number;
      activeMinutes: number;
      source: string;
      date: string;
      createdAt: Timestamp;
    }> = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      stats.push({
        id: doc.id,
        steps: data.steps || 0,
        calories: data.calories || 0,
        distance: data.distance || 0,
        activeMinutes: data.activeMinutes || 0,
        source: data.source || "Unknown",
        date: data.date || "",
        createdAt: data.createdAt,
      });
    });
    stats.sort((left, right) => {
      const leftTime = left.createdAt?.toMillis?.() ?? 0;
      const rightTime = right.createdAt?.toMillis?.() ?? 0;
      return rightTime - leftTime || right.date.localeCompare(left.date);
    });

    setSavedStats(stats.slice(0, 10));
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.uid);
      loadSavedStats(user.uid).finally(() => setLoading(false));
    });

    return () => unsubscribe();
  }, [router]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setExtractedStats(null);
    setError("");
  }

  async function extractStatsFromImage() {
    if (!selectedFile) {
      setError("Missing file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const response = await fetch("/api/stats/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64.split(",")[1],
          imageMimeType: selectedFile.type,
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze image");

      const data = (await response.json()) as {
        stats?: {
          steps?: number;
          calories?: number;
          distanceKm?: number;
          activeMinutes?: number;
          source?: string;
        };
      };
      if (!data.stats) throw new Error("Empty response from AI");
      
      setExtractedStats({
        steps: data.stats.steps || 0,
        calories: data.stats.calories || 0,
        distance: data.stats.distanceKm || 0,
        activeMinutes: data.stats.activeMinutes || 0,
        source: data.stats.source
      });
    } catch (err) {
      console.error("Error extracting stats:", err);
      setError("Failed to extract stats from image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function saveStats() {
    if (!extractedStats || !userId) return;

    setLoading(true);
    setError("");

    try {
      let imageUrl = "";
      if (selectedFile && storage) {
        const storageRef = ref(storage, `health_stats/${userId}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "health_stats"), {
        userId: userId,
        steps: extractedStats.steps,
        calories: extractedStats.calories,
        distance: extractedStats.distance,
        activeMinutes: extractedStats.activeMinutes,
        source: extractedStats.source || "Imported",
        date: new Date().toISOString().split("T")[0],
        imageUrl: imageUrl,
        createdAt: Timestamp.now(),
      });

      setSuccess("Evolution entry saved successfully!");
      setExtractedStats(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      await loadSavedStats(userId);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving stats:", err);
      setError("Failed to save stats");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp: Timestamp | undefined) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date();
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Import Evolution Data</h1>
          <p className="text-slate-500 mt-1">Upload a screenshot from Apple Health or Samsung Health to update your movement timeline</p>
        </div>

        {/* How-to-Sync Tutorial */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span>📱</span> How to Sync Your Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Apple Health */}
            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🍎</span>
                <h3 className="font-semibold text-slate-900">Apple Health</h3>
              </div>
              <ol className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">1.</span>
                  Open the <strong>Health</strong> app on iPhone
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">2.</span>
                  Tap your <strong>profile picture</strong> (top right)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">3.</span>
                  Scroll down and tap <strong>Export All Health Data</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">4.</span>
                  Take a <strong>screenshot</strong> of your activity summary
                </li>
              </ol>
            </div>

            {/* Samsung Health */}
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📱</span>
                <h3 className="font-semibold text-slate-900">Samsung Health</h3>
              </div>
              <ol className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">1.</span>
                  Open <strong>Samsung Health</strong> app
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">2.</span>
                  Go to <strong>Today</strong> tab
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">3.</span>
                  Take a <strong>screenshot</strong> showing your steps & calories
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">4.</span>
                  Upload the screenshot below
                </li>
              </ol>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 bg-red-50 border border-red-100 border-red-200">
            <p className="text-red-600 text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 bg-emerald-50 border border-emerald-100 border-emerald-200">
            <p className="text-emerald-600 text-emerald-600">{success}</p>
          </div>
        )}

        <div className="card p-6 mb-8 bg-white">
          <h2 className="text-xl font-semibold text-zinc-900 text-slate-900 mb-4">Upload Screenshot</h2>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 hover:bg-emerald-50 transition-colors"
          >
            {previewUrl ? (
              <div className="relative">
                <Image src={previewUrl} alt="Preview" width={500} height={500} className="max-h-64 mx-auto rounded-lg" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setExtractedStats(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-zinc-100 bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-zinc-600 text-slate-600 mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-zinc-400">PNG, JPG up to 5MB</p>
              </>
            )}
          </div>
          
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          {selectedFile && !extractedStats && (
            <button onClick={extractStatsFromImage} disabled={uploading} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              {uploading ? (
                <><svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Analyzing...</>
              ) : (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> Extract Evolution with AI</>
              )}
            </button>
          )}
        </div>

        {extractedStats && (
          <div className="card p-6 mb-8 bg-white">
            <h2 className="text-xl font-semibold text-zinc-900 text-slate-900 mb-4">Extracted Evolution Preview</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 bg-emerald-50 rounded-xl">
                <p className="text-sm text-emerald-600 text-emerald-600">Steps</p>
                <p className="text-2xl font-bold text-emerald-700 text-emerald-700">{extractedStats.steps.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-orange-50 bg-orange-50 rounded-xl">
                <p className="text-sm text-orange-600 text-orange-600">Calories</p>
                <p className="text-2xl font-bold text-orange-700 text-orange-700">{extractedStats.calories.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-blue-50 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600 text-blue-600">Distance</p>
                <p className="text-2xl font-bold text-blue-700 text-blue-700">{extractedStats.distance} km</p>
              </div>
              <div className="p-4 bg-purple-50 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-600 text-purple-600">Active Minutes</p>
                <p className="text-2xl font-bold text-purple-700 text-purple-700">{extractedStats.activeMinutes} min</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setExtractedStats(null); setSelectedFile(null); setPreviewUrl(null); }} className="btn-secondary flex-1 bg-slate-50 text-slate-700">Cancel</button>
              <button onClick={saveStats} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>}
                Save Evolution Entry
              </button>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-zinc-900 text-slate-900 mb-4">Evolution Import History</h2>
          {savedStats.length === 0 ? (
            <div className="card p-6 text-center bg-white"><p className="text-zinc-500 text-slate-500">No evolution imports yet</p></div>
          ) : (
            <div className="space-y-3">
              {savedStats.map((stat) => (
                <div key={stat.id} className="card p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 bg-emerald-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div><p className="font-medium text-zinc-900 text-slate-900">{stat.date}</p><p className="text-sm text-zinc-500 text-slate-500">{stat.source}</p></div>
                    </div>
                    <p className="text-sm text-zinc-400">{formatDate(stat.createdAt)}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div><p className="text-lg font-semibold text-emerald-600 text-emerald-600">{stat.steps.toLocaleString()}</p><p className="text-xs text-zinc-500">steps</p></div>
                    <div><p className="text-lg font-semibold text-orange-600 text-orange-600">{stat.calories}</p><p className="text-xs text-zinc-500">kcal</p></div>
                    <div><p className="text-lg font-semibold text-blue-600 text-blue-600">{stat.distance}</p><p className="text-xs text-zinc-500">km</p></div>
                    <div><p className="text-lg font-semibold text-purple-600 text-purple-600">{stat.activeMinutes}</p><p className="text-xs text-zinc-500">min</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HealthStatsImportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <HealthStatsContent />
    </Suspense>
  );
}
