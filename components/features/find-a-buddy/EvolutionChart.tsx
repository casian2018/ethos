/**
 * EvolutionChart - Stats card with mini chart
 */

"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface EvolutionChartProps {
  title: string;
  value: string;
  change: string;
  data: number[];
  color?: "emerald" | "blue" | "amber" | "purple";
}

export function EvolutionChart({
  title,
  value,
  change,
  data,
  color = "emerald",
}: EvolutionChartProps) {
  const { language } = useLanguage();
  
  const isPositive = change.startsWith("+");
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  // Color mapping
  const colors = {
    emerald: {
      bg: "bg-emerald-500",
      light: "bg-emerald-100",
      text: "text-emerald-600",
      gradient: "from-emerald-500 to-emerald-600",
    },
    blue: {
      bg: "bg-blue-500",
      light: "bg-blue-100",
      text: "text-blue-600",
      gradient: "from-blue-500 to-blue-600",
    },
    amber: {
      bg: "bg-amber-500",
      light: "bg-amber-100",
      text: "text-amber-600",
      gradient: "from-amber-500 to-amber-600",
    },
    purple: {
      bg: "bg-purple-500",
      light: "bg-purple-100",
      text: "text-purple-600",
      gradient: "from-purple-500 to-purple-600",
    },
  };

  const colorScheme = colors[color];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${colorScheme.light} ${colorScheme.text} text-sm font-medium`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{change}</span>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="h-16 flex items-end gap-1">
        {data.map((value, index) => {
          const height = ((value - minValue) / range) * 100;
          const isLast = index === data.length - 1;
          
          return (
            <div
              key={index}
              className={`flex-1 rounded-t-sm transition-all ${
                isLast 
                  ? `bg-gradient-to-t ${colorScheme.gradient}` 
                  : "bg-slate-100"
              }`}
              style={{ 
                height: `${Math.max(height, 8)}%`,
                opacity: isLast ? 1 : 0.4
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
        <span>{language === "ro" ? "7 zile" : "7 days"}</span>
        <span>{language === "ro" ? "Această săptămână" : "This week"}</span>
      </div>
    </div>
  );
}
