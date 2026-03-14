"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  addDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

// Extended interface for detailed sleep data
interface SleepRecord {
  id: string;
  userId: string;
  date: string;
  sleepHours: number;
  sleepQuality: number;
  notes?: string;
  // Detailed sleep data from OCR
  detailedData?: {
    asleepTime?: string;
    awakeTime?: string;
    deepSleep?: number;
    lightSleep?: number;
    remSleep?: number;
    awakeDuration?: number;
    efficiency?: number;
  };
  // AI generated tips
  personalizedTips?: {
    nutrition?: string;
    recovery?: string;
    environment?: string;
  };
  // Creative analysis
  creativeAnalysis?: {
    chronotype?: string;
    chronotypeAnimal?: string;
    sleepCourse?: string;
    whyThen?: string;
  };
  createdAt: unknown;
}

// User profile interface
interface UserProfile {
  age?: number;
  injuries?: string[];
  sport?: string;
  experienceLevel?: string;
  goals?: string[];
}

export default function SleepAnalysisPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState({ sleepHours: 7, sleepQuality: 3, notes: "" });
  
  // New: Image upload and OCR states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    date: string;
    asleepTime: string;
    awakeTime: string;
    deepSleep: number;
    lightSleep: number;
    remSleep: number;
    awakeDuration: number;
    efficiency: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [generatingTips, setGeneratingTips] = useState(false);
  const [tips, setTips] = useState<{nutrition: string; recovery: string; environment: string} | null>(null);
  
  // Creative analysis state
  const [creativeAnalysis, setCreativeAnalysis] = useState<{
    chronotype: string;
    chronotypeAnimal: string;
    chronotypeEmoji: string;
    sleepCourse: string;
    whyThen: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          age: data.age,
          injuries: data.injuries || [],
          sport: data.sport || data.preferredSport || "",
          experienceLevel: data.experienceLevel,
          goals: data.goals || []
        });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      
      try {
        // Fetch user profile
        await fetchUserProfile(currentUser.uid);
        
        // Query sleep records
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

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null);
      setTips(null);
      setError(null);
    }
  };

  // Extract data from image using Tesseract.js
  const extractDataFromImage = async () => {
    if (!selectedImage) return;
    
    setExtracting(true);
    setError(null);
    
    try {
      // Import Tesseract.js dynamically
      const Tesseract = await import("tesseract.js");
      
      // Perform OCR on the image
      const result = await Tesseract.recognize(selectedImage, 'eng', {
        logger: (m: any) => console.log(m)
      });
      
      // Extract text from result
      const text = result.data.text;
      console.log("OCR Result:", text);
      
      // Parse the extracted text
      const parsedData = parseSleepData(text);
      setExtractedData(parsedData);
      
      // Generate creative analysis
      calculateCreativeAnalysis(parsedData);
      
      // Generate personalized tips based on extracted data and user profile
      await generatePersonalizedTips(parsedData);
      
    } catch (err) {
      console.error("OCR Error:", err);
      setError(language === "ro" ? "Eroare la extragerea datelor. Încearcă din nou." : "Error extracting data. Please try again.");
    } finally {
      setExtracting(false);
    }
  };

  // Parse OCR text into structured data
  const parseSleepData = (text: string): any => {
    // Default values
    const data = {
      date: new Date().toISOString().split("T")[0],
      asleepTime: "22:00",
      awakeTime: "06:00",
      deepSleep: 0,
      lightSleep: 0,
      remSleep: 0,
      awakeDuration: 0,
      efficiency: 85
    };

    // Try to extract times (pattern like HH:MM or HH.MM)
    const timePattern = /(\d{1,2})[.:](\d{2})/g;
    const times = text.match(timePattern);
    
    if (times && times.length >= 2) {
      // First time is usually asleep, second is awake
      data.asleepTime = times[0].replace('.', ':');
      data.awakeTime = times[1].replace('.', ':');
    }

    // Try to extract dates
    const datePattern = /(\d{1,2})\/(\d{1,2})/;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      data.date = `2026-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
    }

    // Extract sleep stages
    // Deep sleep
    const deepMatch = text.match(/Deep.*?(\d+)\s*m/i) || text.match(/(\d+)\s*min.*Deep/i);
    if (deepMatch) data.deepSleep = parseInt(deepMatch[1]);
    
    // Light sleep
    const lightMatch = text.match(/Light.*?(\d+)\s*(?:h|m)/i);
    if (lightMatch) {
      if (lightMatch[1].includes('h')) {
        data.lightSleep = parseInt(lightMatch[1]) * 60;
      } else {
        data.lightSleep = parseInt(lightMatch[1]);
      }
    }
    
    // REM sleep
    const remMatch = text.match(/REM.*?(\d+)\s*m/i) || text.match(/(\d+)\s*min.*REM/i);
    if (remMatch) data.remSleep = parseInt(remMatch[1]);
    
    // Awake duration
    const awakeMatch = text.match(/Awake.*?(\d+)\s*m/i);
    if (awakeMatch) data.awakeDuration = parseInt(awakeMatch[1]);

    // Calculate efficiency if we have total sleep time
    const totalSleep = data.deepSleep + data.lightSleep + data.remSleep;
    const timeInBed = totalSleep + data.awakeDuration;
    if (timeInBed > 0) {
      data.efficiency = Math.round((totalSleep / timeInBed) * 100);
    }

    return data;
  };

  // Calculate creative analysis based on sleep data
  const calculateCreativeAnalysis = (sleepData: any) => {
    // Parse asleep time to get hours
    const asleepParts = sleepData.asleepTime.split(':');
    const asleepHour = parseInt(asleepParts[0]);
    const asleepMinutes = parseInt(asleepParts[1]);
    const totalSleepMinutes = sleepData.deepSleep + sleepData.lightSleep + sleepData.remSleep;
    const sleepHours = totalSleepMinutes / 60;
    
    // Determine chronotype based on bedtime
    let chronotype = "";
    let chronotypeAnimal = "";
    let chronotypeEmoji = "";
    
    if (asleepHour >= 20 && asleepHour < 23) {
      chronotype = language === "ro" ? "Levăreț (Lark)" : "Lark (Early Bird)";
      chronotypeAnimal = language === "ro" ? "Leu" : "Lion";
      chronotypeEmoji = "🦁";
    } else if (asleepHour >= 23 && asleepHour < 1) {
      chronotype = language === "ro" ? "Urs (Bear)" : "Bear";
      chronotypeAnimal = language === "ro" ? "Urs" : "Bear";
      chronotypeEmoji = "🐻";
    } else if (asleepHour >= 1 && asleepHour < 5) {
      chronotype = language === "ro" ? "Lup (Wolf)" : "Wolf";
      chronotypeAnimal = language === "ro" ? "Lup" : "Wolf";
      chronotypeEmoji = "🐺";
    } else {
      chronotype = language === "ro" ? "Delfin (Dolphin)" : "Dolphin";
      chronotypeAnimal = language === "ro" ? "Delfin" : "Dolphin";
      chronotypeEmoji = "🐬";
    }
    
    // Generate "Why then" analysis
    let whyThen = "";
    if (sleepData.deepSleep === 0) {
      whyThen = language === "ro"
        ? "Ai adormit într-o fază tardivă a zilei, ceea ce a eliminat complet somnul profund. Creierul nu a avut timp să intre în faza de curățare metabolică (sistemul glicfatic)."
        : "You fell asleep in a late phase of the day, which eliminated deep sleep entirely. The brain didn't have time to enter the metabolic cleansing phase (glymphatic system).";
    } else if (sleepHours < 5) {
      whyThen = language === "ro"
        ? "Somnul prea scurt a prioritizat somnul REM în detrimentul celui profund. Corpul a încercat să proceseze emoțiile în loc să se refacă fizic."
        : "Too short sleep prioritized REM over deep sleep. The body tried to process emotions instead of physical recovery.";
    } else if (asleepHour >= 2 && asleepHour < 5) {
      whyThen = language === "ro"
        ? "Ai adormit foarte târziu, în faza de declin a melatoninei. Acest tipar este natural pentru creativi, dar perturbă ciclul circadian."
        : "You fell asleep very late, during the melatonin decline phase. This pattern is natural for creatives but disrupts the circadian cycle.";
    } else {
      whyThen = language === "ro"
        ? "Ora de culcare este relativ normală. Calitatea somnului depinde de consistența rutinei de seară."
        : "Your bedtime is relatively normal. Sleep quality depends on the consistency of your evening routine.";
    }
    
    // Generate sleep course description
    let sleepCourse = "";
    const deepPercent = sleepData.deepSleep / totalSleepMinutes * 100;
    const remPercent = sleepData.remSleep / totalSleepMinutes * 100;
    
    if (deepPercent < 10 && remPercent < 15) {
      sleepCourse = language === "ro"
        ? "O noapte frântă: recuperare fizică minimă, dar cu urme de procesare cognitivă."
        : "A broken night: minimal physical recovery, but with traces of cognitive processing.";
    } else if (deepPercent > 25 && remPercent > 20) {
      sleepCourse = language === "ro"
        ? "O noapte de aur: restaurare completă atât fizică cât și cognitivă!"
        : "A golden night: complete physical and cognitive restoration!";
    } else if (deepPercent > 30) {
      sleepCourse = language === "ro"
        ? "Recuperare fizică excelentă, dar deficit cognitiv. Corpul a fost prioritar."
        : "Excellent physical recovery but cognitive deficit. The body was prioritized.";
    } else if (remPercent > 25) {
      sleepCourse = language === "ro"
        ? "Procesare emoțională intensă. Mintea a lucrat toată noaptea la consolidarea memoriei."
        : "Intense emotional processing. The mind worked all night on memory consolidation.";
    } else {
      sleepCourse = language === "ro"
        ? "O noapte echilibrată, dar fără excelență. Ai putea îmbunătăți consistența orelor de somn."
        : "A balanced night, but without excellence. You could improve sleep hour consistency.";
    }
    
    setCreativeAnalysis({
      chronotype,
      chronotypeAnimal,
      chronotypeEmoji,
      sleepCourse,
      whyThen
    });
  };

  // Generate personalized tips using Gemini
  const generatePersonalizedTips = async (sleepData: any) => {
    if (!userProfile) return;
    
    setGeneratingTips(true);
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        // Fallback to basic tips if no API key
        setTips({
          nutrition: language === "ro" 
            ? "Evită cofeina cu 6 ore înainte de culcare. Bea ceai de mușețel."
            : "Avoid caffeine 6 hours before bed. Drink chamomile tea.",
          recovery: language === "ro"
            ? "Pentru recuperare optimă, menține temperatura camerei la 18-20°C."
            : "For optimal recovery, keep room temperature at 18-20°C.",
          environment: language === "ro"
            ? "Folosește draperii blackout și elimină sursele de lumină."
            : "Use blackout curtains and eliminate light sources."
        });
        return;
      }

      const prompt = language === "ro"
        ? `Ești un specialist în somnologie. Pe baza următoarelor date de somn și profilul userului, generează 3 sfaturi personalizate (unul pentru nutriție, unul pentru recuperare, unul pentru mediu).

DATE SOMN:
- Durata somnului: ${sleepData.deepSleep + sleepData.lightSleep + sleepData.remSleep} minute
- Deep Sleep: ${sleepData.deepSleep} min (${Math.round(sleepData.deepSleep / (sleepData.deepSleep + sleepData.lightSleep + sleepData.remSleep) * 100)}%)
- Light Sleep: ${sleepData.lightSleep} min (${Math.round(sleepData.lightSleep / (sleepData.deepSleep + sleepData.lightSleep + sleepData.remSleep) * 100)}%)
- REM: ${sleepData.remSleep} min (${Math.round(sleepData.remSleep / (sleepData.deepSleep + sleepData.lightSleep + sleepData.remSleep) * 100)}%)
- Eficiență: ${sleepData.efficiency}%

PROFIL USER:
- Vârstă: ${userProfile.age || "nespecificată"}
- Condiții medicale: ${userProfile.injuries?.join(", ") || "niciuna"}
- Sport practicat: ${userProfile.sport || "nespecificat"}

Returnează EXACT în acest format JSON (fără alte texte):
{
  "nutrition": "sfat de nutriție",
  "recovery": "sfat de recuperare",
  "environment": "sfat pentru mediu"
}`
        : `You are a sleep specialist. Based on the following sleep data and user profile, generate 3 personalized tips (one for nutrition, one for recovery, one for environment).

SLEEP DATA:
- Total sleep duration: ${sleepData.deepSleep + sleepData.lightSleep + sleepData.remSleep} minutes
- Deep Sleep: ${sleepData.deepSleep} min (${Math.round(sleepData.deepSleep / (sleepData.deepSleep + sleepData.lightSleep + sleepData.remSleep) * 100)}%)
- Light Sleep: ${sleepData.lightSleep} min (${Math.round(sleepData.lightSleep / (sleepData.deepSleep + sleepData.lightSleep + sleepData.remSleep) * 100)}%)
- REM: ${sleepData.remSleep} min (${Math.round(sleepData.remSleep / (sleepData.deepSleep + sleepData.lightSleep + sleepData.remSleep) * 100)}%)
- Efficiency: ${sleepData.efficiency}%

USER PROFILE:
- Age: ${userProfile.age || "not specified"}
- Medical conditions: ${userProfile.injuries?.join(", ") || "none"}
- Sport practiced: ${userProfile.sport || "not specified"}

Return EXACTLY in this JSON format (no other text):
{
  "nutrition": "nutrition tip",
  "recovery": "recovery tip",
  "environment": "environment tip"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            }
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const responseText = data.candidates[0].content.parts[0].text;
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const tipsData = JSON.parse(jsonMatch[0]);
          setTips(tipsData);
        }
      }
    } catch (err) {
      console.error("Error generating tips:", err);
    } finally {
      setGeneratingTips(false);
    }
  };

  // Save sleep record with extracted data
  const handleSaveExtractedSleep = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !extractedData) return;

    try {
      const totalMinutes = extractedData.deepSleep + extractedData.lightSleep + extractedData.remSleep;
      const sleepHours = totalMinutes / 60;
      
      await addDoc(collection(db, "sleep_records"), {
        userId: currentUser.uid,
        date: extractedData.date,
        sleepHours: sleepHours,
        sleepQuality: Math.round(extractedData.efficiency / 20), // Convert 0-100 to 0-5
        notes: `Deep: ${extractedData.deepSleep}min, Light: ${extractedData.lightSleep}min, REM: ${extractedData.remSleep}min`,
        detailedData: {
          asleepTime: extractedData.asleepTime,
          awakeTime: extractedData.awakeTime,
          deepSleep: extractedData.deepSleep,
          lightSleep: extractedData.lightSleep,
          remSleep: extractedData.remSleep,
          awakeDuration: extractedData.awakeDuration,
          efficiency: extractedData.efficiency
        },
        personalizedTips: tips || null,
        creativeAnalysis: creativeAnalysis ? {
          chronotype: creativeAnalysis.chronotype,
          chronotypeAnimal: creativeAnalysis.chronotypeAnimal,
          sleepCourse: creativeAnalysis.sleepCourse,
          whyThen: creativeAnalysis.whyThen
        } : null,
        createdAt: new Date()
      });
      
      // Reload records
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
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSleepRecords(records);
      
      // Reset states
      setSelectedImage(null);
      setPreviewUrl(null);
      setExtractedData(null);
      setTips(null);
      setError(null);
      
    } catch (err) {
      console.error("Error saving sleep record:", err);
      setError(language === "ro" ? "Eroare la salvare." : "Error saving.");
    }
  };

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
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {language === "ro" ? "📷 Import Screenshot" : "📷 Import Screenshot"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
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
      </div>

      {/* Image Preview and OCR Results */}
      {previewUrl && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-6 border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-white mb-4">
            {language === "ro" ? "Screenshot somn" : "Sleep Screenshot"}
          </h3>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0">
              <img 
                src={previewUrl} 
                alt="Sleep screenshot" 
                className="max-w-xs rounded-lg border border-zinc-200 dark:border-zinc-600"
              />
            </div>
            
            <div className="flex-1">
              {!extractedData ? (
                <div className="space-y-3">
                  <button
                    onClick={extractDataFromImage}
                    disabled={extracting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {extracting 
                      ? (language === "ro" ? "Se extrag datele..." : "Extracting data...")
                      : (language === "ro" ? "Extrage date din imagine" : "Extract data from image")
                    }
                  </button>
                  
                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}
                  
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {language === "ro"
                      ? "Încarcă un screenshot de la aplicația ta de monitorizare a somnului pentru a extrage automat datele."
                      : "Upload a screenshot from your sleep tracking app to automatically extract data."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Extracted Data Display */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800">
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-3">
                      {language === "ro" ? "✅ Date extrase" : "✅ Extracted Data"}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">{language === "ro" ? "Data:" : "Date:"}</span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-white">{extractedData.date}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">{language === "ro" ? "Ora culcare:" : "Asleep:"}</span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-white">{extractedData.asleepTime}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">{language === "ro" ? "Ora trezire:" : "Awake:"}</span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-white">{extractedData.awakeTime}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">{language === "ro" ? "Eficiență:" : "Efficiency:"}</span>
                        <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">{extractedData.efficiency}%</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">{language === "ro" ? "Deep:" : "Deep:"}</span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-white">{extractedData.deepSleep} min</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">{language === "ro" ? "Light:" : "Light:"}</span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-white">{extractedData.lightSleep} min</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">{language === "ro" ? "REM:" : "REM:"}</span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-white">{extractedData.remSleep} min</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">{language === "ro" ? "Awake:" : "Awake:"}</span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-white">{extractedData.awakeDuration} min</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Personalized Tips */}
                  {(generatingTips || tips) && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-3">
                        {generatingTips 
                          ? (language === "ro" ? "Se generează sfaturi..." : "Generating tips...")
                          : (language === "ro" ? "💡 Sfaturi personalizate" : "💡 Personalized Tips")
                        }
                      </h4>
                      
                      {tips && (
                        <div className="space-y-3 text-sm">
                          <div className="flex gap-2">
                            <span className="text-orange-500">🥗</span>
                            <div>
                              <p className="font-medium text-orange-700 dark:text-orange-300">
                                {language === "ro" ? "Nutriție" : "Nutrition"}
                              </p>
                              <p className="text-zinc-600 dark:text-zinc-300">{tips.nutrition}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-blue-500">🏃</span>
                            <div>
                              <p className="font-medium text-blue-700 dark:text-blue-300">
                                {language === "ro" ? "Recuperare" : "Recovery"}
                              </p>
                              <p className="text-zinc-600 dark:text-zinc-300">{tips.recovery}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-green-500">🌡️</span>
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-300">
                                {language === "ro" ? "Mediu" : "Environment"}
                              </p>
                              <p className="text-zinc-600 dark:text-zinc-300">{tips.environment}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Creative Analysis */}
                  {creativeAnalysis && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                      <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-3">
                        {language === "ro" ? "🔮 Analiză Creativă" : "🔮 Creative Analysis"}
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Chronotype */}
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{creativeAnalysis.chronotypeEmoji}</span>
                          <div>
                            <p className="font-medium text-indigo-700 dark:text-indigo-300">
                              {language === "ro" ? "Animalul de Somn" : "Sleep Animal"}
                            </p>
                            <p className="text-zinc-600 dark:text-zinc-300">
                              {creativeAnalysis.chronotype} - {creativeAnalysis.chronotypeAnimal}
                            </p>
                          </div>
                        </div>
                        
                        {/* Why Then */}
                        <div>
                          <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                            {language === "ro" ? "De ce atunci?" : "Why then?"}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            {creativeAnalysis.whyThen}
                          </p>
                        </div>
                        
                        {/* Sleep Course */}
                        <div>
                          <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                            {language === "ro" ? "Cursul Somnului" : "Sleep Course"}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            {creativeAnalysis.sleepCourse}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Save Button */}
                  <button
                    onClick={handleSaveExtractedSleep}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {language === "ro" ? "💾 Salvează înregistrarea" : "💾 Save Record"}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                      setExtractedData(null);
                      setTips(null);
                      setCreativeAnalysis(null);
                    }}
                    className="w-full py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm"
                  >
                    {language === "ro" ? "Anulează" : "Cancel"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-center justify-between mb-2">
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
              
              {/* Show detailed data if available */}
              {record.detailedData && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-zinc-400">Deep</p>
                      <p className="font-medium text-purple-600">{record.detailedData.deepSleep}m</p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-400">Light</p>
                      <p className="font-medium text-blue-600">{record.detailedData.lightSleep}m</p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-400">REM</p>
                      <p className="font-medium text-orange-600">{record.detailedData.remSleep}m</p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-400">Efficiency</p>
                      <p className="font-medium text-emerald-600">{record.detailedData.efficiency}%</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show personalized tips if available */}
              {record.personalizedTips && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                    {language === "ro" ? "💡 Sfaturi personalizate" : "💡 Personalized Tips"}
                  </p>
                  <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                    <p>🥗 {record.personalizedTips.nutrition}</p>
                    <p>🏃 {record.personalizedTips.recovery}</p>
                    <p>🌡️ {record.personalizedTips.environment}</p>
                  </div>
                </div>
              )}
              
              {/* Show creative analysis if available */}
              {record.creativeAnalysis && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                    {language === "ro" ? "🔮 Analiză Creativă" : "🔮 Creative Analysis"}
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span>🐺</span>
                      <span className="text-zinc-600 dark:text-zinc-300">
                        {record.creativeAnalysis.chronotypeAnimal}
                      </span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {record.creativeAnalysis.whyThen}
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-300 italic">
                      "{record.creativeAnalysis.sleepCourse}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
