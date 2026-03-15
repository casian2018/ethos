"use client";

import { useLanguage } from "@/components/LanguageContext";

interface SleepChartProps {
  data: Array<{
    date: string;
    target: number;
    actual: number;
  }>;
}

export default function SleepChart({ data }: SleepChartProps) {
  const { t } = useLanguage();
  const maxValue = 12; // Max hours for chart scale
  
  const avgTarget = data.length > 0 
    ? Math.round(data.reduce((sum, d) => sum + d.target, 0) / data.length * 10) / 10 
    : 0;
  const avgActual = data.length > 0 
    ? Math.round(data.reduce((sum, d) => sum + d.actual, 0) / data.length * 10) / 10 
    : 0;
  const avgDiff = avgActual - avgTarget;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {t("sleep.weeklyComparison")}
        </h3>
        
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-slate-600 text-sm">{t("sleep.target")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600 text-sm">{t("sleep.actual")}</span>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="relative h-64 mb-6">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-slate-100 w-full" />
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-slate-400">
          <span>12h</span>
          <span>9h</span>
          <span>6h</span>
          <span>3h</span>
          <span>0h</span>
        </div>
        
        {/* Bars */}
        <div className="absolute left-10 right-0 bottom-8 top-0 flex items-end justify-around gap-2">
          {data.map((day, index) => (
            <div key={index} className="flex-1 flex items-end justify-center gap-1 h-full pt-4">
              {/* Target bar */}
              <div 
                className="w-4 rounded-t-lg bg-emerald-400 transition-all duration-500"
                style={{ height: `${(day.target / maxValue) * 100}%` }}
                title={`${t("sleep.target")}: ${day.target}h`}
              />
              {/* Actual bar */}
              <div 
                className={`w-4 rounded-t-lg transition-all duration-500 ${
                  day.actual >= day.target ? "bg-blue-500" : "bg-orange-400"
                }`}
                style={{ height: `${(day.actual / maxValue) * 100}%` }}
                title={`${t("sleep.actual")}: ${day.actual}h`}
              />
            </div>
          ))}
        </div>
        
        {/* X-axis labels */}
        <div className="absolute left-10 right-0 bottom-0 flex justify-around">
          {data.map((day, index) => (
            <div key={index} className="text-xs text-slate-500">
              {day.date}
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-1">{t("sleep.avgTarget")}</p>
          <p className="text-xl font-bold text-emerald-600">{avgTarget}h</p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-1">{t("sleep.avgActual")}</p>
          <p className={`text-xl font-bold ${avgActual >= avgTarget ? "text-blue-600" : "text-orange-500"}`}>
            {avgActual}h
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-1">{t("sleep.difference")}</p>
          <p className={`text-xl font-bold ${avgDiff >= 0 ? "text-green-500" : "text-red-500"}`}>
            {avgDiff >= 0 ? "+" : ""}{avgDiff}h
          </p>
        </div>
      </div>
    </div>
  );
}
