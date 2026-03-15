"use client";

import { useLanguage } from "@/components/LanguageContext";

interface TimelineEvent {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  color: string;
  isCritical?: boolean;
  criticalMessage?: string;
}

interface SleepTimelineProps {
  records: Array<{
    date: string;
    asleepTime: string;
    awakeTime: string;
    deepSleep: number;
    lightSleep: number;
    remSleep: number;
    awakeDuration?: number;
  }>;
}

export default function SleepTimeline({ records }: SleepTimelineProps) {
  const { t, language } = useLanguage();
  
  if (records.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200">
        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2 mb-4">
          <span className="text-2xl">🌙</span>
          {t("sleep.timeline")}
        </h3>
        <p className="text-slate-500 text-center py-8">
          {language === "ro" 
            ? "Încă nu ai date de somn. Importă un screenshot pentru a vedea timeline-ul."
            : "No sleep data yet. Import a screenshot to see your timeline."}
        </p>
      </div>
    );
  }

  // Convert time string to decimal hour
  const timeToDecimal = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60;
  };

  // Get the most recent record
  const latestRecord = records[0];
  const asleepTime = timeToDecimal(latestRecord.asleepTime);
  const awakeTime = timeToDecimal(latestRecord.awakeTime);
  
  // Calculate timeline events
  const events: TimelineEvent[] = [
    {
      id: "evening",
      label: language === "ro" ? "Seara" : "Evening",
      startHour: 18,
      endHour: asleepTime > 22 ? asleepTime : 22,
      color: "bg-amber-400",
      isCritical: asleepTime > 23,
      criticalMessage: language === "ro" 
        ? "❌ Ai adormit după ora 23:00 - Hormonul de creștere este afectat"
        : "❌ You fell asleep after 23:00 - Growth hormone is affected"
    },
    {
      id: "sleep",
      label: language === "ro" ? "Somn" : "Sleep",
      startHour: asleepTime > 22 ? asleepTime : 22,
      endHour: awakeTime,
      color: "bg-indigo-500",
      isCritical: asleepTime > 23 || (awakeTime - asleepTime) < 6,
      criticalMessage: (awakeTime - asleepTime) < 6 
        ? (language === "ro" 
            ? "❌ Ai dormit sub 6 ore - Recuperarea este insuficientă"
            : "❌ You slept less than 6 hours - Recovery is insufficient")
        : undefined
    },
    {
      id: "morning",
      label: language === "ro" ? "Dimineața" : "Morning",
      startHour: awakeTime,
      endHour: Math.min(awakeTime + 2, 10),
      color: "bg-orange-400",
      isCritical: awakeTime > 9,
      criticalMessage: awakeTime > 9 
        ? (language === "ro" 
            ? "⚠️ Te-ai trezit după ora 9:00 - Ritmul circadian poate fi afectat"
            : "⚠️ You woke up after 9:00 - Circadian rhythm may be affected")
        : undefined
    }
  ];

  // Hours to display
  const hours = Array.from({ length: 16 }, (_, i) => i + 18); // 18:00 to 09:00

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          {t("sleep.timeline")}
        </h3>
        <span className="text-slate-500 text-sm">{latestRecord.date}</span>
      </div>
      
      {/* Timeline chart */}
      <div className="relative overflow-x-auto">
        {/* Hours header */}
        <div className="flex mb-4 min-w-[600px]">
          {hours.map((hour) => (
            <div key={hour} className="flex-1 text-center text-xs text-slate-400">
              {hour > 24 ? `${hour - 24}h` : `${hour}h`}
            </div>
          ))}
        </div>
        
        {/* Timeline bar */}
        <div className="relative h-16 bg-slate-100 rounded-xl min-w-[600px] overflow-hidden">
          {/* Background gradient to show night */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
          <div className="absolute inset-0 opacity-30" 
            style={{
              background: `linear-gradient(to right, 
                transparent 0%, 
                transparent ${((18 - 18) / 16) * 100}%, 
                #1e3a5f ${((22 - 18) / 16) * 100}%, 
                #1e3a5f ${((6 - 18 + 24) / 16) * 100}%, 
                transparent ${((10 - 18 + 24) / 16) * 100}%,
                transparent 100%)`
            }} 
          />
          
          {/* Events */}
          {events.map((event) => {
            const startPercent = ((event.startHour - 18 + 24) % 24) / 16 * 100;
            const endPercent = ((event.endHour - 18 + 24) % 24) / 16 * 100;
            const width = Math.max(endPercent - startPercent, 5);
            
            return (
              <div
                key={event.id}
                className={`absolute top-2 bottom-2 rounded-lg ${event.color} flex items-center justify-center transition-all`}
                style={{
                  left: `${startPercent}%`,
                  width: `${width}%`,
                }}
              >
                <span className="text-white text-xs font-medium truncate px-2">
                  {event.label}
                </span>
              </div>
            );
          })}
          
          {/* Current time marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500"
            style={{ left: `${((new Date().getHours() - 18 + 24) % 24) / 16 * 100}%` }}
          />
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs">
          {events.map((event) => (
            <div key={event.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${event.color}`} />
              <span className="text-slate-600">{event.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Critical messages */}
      {events.filter(e => e.isCritical && e.criticalMessage).map((event) => (
        <div 
          key={event.id}
          className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <p className="text-amber-800 text-sm">{event.criticalMessage}</p>
        </div>
      ))}
      
      {/* Sleep stages breakdown */}
      {latestRecord.deepSleep > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-slate-700 font-semibold mb-3">
            {language === "ro" ? "📊 Etapele somnului" : "📊 Sleep Stages"}
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-purple-100 rounded-xl p-3 text-center">
              <p className="text-purple-600 text-xs mb-1">{language === "ro" ? "Deep" : "Deep"}</p>
              <p className="text-purple-800 font-bold">{latestRecord.deepSleep} min</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-3 text-center">
              <p className="text-blue-600 text-xs mb-1">REM</p>
              <p className="text-blue-800 font-bold">{latestRecord.remSleep} min</p>
            </div>
            <div className="bg-cyan-100 rounded-xl p-3 text-center">
              <p className="text-cyan-600 text-xs mb-1">{language === "ro" ? "Light" : "Light"}</p>
              <p className="text-cyan-800 font-bold">{latestRecord.lightSleep} min</p>
            </div>
            <div className="bg-orange-100 rounded-xl p-3 text-center">
              <p className="text-orange-600 text-xs mb-1">{language === "ro" ? "Awake" : "Awake"}</p>
              <p className="text-orange-800 font-bold">{latestRecord.awakeDuration || 0} min</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
