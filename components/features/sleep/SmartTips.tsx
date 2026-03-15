"use client";

import { useLanguage } from "@/components/LanguageContext";

interface SmartTipsProps {
  medicalConditions: string[];
  sleepData?: {
    avgSleepHours: number;
    avgQuality: number;
  };
}

// Tips based on medical conditions
const conditionTips: Record<string, { en: string[]; ro: string[] }> = {
  obesity: {
    en: [
      "Avoid heavy meals 3 hours before bedtime",
      "Consider a 20-minute walk after dinner",
      "Keep your bedroom cool (18-20°C)",
      "Limit screen time 1 hour before sleep"
    ],
    ro: [
      "Evită mesele copioase cu 3 ore înainte de culcare",
      "Consideră o plimbare de 20 de minute după cină",
      "Păstrează camera rece (18-20°C)",
      "Limitează timpul pe ecran cu 1 oră înainte de somn"
    ]
  },
  anemia: {
    en: [
      "Iron-rich foods can improve sleep quality",
      "Avoid caffeine after 2 PM",
      "Consider taking iron supplements in the morning",
      "Leafy greens can help with sleep regulation"
    ],
    ro: [
      "Alimentele bogate în fier pot îmbunătăți calitatea somnului",
      "Evită cofeina după ora 14:00",
      "Consideră să iei suplimente de fier dimineața",
      "Legumele verzi pot ajuta la reglarea somnului"
    ]
  },
  none: {
    en: [
      "Maintain a consistent sleep schedule",
      "Create a relaxing bedtime routine",
      "Keep your bedroom dark and quiet",
      "Exercise regularly, but not too close to bedtime"
    ],
    ro: [
      "Menține un program de somn consistent",
      "Creează o rutină relaxantă de culcare",
      "Păstrează camera întunecată și liniștită",
      "Fă sport regulat, dar nu foarte aproape de culcare"
    ]
  }
};

// General sleep optimization tips
const generalTips = {
  en: [
    "Aim for 7-9 hours of sleep per night",
    "Keep your sleep environment comfortable",
    "Avoid caffeine and alcohol before bed",
    "Get natural sunlight during the day",
    "Use your bed only for sleep",
    "Try relaxation techniques like deep breathing"
  ],
  ro: [
    "Setează-ți 7-9 ore de somn pe noapte",
    "Păstrează mediul de somn confortabil",
    "Evită cofeina și alcoolul înainte de culcare",
    "Expune-te la lumină naturală în timpul zilei",
    "Folosește patul doar pentru somn",
    "Încearcă tehnici de relaxare precum respirația profundă"
  ]
};

export default function SmartTips({ medicalConditions, sleepData }: SmartTipsProps) {
  const { language, t } = useLanguage();
  
  // Get tips based on medical conditions
  const getTips = (): string[] => {
    const tips: string[] = [];
    
    // Add condition-specific tips
    medicalConditions.forEach(condition => {
      if (conditionTips[condition]) {
        tips.push(...(conditionTips[condition][language] || conditionTips[condition].en));
      }
    });
    
    // If no specific conditions, add general tips
    if (tips.length === 0) {
      tips.push(...(conditionTips.none[language] || conditionTips.none.en));
    }
    
    // Add general optimization tips (up to 4 total)
    const remainingSlots = 4 - tips.length;
    if (remainingSlots > 0) {
      tips.push(...generalTips[language].slice(0, remainingSlots));
    }
    
    return tips.slice(0, 4);
  };
  
  const tips = getTips();
  
  // Get sleep quality feedback
  const getSleepFeedback = () => {
    if (!sleepData) return null;
    
    if (sleepData.avgSleepHours < 6) {
      return {
        status: "warning",
        message: language === "ro" 
          ? "Somn insuficient - Încearcă să dormi mai mult" 
          : "Insufficient sleep - Try to sleep more",
        color: "orange"
      };
    } else if (sleepData.avgSleepHours >= 7 && sleepData.avgSleepHours <= 9) {
      return {
        status: "good",
        message: language === "ro" 
          ? "Somn optim - Continui să dormi bine!" 
          : "Optimal sleep - You're sleeping well!",
        color: "green"
      };
    } else {
      return {
        status: "info",
        message: language === "ro" 
          ? "Prea mult somn poate afecta energia" 
          : "Too much sleep may affect energy levels",
        color: "blue"
      };
    }
  };
  
  const feedback = getSleepFeedback();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
          <span className="text-2xl">💡</span>
          {language === "ro" ? "Sfaturi Personalizate" : "Personalized Tips"}
        </h3>
        
        {/* Medical condition badge */}
        {medicalConditions.length > 0 && medicalConditions[0] !== "none" && (
          <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
            {language === "ro" ? "⚕️ Bazat pe condiții medicale" : "⚕️ Based on medical conditions"}
          </span>
        )}
      </div>
      
      {/* Sleep feedback */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-2xl ${
          feedback.color === "green" ? "bg-emerald-50 border border-emerald-200" :
          feedback.color === "orange" ? "bg-orange-50 border border-orange-200" :
          "bg-blue-50 border border-blue-200"
        }`}>
          <p className={
            feedback.color === "green" ? "text-emerald-700" :
            feedback.color === "orange" ? "text-orange-700" :
            "text-blue-700"
          }>
            {feedback.message}
          </p>
        </div>
      )}
      
      {/* Tips list */}
      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-600 text-sm font-bold">{index + 1}</span>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>
      
      {/* Data source info */}
      {medicalConditions.length > 0 && medicalConditions[0] !== "none" && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-slate-500 text-xs">
            {language === "ro"
              ? "💡 Aceste sfaturi sunt personalizate pe baza condițiilor tale medicale din profil."
              : "💡 These tips are personalized based on your medical conditions from your profile."}
          </p>
        </div>
      )}
    </div>
  );
}
