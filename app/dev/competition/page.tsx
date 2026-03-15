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
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  where
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import confetti from "canvas-confetti";

const auth = firebaseAuth!;
const db = firebaseDb!;

// Challenge Types with i18n
const CHALLENGE_TYPES = [
  { 
    id: "step-hero", 
    emoji: "👟", 
    label: "Step Hero", 
    labelRo: "Eroul Pașilor",
    description: "Walk 10,000 steps daily",
    descriptionRo: "Merge 10.000 de pași zilnic",
    badge: "🏅",
    color: "from-orange-400 to-red-500"
  },
  { 
    id: "sleep-master", 
    emoji: "😴", 
    label: "Sleep Master", 
    labelRo: "Maestrul Somnului",
    description: "Sleep 8+ hours for 7 days",
    descriptionRo: "Dormi 8+ ore timp de 7 zile",
    badge: "🌙",
    color: "from-indigo-400 to-purple-500"
  },
  { 
    id: "consistent-trainer", 
    emoji: "💪", 
    label: "Consistent Trainer", 
    labelRo: "Antrenor Conscient",
    description: "Train 5 days in a row",
    descriptionRo: "Antrenează-te 5 zile la rând",
    badge: "🔥",
    color: "from-emerald-400 to-teal-500"
  },
  { 
    id: "hydration-hero", 
    emoji: "💧", 
    label: "Hydration Hero", 
    labelRo: "Erou al Hidratării",
    description: "Drink 2L water daily",
    descriptionRo: "Bea 2L de apă zilnic",
    badge: "💎",
    color: "from-blue-400 to-cyan-500"
  },
  { 
    id: "meditation-mind", 
    emoji: "🧘", 
    label: "Meditation Mind", 
    labelRo: "Minte Meditativă",
    description: "Meditate 10 min daily",
    descriptionRo: "Meditează 10 min zilnic",
    badge: "🧠",
    color: "from-violet-400 to-pink-500"
  }
];

interface Competition {
  id: string;
  name: string;
  description?: string;
  challengeType?: string;
  createdBy: string;
  participants: string[];
  startDate: unknown;
  endDate: unknown;
  dailyStepGoal: number;
  createdAt: unknown;
  prize?: string;
}

interface UserChallenge {
  id: string;
  challengeType: string;
  progress: number;
  target: number;
  completed: boolean;
  joinedAt: Date;
}

export default function CompetitionPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedChallengeType, setSelectedChallengeType] = useState("step-hero");
  const [userId, setUserId] = useState<string | null>(null);
  const [newCompetition, setNewCompetition] = useState({
    name: "",
    description: "",
    dailyStepGoal: 10000,
    days: 7,
    prize: ""
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      
      setUserId(currentUser.uid);
      
      try {
        // Load competitions
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

        // Load user's active challenges
        const userChallengesQuery = query(
          collection(db, "user_challenges"),
          where("userId", "==", currentUser.uid)
        );
        
        const challengesSnapshot = await getDocs(userChallengesQuery);
        const challenges: UserChallenge[] = [];
        challengesSnapshot.forEach((doc) => {
          challenges.push({ id: doc.id, ...doc.data() } as UserChallenge);
        });
        setUserChallenges(challenges);
        
      } catch (err) {
        console.error("Error loading data:", err);
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
        challengeType: selectedChallengeType,
        createdBy: currentUser.uid,
        participants: [currentUser.uid],
        startDate: startDate,
        endDate: endDate,
        dailyStepGoal: newCompetition.dailyStepGoal,
        prize: newCompetition.prize,
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
      setNewCompetition({ name: "", description: "", dailyStepGoal: 10000, days: 7, prize: "" });
    } catch (err) {
      console.error("Error creating competition:", err);
    }
  };

  const handleJoinChallenge = async (challengeType: string) => {
    if (!userId) return;
    
    try {
      const challengeRef = await addDoc(collection(db, "user_challenges"), {
        userId,
        challengeType,
        progress: 0,
        target: getChallengeTarget(challengeType),
        completed: false,
        joinedAt: new Date()
      });

      // Trigger confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });

      setUserChallenges(prev => [...prev, {
        id: challengeRef.id,
        challengeType,
        progress: 0,
        target: getChallengeTarget(challengeType),
        completed: false,
        joinedAt: new Date()
      }]);
    } catch (err) {
      console.error("Error joining challenge:", err);
    }
  };

  const getChallengeTarget = (type: string): number => {
    switch (type) {
      case "step-hero": return 70000; // 10k steps * 7 days
      case "sleep-master": return 7;
      case "consistent-trainer": return 5;
      case "hydration-hero": return 14; // 2L * 7 days
      case "meditation-mind": return 70; // 10 min * 7 days
      default: return 7;
    }
  };

  const getTimeRemaining = (endDate: unknown): string => {
    if (!endDate) return "";
    const end = new Date(endDate as number);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return language === "ro" ? "Încheiat" : "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}${language === "ro" ? "z" : "d"} ${hours}${language === "ro" ? "h" : "h"}`;
    }
    return `${hours}${language === "ro" ? "h rămase" : "h left"}`;
  };

  const getChallengeProgress = (challengeType: string): number => {
    const challenge = userChallenges.find(c => c.challengeType === challengeType);
    if (!challenge) return 0;
    return Math.min(100, (challenge.progress / challenge.target) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-600 text-slate-500">
          {language === "ro" ? "Se încarcă..." : "Loading..."}
        </div>
      </div>
    );
  }

  const t = (ro: string, en: string) => language === "ro" ? ro : en;

  return (
    <div className="max-w-5xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">
          {t("Provocări & Competiții", "Challenges & Competitions")}
        </h1>
        <p className="text-zinc-600">
          {t("Completează provocări, urmărește-ți progresul și concurează cu alții!", 
             "Complete challenges, track your progress, and compete with others!")}
        </p>
      </div>

      {/* Challenge Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-zinc-800 mb-4">
          {t("Provocări Active", "Active Challenges")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CHALLENGE_TYPES.map((challenge) => {
            const isJoined = userChallenges.some(c => c.challengeType === challenge.id);
            const progress = getChallengeProgress(challenge.id);
            const isCompleted = progress >= 100;
            
            return (
              <div 
                key={challenge.id}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${challenge.color} p-5 text-white shadow-lg transition-transform hover:scale-[1.02]`}
              >
                {/* Badge */}
                <div className="absolute top-3 right-3 text-2xl">
                  {challenge.badge}
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-bold mb-1">
                  {language === "ro" ? challenge.labelRo : challenge.label}
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  {language === "ro" ? challenge.descriptionRo : challenge.description}
                </p>
                
                {/* Progress */}
                {isJoined && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{t("Progres", "Progress")}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {isCompleted && (
                      <div className="mt-2 text-center text-sm font-bold animate-pulse">
                        🎉 {t("Completat!", "Completed!")}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Join Button */}
                {!isJoined ? (
                  <button
                    onClick={() => handleJoinChallenge(challenge.id)}
                    className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm backdrop-blur-sm transition-colors"
                  >
                    {t("Alătură-te", "Join Challenge")}
                  </button>
                ) : !isCompleted && (
                  <button
                    onClick={() => router.push(`/dev/competition?challenge=${challenge.id}`)}
                    className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm backdrop-blur-sm transition-colors"
                  >
                    {t("Continuă", "Continue")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitions Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-zinc-800">
          {t("Competiții", "Competitions")}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          {showForm 
            ? t("Anulează", "Cancel")
            : t("Creează Competiție", "Create Competition")
          }
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 mb-6 border border-zinc-200 shadow-sm">
          <h3 className="font-medium text-zinc-900 mb-4">
            {t("Creează o nouă competiție", "Create New Competition")}
          </h3>
          
          {/* Challenge Type Selector */}
          <div className="mb-4">
            <label className="block text-sm text-zinc-700 mb-2">
              {t("Tip de Provocare", "Challenge Type")}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {CHALLENGE_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedChallengeType(type.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedChallengeType === type.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{type.emoji}</div>
                  <div className="text-xs font-medium">
                    {language === "ro" ? type.labelRo : type.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-700 mb-1">
                {t("Nume", "Name")}
              </label>
              <input
                type="text"
                value={newCompetition.name}
                onChange={(e) => setNewCompetition({ ...newCompetition, name: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900"
                placeholder={t("Ex: Provocarea de Martie", "e.g., March Challenge")}
              />
            </div>
            
            <div>
              <label className="block text-sm text-zinc-700 mb-1">
                {t("Descriere", "Description")}
              </label>
              <textarea
                value={newCompetition.description}
                onChange={(e) => setNewCompetition({ ...newCompetition, description: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-700 mb-1">
                {t("Premiu", "Prize")}
              </label>
              <input
                type="text"
                value={newCompetition.prize}
                onChange={(e) => setNewCompetition({ ...newCompetition, prize: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900"
                placeholder={t("Ex: Medalie de Aur, 100 XP", "e.g., Gold Medal, 100 XP")}
              />
            </div>
            
            <div>
              <label className="block text-sm text-zinc-700 mb-1">
                {t("Scop zilnic (pași)", "Daily Step Goal")}: {newCompetition.dailyStepGoal.toLocaleString()}
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
              <label className="block text-sm text-zinc-700 mb-1">
                {t("Durata (zile)", "Duration (days)")}: {newCompetition.days}
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
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              {t("Creează", "Create")}
            </button>
          </div>
        </div>
      )}

      {/* Competition List */}
      {competitions.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-xl">
          <p className="text-zinc-600 mb-4">
            {t("Nu există competiții momentan.", "No competitions available at the moment.")}
          </p>
          <p className="text-sm text-zinc-500">
            {t("Creează prima competiție!", "Create the first competition!")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {competitions.map((comp) => {
            const challengeType = CHALLENGE_TYPES.find(c => c.id === comp.challengeType);
            const timeRemaining = getTimeRemaining(comp.endDate);
            
            return (
              <div 
                key={comp.id}
                className="bg-white rounded-xl p-5 border border-zinc-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {challengeType && <span className="text-xl">{challengeType.emoji}</span>}
                      <h3 className="font-semibold text-zinc-900">
                        {comp.name}
                      </h3>
                    </div>
                    {comp.description && (
                      <p className="text-sm text-zinc-600">
                        {comp.description}
                      </p>
                    )}
                  </div>
                  {comp.prize && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                      {comp.prize}
                    </span>
                  )}
                </div>
                
                {/* Challenge Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{timeRemaining}</span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{comp.participants?.length || 0} {t("participanți", "participants")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{comp.dailyStepGoal?.toLocaleString() || 10000} {t("pași", "steps")}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => router.push(`/dev/competition/${comp.id}`)}
                  className="w-full py-2.5 bg-emerald-100 text-emerald-700 font-medium rounded-lg hover:bg-emerald-200 transition-colors"
                >
                  {t("Vezi Detalii & Leaderboard", "View Details & Leaderboard")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
