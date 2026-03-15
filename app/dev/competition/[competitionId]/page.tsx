"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb, storage as firebaseStorage, getUserDisplayName } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";

const auth = firebaseAuth!;
const db = firebaseDb!;
const storage = firebaseStorage as unknown as FirebaseStorage | undefined;

interface Competition {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  participants: string[];
  startDate: Timestamp;
  endDate: Timestamp;
  dailyStepGoal: number;
  createdAt: Timestamp;
}

interface CompetitionEntry {
  id: string;
  competitionId: string;
  userId: string;
  userName?: string;
  steps: number;
  date: string;
  imageUrl?: string;
  verified: boolean;
  createdAt: Timestamp;
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalSteps: number;
  dailyAverage: number;
  entries: number;
  rank: number;
}

// Gemini API analysis function
async function analyzeStepsImage(imageFile: File): Promise<{ steps: number; date: string; calories?: number }> {
  // For now, return mock data since Gemini requires API key
  // In production, this would call Gemini Vision API
  console.log("Analyzing image:", imageFile.name);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock data for demo
  return {
    steps: Math.floor(Math.random() * 5000) + 5000,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    calories: Math.floor(Math.random() * 300) + 100
  };
}

export default function CompetitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const competitionId = params.competitionId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<CompetitionEntry | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [joining, setJoining] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detectedData, setDetectedData] = useState<{ steps: number; date: string; calories?: number } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const loadCompetition = useCallback(async (uid: string) => {
    try {
      // Load competition
      const compDoc = await getDoc(doc(db, "competitions", competitionId));
      if (!compDoc.exists()) {
        router.push("/competition");
        return;
      }
      const compData = compDoc.data() as Competition;
      const comp: Competition = {
        id: compDoc.id,
        name: compData.name,
        description: compData.description,
        createdBy: compData.createdBy,
        participants: compData.participants,
        startDate: compData.startDate,
        endDate: compData.endDate,
        dailyStepGoal: compData.dailyStepGoal,
        createdAt: compData.createdAt
      };
      setCompetition(comp);
      
      const participant = compData.participants?.includes(uid);
      setIsParticipant(participant);
      
      // Load all entries for this competition
      const entriesQuery = query(
        collection(db, "competition_entries"),
        where("competitionId", "==", competitionId)
      );
      const entriesSnapshot = await getDocs(entriesQuery);
      const allEntries: CompetitionEntry[] = [];
      
      for (const docSnap of entriesSnapshot.docs) {
        const data = docSnap.data();
        const userName = await getUserDisplayName(data.userId);
        allEntries.push({
          id: docSnap.id,
          ...data,
          userName
        } as CompetitionEntry);
      }
      
      // Sort by date descending
      allEntries.sort((a, b) => b.date.localeCompare(a.date));
      
      // Check if user already submitted today
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const userTodayEntry = allEntries.find(e => e.userId === uid && e.date === yesterdayStr);
      setUserEntry(userTodayEntry || null);
      setAlreadySubmitted(!!userTodayEntry);
      
      // Calculate leaderboard
      calculateLeaderboard(allEntries);
    } catch (err) {
      console.error("Error loading competition:", err);
    }
  }, [competitionId, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.uid);
      await loadCompetition(user.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadCompetition, router]);

  function calculateLeaderboard(allEntries: CompetitionEntry[]) {
    // Group entries by user
    const userStats: Record<string, { totalSteps: number; entries: number; name: string }> = {};
    
    for (const entry of allEntries) {
      if (!userStats[entry.userId]) {
        userStats[entry.userId] = {
          totalSteps: 0,
          entries: 0,
          name: entry.userName || "Unknown"
        };
      }
      userStats[entry.userId].totalSteps += entry.steps || 0;
      userStats[entry.userId].entries += 1;
    }
    
    // Convert to leaderboard entries
    const leaderboardEntries: LeaderboardEntry[] = Object.entries(userStats).map(([uid, stats], index) => ({
      userId: uid,
      userName: stats.name,
      totalSteps: stats.totalSteps,
      dailyAverage: stats.entries > 0 ? Math.round(stats.totalSteps / stats.entries) : 0,
      entries: stats.entries,
      rank: index + 1
    }));
    
    // Sort by total steps
    leaderboardEntries.sort((a, b) => b.totalSteps - a.totalSteps);
    
    // Update ranks
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    setLeaderboard(leaderboardEntries);
  }

  async function joinCompetition() {
    if (!userId || !competition) return;
    setJoining(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "competitions", competitionId), {
        participants: arrayUnion(userId)
      });
      setIsParticipant(true);
      await loadCompetition(userId);
      setMessage({ type: "success", text: "Successfully joined the competition!" });
    } catch (err) {
      console.error("Error joining:", err);
      setMessage({ type: "error", text: "Failed to join competition" });
    } finally {
      setJoining(false);
    }
  }

  async function quitCompetition() {
    if (!userId || !competition) return;
    setQuitting(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "competitions", competitionId), {
        participants: arrayRemove(userId)
      });
      setIsParticipant(false);
      router.push("/competition");
    } catch (err) {
      console.error("Error quitting:", err);
      setMessage({ type: "error", text: "Failed to quit competition" });
    } finally {
      setQuitting(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setMessage(null);
    setDetectedData(null);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target?.result as string);
      reader.readAsDataURL(file);
      
      // Analyze with Gemini
      const analysis = await analyzeStepsImage(file);
      setDetectedData(analysis);
    } catch (err) {
      console.error("Error analyzing image:", err);
      setMessage({ type: "error", text: "Failed to analyze image" });
    } finally {
      setUploading(false);
    }
  }

  async function confirmSubmission() {
    if (!userId || !detectedData || !competition) return;
    
    setUploading(true);
    try {
      // Upload image to Firebase Storage
      let imageUrl = "";
      if (previewImage && storage) {
        const storageRef = ref(storage, `competition_proofs/${competitionId}/${userId}_${detectedData.date}.jpg`);
        const response = await fetch(previewImage);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Save entry
      await addDoc(collection(db, "competition_entries"), {
        competitionId,
        userId,
        steps: detectedData.steps,
        date: detectedData.date,
        imageUrl,
        verified: false,
        createdAt: Timestamp.now()
      });
      
      setMessage({ type: "success", text: "Steps submitted successfully!" });
      setDetectedData(null);
      setPreviewImage(null);
      setAlreadySubmitted(true);
      await loadCompetition(userId);
    } catch (err) {
      console.error("Error submitting:", err);
      setMessage({ type: "error", text: "Failed to submit steps" });
    } finally {
      setUploading(false);
    }
  }

  function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function getUserRank() {
    const userEntry = leaderboard.find(e => e.userId === userId);
    return userEntry?.rank || null;
  }

  function getMotivationText() {
    const rank = getUserRank();
    if (!rank || rank === 1) return "You're leading the pack! Keep it up!";
    
    const usersAhead = leaderboard.slice(0, rank - 1);
    if (usersAhead.length > 0) {
      const closest = usersAhead[0];
      const diff = closest.totalSteps - (leaderboard.find(e => e.userId === userId)?.totalSteps || 0);
      if (diff > 0) {
        return `You're ${diff.toLocaleString()} steps behind ${closest.userName}`;
      }
    }
    return `You're in ${rank}${getRankSuffix(rank)} place. Keep pushing!`;
  }

  function getRankSuffix(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-zinc-50 bg-white flex items-center justify-center">
        <p className="text-zinc-500">Competition not found</p>
      </div>
    );
  }

  const userRank = getUserRank();
  const daysRemaining = Math.max(0, Math.ceil((competition.endDate.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-zinc-50 bg-white transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/competition")}
          className="flex items-center gap-2 text-zinc-600 text-slate-500 hover:text-zinc-900 hover:text-slate-900 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Competitions
        </button>

        {/* Competition Header */}
        <div className="card p-6 mb-6 bg-slate-50">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 text-slate-900">{competition.name}</h1>
              {competition.description && (
                <p className="text-zinc-500 text-slate-500 mt-2">{competition.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-zinc-500 text-slate-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {competition.participants?.length || 0} participants
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {competition.dailyStepGoal?.toLocaleString() || 10000} steps/day
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {daysRemaining} days left
                </span>
              </div>
            </div>
            
            {isParticipant ? (
              <button
                onClick={quitCompetition}
                disabled={quitting}
                className="btn-secondary text-red-600 text-red-600 hover:bg-red-50 hover:bg-red-50"
              >
                {quitting ? "Quitting..." : "Quit Competition"}
              </button>
            ) : (
              <button
                onClick={joinCompetition}
                disabled={joining}
                className="btn-primary"
              >
                {joining ? "Joining..." : "Join Competition"}
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === "success" ? "bg-emerald-50 bg-emerald-50 border border-emerald-100 border-emerald-200" :
            message.type === "error" ? "bg-red-50 bg-red-50 border border-red-100 border-red-200" :
            "bg-blue-50 bg-blue-50 border border-blue-100 border-blue-200"
          }`}>
            <p className={message.type === "success" ? "text-emerald-600 text-emerald-600" :
              message.type === "error" ? "text-red-600 text-red-600" :
              "text-blue-600 text-blue-600"}>{message.text}</p>
          </div>
        )}

        {isParticipant && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Submit Yesterday&apos;s Steps */}
            <div className="card p-6 bg-slate-50">
              <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4">
                Submit Yesterday&apos;s Steps
              </h2>
              <p className="text-sm text-zinc-500 text-slate-500 mb-4">
                Upload a screenshot from Samsung Health or Apple Health showing your steps for {getYesterdayDate()}
              </p>
              
              {alreadySubmitted ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 bg-emerald-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-600 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-emerald-600 text-emerald-600 font-medium">Already submitted for yesterday!</p>
                  <p className="text-sm text-zinc-500 text-slate-500 mt-1">
                    {userEntry?.steps?.toLocaleString()} steps
                  </p>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {!previewImage ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full p-6 border-2 border-dashed border-zinc-300 border-slate-200 rounded-xl hover:border-emerald-500 hover:border-emerald-500 transition-colors"
                    >
                      <div className="text-center">
                        {uploading ? (
                          <>
                            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-zinc-500 text-slate-500">Analyzing image...</p>
                          </>
                        ) : (
                          <>
                            <svg className="w-10 h-10 text-zinc-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-zinc-500 text-slate-500">Tap to upload screenshot</p>
                          </>
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <Image
                          src={previewImage}
                          alt="Preview"
                          width={500}
                          height={500}
                          className="w-full rounded-lg"
                        />
                        <button
                          onClick={() => { setPreviewImage(null); setDetectedData(null); }}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {detectedData && (
                        <div className="p-4 bg-emerald-50 bg-emerald-50 rounded-lg">
                          <p className="text-sm font-medium text-emerald-600 text-emerald-600 mb-2">Detected:</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-zinc-900 text-slate-900">
                                {detectedData.steps.toLocaleString()} steps
                              </p>
                              <p className="text-sm text-zinc-500 text-slate-500">
                                {detectedData.date}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setPreviewImage(null); setDetectedData(null); }}
                                className="btn-secondary"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={confirmSubmission}
                                disabled={uploading}
                                className="btn-primary"
                              >
                                {uploading ? "Submitting..." : "Confirm"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Leaderboard */}
            <div className="card p-6 bg-slate-50">
              <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4">
                Leaderboard
              </h2>
              
              {/* Motivation */}
              {userRank && (
                <div className="mb-4 p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg text-white">
                  <p className="font-medium">{getMotivationText()}</p>
                </div>
              )}
              
              {leaderboard.length === 0 ? (
                <p className="text-zinc-500 text-slate-500 text-center py-8">
                  No entries yet. Be the first to submit!
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => {
                    const isCurrentUser = entry.userId === userId;
                    
                    return (
                      <div
                        key={entry.userId}
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                          isCurrentUser 
                            ? "bg-emerald-50 bg-emerald-50 border border-emerald-200 border-emerald-200"
                            : "bg-zinc-50 bg-slate-100"
                        }`}
                      >
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          entry.rank === 1 ? "bg-yellow-400 text-yellow-900" :
                          entry.rank === 2 ? "bg-zinc-300 text-zinc-700" :
                          entry.rank === 3 ? "bg-amber-600 text-white" :
                          "bg-zinc-200 bg-slate-200 text-zinc-600 text-slate-600"
                        }`}>
                          {entry.rank <= 3 ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ) : entry.rank}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            isCurrentUser ? "text-emerald-600 text-emerald-600" : "text-zinc-900 text-slate-900"
                          }`}>
                            {entry.userName}
                            {isCurrentUser && <span className="text-zinc-400 text-sm ml-1">(You)</span>}
                          </p>
                          <p className="text-xs text-zinc-500 text-slate-500">
                            {entry.dailyAverage.toLocaleString()} avg/day · {entry.entries} entries
                          </p>
                        </div>
                        
                        {/* Steps */}
                        <div className="text-right">
                          <p className="font-bold text-zinc-900 text-slate-900">
                            {entry.totalSteps.toLocaleString()}
                          </p>
                          <p className="text-xs text-zinc-500 text-slate-500">steps</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {!isParticipant && (
          <div className="card p-8 text-center bg-slate-50">
            <div className="w-20 h-20 bg-zinc-100 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 text-slate-900 mb-2">
              Join to See Details
            </h3>
            <p className="text-zinc-500 text-slate-500 mb-4">
              Join this competition to track your progress and see the leaderboard
            </p>
            <button
              onClick={joinCompetition}
              disabled={joining}
              className="btn-primary"
            >
              {joining ? "Joining..." : "Join Competition"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
