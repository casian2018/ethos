"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import UploadZone from "@/components/features/sleep/UploadZone";
import SleepChart from "@/components/features/sleep/SleepChart";
import AnimalCard, { calculateChronotype } from "@/components/features/sleep/AnimalCard";
import TimelineChart from "@/components/features/sleep/TimelineChart";
import SmartTips from "@/components/features/sleep/SmartTips";

const auth = firebaseAuth!;
const db = firebaseDb!;

// Interface for parsed sleep data
interface ParsedSleepData {
  date: string;
  asleepTime: string;
  awakeTime: string;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  awakeDuration: number;
  efficiency: number;
}

// Extended interface for sleep record
interface SleepRecord {
  id: string;
  userId: string;
  date: string;
  sleepHours: number;
  sleepQuality: number;
  notes?: string;
  detailedData?: {
    asleepTime?: string;
    awakeTime?: string;
    deepSleep?: number;
    lightSleep?: number;
    remSleep?: number;
    awakeDuration?: number;
    efficiency?: number;
  };
  personalizedTips?: {
    nutrition: string;
    recovery: string;
    environment: string;
  };
  creativeAnalysis?: {
    chronotype: string;
    chronotypeAnimal: string;
    whyThen: string;
    sleepCourse: string;
  };
}

// User profile interface
interface UserProfile {
  id: string;
  medicalConditions: string[];
  birthDate?: string;
  [key: string]: unknown;
}

export default function SleepBiohackingPage() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<typeof auth.currentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ParsedSleepData | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUser(currentUser);
      
      // Fetch user profile for medical conditions
      try {
        const profileDoc = await getDoc(doc(db, "profiles", currentUser.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data() as UserProfile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
      
      // Fetch sleep records
      try {
        const q = query(
          collection(db, "sleepRecords"),
          where("userId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SleepRecord[];
        setSleepRecords(records.sort((a, b) => b.date.localeCompare(a.date)));
      } catch (err) {
        console.error("Error fetching sleep records:", err);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Calculate chronotype based on sleep data
  const chronotype = sleepRecords.length >= 3 
    ? calculateChronotype(
        sleepRecords
          .filter(r => r.detailedData?.asleepTime && r.detailedData?.awakeTime)
          .map(r => ({
            asleepTime: r.detailedData!.asleepTime!,
            awakeTime: r.detailedData!.awakeTime!
          }))
      )
    : "bear";

  // Calculate streak
  const calculateStreak = (records: SleepRecord[]): number => {
    if (records.length === 0) return 0;
    
    // Sort by date descending
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sorted.length; i++) {
      const recordDate = new Date(sorted[i].date.split('/').reverse().join('-'));
      const diffDays = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If within 1 day and sleep was good (>= 7 hours)
      if (diffDays <= 1 && sorted[i].sleepHours >= 7) {
        streak++;
      } else if (diffDays > i + 1) {
        break;
      }
    }
    
    return streak;
  };

  // Get chronotype info
  const getChronotypeInfo = () => {
    const info: Record<string, { tips: string[]; circadianInfo: { peakEnergy: string; lowEnergy: string; recommendedBedtime: string; recommendedWakeTime: string } }> = {
      wolf: {
        tips: [
          "Accept your natural rhythm - work with it, not against it",
          "Schedule important tasks for evening hours",
          "Use blackout curtains for morning sleep",
          "Avoid bright lights at night"
        ],
        circadianInfo: {
          peakEnergy: "20:00 - 24:00",
          lowEnergy: "06:00 - 10:00",
          recommendedBedtime: "00:00",
          recommendedWakeTime: "08:00"
        }
      },
      lion: {
        tips: [
          "Wake up early and tackle hardest tasks first",
          "Morning exercise boosts your energy",
          "Avoid caffeine after 14:00",
          "Stick to a strict sleep schedule"
        ],
        circadianInfo: {
          peakEnergy: "06:00 - 12:00",
          lowEnergy: "14:00 - 16:00",
          recommendedBedtime: "21:00",
          recommendedWakeTime: "05:00"
        }
      },
      bear: {
        tips: [
          "Follow the solar cycle for optimal energy",
          "Morning sunlight helps regulate your rhythm",
          "Avoid screens 1 hour before bed",
          "Consistent wake time is key"
        ],
        circadianInfo: {
          peakEnergy: "10:00 - 14:00",
          lowEnergy: "14:00 - 16:00",
          recommendedBedtime: "22:00",
          recommendedWakeTime: "07:00"
        }
      },
      dolphin: {
        tips: [
          "Create a relaxing bedtime routine",
          "Keep bedroom cool and dark",
          "Avoid caffeine entirely",
          "Try relaxation techniques before sleep"
        ],
        circadianInfo: {
          peakEnergy: "10:00 - 12:00",
          lowEnergy: "22:00 - 24:00",
          recommendedBedtime: "23:00",
          recommendedWakeTime: "06:00"
        }
      }
    };
    return info[chronotype] || info.bear;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setExtractedData(null);
    setError("");
  };

  // Simulate AI extraction (in production, this would use Gemini API)
  const simulateExtraction = async () => {
    setIsProcessing(true);
    setError("");
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock data based on current date
    const today = new Date();
    const mockData: ParsedSleepData = {
      date: today.toLocaleDateString("ro-RO"),
      asleepTime: "23:30",
      awakeTime: "07:15",
      deepSleep: 95,
      lightSleep: 180,
      remSleep: 110,
      awakeDuration: 15,
      efficiency: 88
    };
    
    setExtractedData(mockData);
    setIsProcessing(false);
  };

  // Save extracted data
  const saveSleepData = async () => {
    if (!user || !extractedData) return;
    
    setIsProcessing(true);
    try {
      const sleepRecord = {
        userId: user.uid,
        date: extractedData.date,
        sleepHours: (new Date(`2000-01-01 ${extractedData.awakeTime}`).getTime() - 
                  new Date(`2000-01-01 ${extractedData.asleepTime}`).getTime()) / (1000 * 60 * 60),
        sleepQuality: Math.round(extractedData.efficiency / 20),
        detailedData: {
          asleepTime: extractedData.asleepTime,
          awakeTime: extractedData.awakeTime,
          deepSleep: extractedData.deepSleep,
          lightSleep: extractedData.lightSleep,
          remSleep: extractedData.remSleep,
          awakeDuration: extractedData.awakeDuration,
          efficiency: extractedData.efficiency
        }
      };
      
      await addDoc(collection(db, "sleepRecords"), sleepRecord);
      
      // Refresh records
      const q = query(collection(db, "sleepRecords"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SleepRecord[];
      setSleepRecords(records.sort((a, b) => b.date.localeCompare(a.date)));
      
      setSuccess(language === "ro" ? "Date de somn salvate!" : "Sleep data saved!");
      setPreviewUrl(null);
      setExtractedData(null);
      setSelectedFile(null);
    } catch (err) {
      console.error("Error saving sleep data:", err);
      setError(language === "ro" ? "Eroare la salvare" : "Error saving data");
    }
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Get chart data
  const chartData = sleepRecords.slice(0, 7).reverse().map(record => ({
    date: record.date.split("/")[0].slice(0, 3),
    target: 8,
    actual: record.sleepHours
  }));

  // Get timeline data
  const timelineData = sleepRecords
    .filter(r => r.detailedData?.asleepTime)
    .slice(0, 1)
    .map(r => ({
      date: r.date,
      asleepTime: r.detailedData!.asleepTime!,
      awakeTime: r.detailedData!.awakeTime!,
      deepSleep: r.detailedData!.deepSleep || 0,
      lightSleep: r.detailedData!.lightSleep || 0,
      remSleep: r.detailedData!.remSleep || 0,
      awakeDuration: r.detailedData!.awakeDuration || 0
    }));

  // Calculate average sleep
  const avgSleep = sleepRecords.length > 0
    ? Math.round(sleepRecords.reduce((sum, r) => sum + r.sleepHours, 0) / sleepRecords.length * 10) / 10
    : 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Night Sky Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        {/* Stars - static positions */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[5%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.5, animationDelay: '0.2s' }} />
          <div className="absolute top-[8%] left-[25%] w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ opacity: 0.7, animationDelay: '0.8s' }} />
          <div className="absolute top-[12%] left-[45%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.4, animationDelay: '1.5s' }} />
          <div className="absolute top-[15%] left-[65%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.6, animationDelay: '2.2s' }} />
          <div className="absolute top-[20%] left-[85%] w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ opacity: 0.5, animationDelay: '0.5s' }} />
          <div className="absolute top-[25%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.3, animationDelay: '1.8s' }} />
          <div className="absolute top-[30%] left-[35%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.8, animationDelay: '0.3s' }} />
          <div className="absolute top-[35%] left-[55%] w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ opacity: 0.4, animationDelay: '1.2s' }} />
          <div className="absolute top-[40%] left-[75%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.6, animationDelay: '2.5s' }} />
          <div className="absolute top-[45%] left-[5%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.5, animationDelay: '0.7s' }} />
          <div className="absolute top-[50%] left-[20%] w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ opacity: 0.3, animationDelay: '1.9s' }} />
          <div className="absolute top-[55%] left-[40%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.7, animationDelay: '0.4s' }} />
          <div className="absolute top-[60%] left-[60%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.5, animationDelay: '1.6s' }} />
          <div className="absolute top-[65%] left-[80%] w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ opacity: 0.4, animationDelay: '2.1s' }} />
          <div className="absolute top-[70%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.6, animationDelay: '0.9s' }} />
          <div className="absolute top-[75%] left-[30%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.3, animationDelay: '1.4s' }} />
          <div className="absolute top-[80%] left-[50%] w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ opacity: 0.8, animationDelay: '2.8s' }} />
          <div className="absolute top-[85%] left-[70%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.5, animationDelay: '0.6s' }} />
          <div className="absolute top-[90%] left-[90%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.7, animationDelay: '1.1s' }} />
          <div className="absolute top-[95%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ opacity: 0.4, animationDelay: '1.7s' }} />
        </div>
        {/* Nebula effect */}
        <div className="absolute inset-0 bg-gradient-radial from-emerald-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {t("sleep.title")}
              </h1>
              <p className="text-emerald-300/80 mt-1">
                {t("sleep.subtitle")}
              </p>
            </div>
            {/* Stats */}
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-emerald-400 text-xs">{language === "ro" ? "Medie Somn" : "Avg Sleep"}</p>
                <p className="text-white text-2xl font-bold">{avgSleep}h</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-emerald-400 text-xs">{language === "ro" ? "Înregistrări" : "Records"}</p>
                <p className="text-white text-2xl font-bold">{sleepRecords.length}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50">
            <p className="text-emerald-300">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Zone */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span>📱</span>
                {t("sleep.import")}
              </h2>
              <UploadZone 
                onFileSelect={handleFileSelect} 
                isProcessing={isProcessing} 
              />
              
              {/* Preview and Extract */}
              {previewUrl && (
                <div className="mt-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <img 
                      src={previewUrl} 
                      alt="Sleep screenshot" 
                      className="max-w-xs rounded-lg mx-auto border border-white/20"
                    />
                  </div>
                  
                  {!extractedData && !isProcessing && (
                    <button
                      onClick={simulateExtraction}
                      className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                    >
                      {language === "ro" ? "Extrage Date cu AI" : "Extract Data with AI"}
                    </button>
                  )}
                  
                  {extractedData && (
                    <div className="mt-4 bg-emerald-500/20 rounded-xl p-4 border border-emerald-500/50">
                      <h3 className="text-emerald-300 font-semibold mb-3">
                        {language === "ro" ? "✅ Date Extrase" : "✅ Extracted Data"}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Data:</span>
                          <span className="text-white ml-2">{extractedData.date}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Culcare:</span>
                          <span className="text-white ml-2">{extractedData.asleepTime}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Trezire:</span>
                          <span className="text-white ml-2">{extractedData.awakeTime}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Eficiență:</span>
                          <span className="text-emerald-400 ml-2">{extractedData.efficiency}%</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={saveSleepData}
                        disabled={isProcessing}
                        className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                      >
                        {language === "ro" ? "Salvează" : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sleep Chart */}
            {chartData.length > 0 && (
              <SleepChart data={chartData} />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Chronotype / Animal Card */}
            {sleepRecords.length >= 3 && (
              <AnimalCard 
                animal={chronotype}
                description=""
                tips={getChronotypeInfo().tips}
                circadianInfo={getChronotypeInfo().circadianInfo}
              />
            )}

            {/* Timeline */}
            {timelineData.length > 0 && (
              <TimelineChart records={timelineData} />
            )}

            {/* Smart Tips */}
            <SmartTips 
              medicalConditions={userProfile?.medicalConditions || []}
              sleepData={{
                avgSleepHours: avgSleep,
                avgQuality: sleepRecords.length > 0 
                  ? Math.round(sleepRecords.reduce((sum, r) => sum + r.sleepQuality, 0) / sleepRecords.length)
                  : 0
              }}
            />
          </div>
        </div>

        {/* Sleep History */}
        {sleepRecords.length > 0 && (
          <div className="mt-8">
            <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <span>📋</span>
              {language === "ro" ? "Istoricul Somnului" : "Sleep History"}
            </h2>
            
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-emerald-400 text-xs">{language === "ro" ? "Total Nopți" : "Total Nights"}</p>
                <p className="text-white text-2xl font-bold">{sleepRecords.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-emerald-400 text-xs">{language === "ro" ? "Medie Ore" : "Avg Hours"}</p>
                <p className="text-white text-2xl font-bold">{avgSleep}h</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-emerald-400 text-xs">{language === "ro" ? "Calitate Medie" : "Avg Quality"}</p>
                <p className="text-white text-2xl font-bold">
                  {Math.round(sleepRecords.reduce((sum, r) => sum + r.sleepQuality, 0) / sleepRecords.length * 10) / 10}/5
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-emerald-400 text-xs">{language === "ro" ? "Streak" : "Streak"}</p>
                <p className="text-white text-2xl font-bold">{calculateStreak(sleepRecords)} 🔥</p>
              </div>
            </div>
            
            {/* Records Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sleepRecords.map((record, index) => (
                <div 
                  key={record.id}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:border-emerald-500/50 transition-all hover:scale-[1.02]"
                >
                  {/* Date & Hours */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-white font-semibold text-lg">{record.date}</span>
                      <p className="text-emerald-400 text-sm">
                        {record.detailedData?.asleepTime || "--:--"} → {record.detailedData?.awakeTime || "--:--"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${record.sleepHours >= 7 ? "text-emerald-400" : record.sleepHours >= 5 ? "text-yellow-400" : "text-red-400"}`}>
                        {record.sleepHours}h
                      </span>
                    </div>
                  </div>
                  
                  {/* Sleep Quality Stars */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star} 
                          className={`text-lg ${star <= record.sleepQuality ? "text-yellow-400" : "text-slate-600"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-slate-400 text-sm">
                      {record.sleepQuality}/5
                    </span>
                  </div>
                  
                  {/* Sleep Stages */}
                  {record.detailedData?.deepSleep !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-400">🌙 Deep</span>
                        <span className="text-white">{record.detailedData.deepSleep} min</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                          style={{ width: `${((record.detailedData?.deepSleep || 0) / 120) * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">💤 REM</span>
                        <span className="text-white">{record.detailedData?.remSleep || 0} min</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                          style={{ width: `${((record.detailedData?.remSleep || 0) / 120) * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-cyan-400">☁️ Light</span>
                        <span className="text-white">{record.detailedData?.lightSleep || 0} min</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                          style={{ width: `${((record.detailedData?.lightSleep || 0) / 240) * 100}%` }}
                        />
                      </div>
                      
                      {/* Efficiency */}
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                        <span className="text-emerald-400">⚡ Efficiency</span>
                        <span className="text-white font-semibold">{record.detailedData.efficiency}%</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {record.notes && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-slate-400 text-xs italic">{record.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Load More */}
            {sleepRecords.length > 6 && (
              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  {language === "ro" 
                    ? `Afișare ${sleepRecords.length} înregistrări` 
                    : `Showing ${sleepRecords.length} records`}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Empty State */}
        {sleepRecords.length === 0 && (
          <div className="mt-8 text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <h3 className="text-white text-xl font-semibold mb-2">
              {language === "ro" ? "Încă nu ai date de somn" : "No sleep data yet"}
            </h3>
            <p className="text-slate-400 mb-6">
              {language === "ro" 
                ? "Importă un screenshot din Apple Health sau Samsung Health pentru a începe" 
                : "Import a screenshot from Apple Health or Samsung Health to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
