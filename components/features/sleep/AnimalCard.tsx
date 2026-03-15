"use client";

import { useLanguage } from "@/components/LanguageContext";

type SleepAnimal = "wolf" | "lion" | "bear" | "dolphin";

interface AnimalCardProps {
  animal: SleepAnimal;
  description: string;
  tips: string[];
  circadianInfo: {
    peakEnergy: string;
    lowEnergy: string;
    recommendedBedtime: string;
    recommendedWakeTime: string;
  };
}

// Animal emojis and colors
const animalConfig: Record<SleepAnimal, { emoji: string; gradient: string; name: string }> = {
  wolf: { emoji: "🐺", gradient: "from-slate-600 to-slate-800", name: "Wolf" },
  lion: { emoji: "🦁", gradient: "from-amber-500 to-orange-600", name: "Lion" },
  bear: { emoji: "🐻", gradient: "from-amber-300 to-amber-500", name: "Bear" },
  dolphin: { emoji: "🐬", gradient: "from-cyan-400 to-blue-500", name: "Dolphin" },
};

// Animal descriptions
const animalDescriptions: Record<SleepAnimal, { en: string; ro: string }> = {
  wolf: {
    en: "You're a night owl! Your natural rhythm peaks in the evening hours.",
    ro: "Ești o bufniță de noapte! Ritmul tău natural atinge apogeul seara."
  },
  lion: {
    en: "You're an early riser! Your energy peaks in the morning.",
    ro: "Ești o persoană matinală! Energia ta atinge apogeul dimineața."
  },
  bear: {
    en: "You're in sync with the sun! Your energy follows a natural solar rhythm.",
    ro: "Ești în sync cu soarele! Energia ta urmează un ritm solar natural."
  },
  dolphin: {
    en: "You're a light sleeper! Your nervous system stays alert even at night.",
    ro: "Ești un somn ușor! Sistemul tău nervos rămâne alert chiar și noaptea."
  },
};

export default function AnimalCard({ animal, description, tips, circadianInfo }: AnimalCardProps) {
  const { language, t } = useLanguage();
  const config = animalConfig[animal];
  const animalDesc = animalDescriptions[animal];

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-90`}>
        {/* Stars effect - static positions for ESLint compliance */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-[20%] left-[80%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[30%] left-[40%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[40%] left-[60%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[50%] left-[15%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
          <div className="absolute top-[60%] left-[85%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
          <div className="absolute top-[70%] left-[30%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-[80%] left-[70%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1.8s' }} />
          <div className="absolute top-[90%] left-[50%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '2.3s' }} />
          <div className="absolute top-[15%] left-[55%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.7s' }} />
          <div className="absolute top-[25%] left-[25%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1.1s' }} />
          <div className="absolute top-[35%] left-[75%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1.6s' }} />
          <div className="absolute top-[45%] left-[45%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '2.1s' }} />
          <div className="absolute top-[55%] left-[90%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="absolute top-[65%] left-[10%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }} />
          <div className="absolute top-[75%] left-[35%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1.4s' }} />
          <div className="absolute top-[85%] left-[60%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1.9s' }} />
          <div className="absolute top-[5%] left-[90%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-[95%] left-[20%] w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
        </div>
      </div>
      
      <div className="relative z-10 p-6">
        {/* Header with animal */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
            {config.emoji}
          </div>
          <div>
            <h3 className="text-white text-2xl font-bold">{config.name}</h3>
            <p className="text-white/80 text-sm">
              {language === "ro" ? "Animalul tău de somn" : "Your Sleep Animal"}
            </p>
          </div>
        </div>
        
        {/* Description */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
          <p className="text-white/90 leading-relaxed">
            {language === "ro" ? animalDesc.ro : animalDesc.en}
          </p>
        </div>
        
        {/* Circadian Rhythm Info */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-white/60 text-xs mb-1">
              {language === "ro" ? "🔥 Energie maximă" : "🔥 Peak Energy"}
            </p>
            <p className="text-white font-semibold">{circadianInfo.peakEnergy}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-white/60 text-xs mb-1">
              {language === "ro" ? "😴 Energie scăzută" : "😴 Low Energy"}
            </p>
            <p className="text-white font-semibold">{circadianInfo.lowEnergy}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-white/60 text-xs mb-1">
              {language === "ro" ? "🌙 Culcare" : "🌙 Bedtime"}
            </p>
            <p className="text-white font-semibold">{circadianInfo.recommendedBedtime}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-white/60 text-xs mb-1">
              {language === "ro" ? "☀️ Trezire" : "☀️ Wake Time"}
            </p>
            <p className="text-white font-semibold">{circadianInfo.recommendedWakeTime}</p>
          </div>
        </div>
        
        {/* Tips */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>💡</span>
            {language === "ro" ? "Recomandări" : "Recommendations"}
          </h4>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="text-white/80 text-sm flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-500/20 to-transparent" />
    </div>
  );
}

// Function to calculate chronotype based on sleep data
export function calculateChronotype(sleepRecords: Array<{ asleepTime: string; awakeTime: string }>): SleepAnimal {
  if (sleepRecords.length < 3) return "bear";
  
  // Calculate average sleep and wake times
  const avgAsleepHour = sleepRecords.reduce((sum, r) => {
    const hour = parseInt(r.asleepTime.split(":")[0]);
    return sum + (hour < 6 ? hour + 24 : hour);
  }, 0) / sleepRecords.length;
  
  const avgWakeHour = sleepRecords.reduce((sum, r) => {
    const hour = parseInt(r.awakeTime.split(":")[0]);
    return sum + hour;
  }, 0) / sleepRecords.length;
  
  // Determine chronotype
  if (avgAsleepHour >= 23 || avgAsleepHour < 2) {
    return "wolf"; // Night owl - sleeps very late
  } else if (avgAsleepHour >= 2 && avgAsleepHour < 22) {
    return "dolphin"; // Light sleeper - irregular patterns
  } else if (avgAsleepHour >= 20 && avgAsleepHour < 22) {
    return "lion"; // Early bird - sleeps early
  } else {
    return "bear"; // Normal - follows sun
  }
}
