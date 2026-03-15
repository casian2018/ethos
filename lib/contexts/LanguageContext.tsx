"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  THEME_STORAGE_KEY,
  applyThemeToTarget,
  getNextTheme,
  resolveInitialTheme,
  type Theme,
} from "@/lib/theme";

type Language = "en" | "ro";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    "nav.dashboard": "Dashboard",
    "nav.train": "Train",
    "nav.community": "Community",
    "nav.progress": "Progress",
    "nav.forum": "Forum",
    "nav.findBuddy": "Find Buddy",
    "nav.workout": "Workout",
    "nav.howTo": "How To",
    "nav.profile": "Profile",
    "nav.signOut": "Sign Out",
    "nav.signIn": "Sign In",
    
    // General Navigation
    "community": "Community",
    "progress": "Progress",
    "settings": "Settings",
    "darkMode": "Dark Mode",
    "lightMode": "Light Mode",
    
    // Sleep Biohacking Hub
    "sleep.title": "Sleep Biohacking",
    "sleep.subtitle": "Optimize your sleep for peak performance",
    "sleep.import": "Import Sleep Data",
    "sleep.upload": "Upload Sleep Data",
    "sleep.dragDrop": "Drag & drop your screenshot",
    "sleep.orClick": "or click to browse",
    "sleep.supportedFormats": "PNG, JPG up to 10MB",
    "sleep.processing": "Processing...",
    "sleep.analyzing": "AI is analyzing your sleep data",
    "sleep.progress": "Analyzing: ",
    "sleep.weeklyComparison": "Weekly Sleep Comparison",
    "sleep.target": "Target",
    "sleep.actual": "Actual",
    "sleep.avgTarget": "Avg Target",
    "sleep.avgActual": "Avg Actual",
    "sleep.difference": "Difference",
    "sleep.timeline": "Sleep Timeline",
    "sleep.chronotype": "Your Sleep Animal",
    "sleep.tips": "Personalized Tips",
    "sleep.noData": "No sleep data yet",
    "sleep.importFirst": "Import a screenshot to get started",
    // Sleep terms
    "sleep.rem": "REM Sleep",
    "sleep.deepSleep": "Deep Sleep",
    "sleep.lightSleep": "Light Sleep",
    "sleep.sleepLatency": "Sleep Latency",
    "sleep.efficiency": "Efficiency",
    "sleep.bedtime": "Bedtime",
    "sleep.wakeTime": "Wake Time",
    "sleep.totalSleep": "Total Sleep",
    "sleep.recovery": "Recovery Score",

    // Stats
    "stats.title": "Evolution",
    "stats.subtitle": "Track how your activity changes over time",
    "stats.steps": "Steps",
    "stats.calories": "Calories",
    "stats.active": "Active",
    "stats.streak": "Streak",
    "stats.daysInRow": "days in a row",
    "stats.target": "Target",
    "stats.weeklyActivity": "7-Day Evolution",
    "stats.weeklySteps": "steps / 7 days",
    "stats.weeklyCalories": "calories / 7 days",
    "stats.weeklyActiveMin": "active min / 7 days",
    "stats.achievements": "Achievements",
    "stats.adaptiveTarget": "Adaptive targets for your medical conditions. Daily steps:",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Track your fitness journey",
    "dashboard.welcome": "Welcome back",
    "dashboard.noWorkout": "No workout yet",
    "dashboard.generateWorkout": "Generate Workout",
    "dashboard.noNutrition": "No nutrition plan",
    "dashboard.noPosts": "No posts yet",
    "dashboard.startDiscussion": "Start a Discussion",
    "dashboard.noBuddies": "No potential buddies found",
    "dashboard.findMore": "Find more",
    "dashboard.yourGoals": "Your Goals",
    "dashboard.exercises": "exercises",
    "dashboard.calories": "kcal/day",
    
    // Auth
    "auth.title": "Ethos",
    "auth.subtitle": "Your fitness journey starts here",
    "auth.google": "Continue with Google",
    "auth.or": "or continue with email",
    "auth.signIn": "Sign In",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.terms": "By continuing, you agree to our Terms of Service",
    
    // Forum
    "forum.title": "Community Forum",
    "forum.subtitle": "Discuss fitness, share tips, and connect",
    "forum.createPost": "Create Post",
    "forum.newPost": "Create a New Post",
    "forum.postTitle": "Post title",
    "forum.whatsOnMind": "What's on your mind?",
    "forum.cancel": "Cancel",
    "forum.post": "Post",
    "forum.posting": "Posting...",
    "forum.noPosts": "No posts yet. Be the first to start a discussion!",
    "forum.viewAll": "View all",
    "forum.comment": "Comment",
    "forum.comments": "comments",
    "forum.comment.single": "comment",
    "forum.recent": "Recent",
    "forum.popular": "Popular",
    "forum.backToForum": "Back to Forum",
    "forum.addReply": "Add a reply",
    "forum.replyTo": "Reply to comment",
    "forum.writeReply": "Write your reply...",
    "forum.postReply": "Post Reply",
    "forum.noReplies": "No replies yet. Be the first to reply!",
    "forum.replies": "Replies",
    "forum.reply": "Reply",
    
    // Find Buddy
    "buddy.title": "Find a Gym Buddy",
    "buddy.subtitle": "Connect with fitness enthusiasts in your area",
    "buddy.sendRequest": "Send Buddy Request",
    "buddy.requestSent": "Request Sent",
    "buddy.sending": "Sending...",
    "buddy.noBuddies": "No buddies found",
    "buddy.checkBack": "Check back later for new fitness enthusiasts in your area!",
    "buddy.goals": "Goals",
    "buddy.hobbies": "Hobbies",
    
    // Find a Buddy 2.0 - Availability Slots
    "buddy.availability": "Availability",
    "buddy.addAvailability": "Add Availability",
    "buddy.editAvailability": "Edit Availability",
    "buddy.selectSport": "Select Sport",
    "buddy.selectCity": "Select City",
    "buddy.selectTime": "Select Time",
    "buddy.selectLocation": "Select Location",
    "buddy.free": "Free",
    "buddy.paid": "Paid",
    "buddy.preferredGender": "Preferred Gender",
    "buddy.anyone": "Anyone",
    "buddy.male": "Male",
    "buddy.female": "Female",
    "buddy.mySlots": "My Availability Slots",
    "buddy.availableSlots": "Available Slots",
    "buddy.join": "Join",
    "buddy.joined": "Joined",
    "buddy.confirmed": "Confirmed",
    "buddy.noSlots": "No availability slots",
    "buddy.createSlot": "Create a slot to let others know when you're available",
    "buddy.slotCreated": "Availability slot created successfully!",
    "buddy.slotDeleted": "Slot deleted",
    "buddy.filterByCity": "Filter by city",
    "buddy.filterBySport": "Filter by sport",
    "buddy.allCities": "All Cities",
    "buddy.allSports": "All Sports",
    
    // Workout
    "workout.title": "Workout Generator",
    "workout.subtitle": "AI-powered personalized workout plans",
    "workout.generate": "Generate New Workout",
    "workout.generating": "Generating...",
    "workout.yourPlan": "Your Weekly Workout Plan",
    "workout.save": "Save Workout",
    "workout.saved": "Saved Workouts",
    "workout.noSaved": "No saved workouts yet",
    "workout.completeProfile": "Please complete your profile first to generate workouts.",
    "workout.restDay": "Rest day",
    
    // Profile
    "profile.title": "Profile",
    "profile.subtitle": "View and edit your information",
    "profile.edit": "Edit Profile",
    "profile.basicInfo": "Basic Information",
    "profile.fitnessDetails": "Fitness Details",
    "profile.buddy": "Workout Buddy",
    "profile.age": "Age",
    "profile.city": "City",
    "profile.education": "Education",
    "profile.occupation": "Occupation",
    "profile.height": "Height (cm)",
    "profile.weight": "Weight (kg)",
    "profile.fitnessLevel": "Fitness Level",
    "profile.goals": "Goals",
    "profile.hobbies": "Hobbies",
    "profile.lookingBuddy": "Looking for a workout buddy",
    "profile.lookingBuddyDesc": "Get matched with people in your area",
    "profile.save": "Save Changes",
    "profile.saving": "Saving...",
    "profile.cancel": "Cancel",
    "profile.notSet": "Not set",
    "profile.addHobby": "Add a hobby...",
    "profile.add": "Add",
    
    // Profile Setup
    "setup.title": "Setup Your Profile",
    "setup.subtitle": "Let's get to know you better",
    "setup.basicInfo": "Basic Information",
    "setup.fitnessDetails": "Fitness Details",
    "setup.findBuddy": "Find a Workout Buddy",
    "setup.complete": "Complete Setup",
    "setup.saving": "Saving...",
    "setup.next": "Continue",
    "setup.back": "Back",
    "setup.whatsNext": "What happens next?",
    "setup.step1": "Your profile will be created",
    "setup.step2": "You'll be redirected to your dashboard",
    "setup.step3": "You can find gym buddies in your area",
    "setup.age": "Age",
    "setup.agePlaceholder": "25",
    "setup.city": "City",
    "setup.cityPlaceholder": "New York",
    "setup.education": "Education",
    "setup.educationPlaceholder": "University",
    "setup.occupation": "Occupation",
    "setup.occupationPlaceholder": "Software Engineer",
    "setup.fitnessLevel": "Fitness Level",
    "setup.height": "Height (cm)",
    "setup.heightPlaceholder": "175",
    "setup.weight": "Weight (kg)",
    "setup.weightPlaceholder": "70",
    "setup.fitnessGoals": "Fitness Goals",
    "setup.addHobby": "Add a hobby...",
    "setup.add": "Add",
    "setup.lookingForBuddy": "I'm looking for a workout buddy",
    "setup.getMatched": "Get matched with people in your area",
    "setup.required": "Required",
    
    // Health & Medical
    "health.birthDate": "Date of Birth",
    "health.age": "Age",
    "health.medicalConditions": "Medical Conditions",
    "health.noMedicalConditions": "No medical conditions",
    "health.selectConditions": "Select any conditions that apply to you",
    "health.obesity": "Obesity",
    "health.anorexia": "Anorexia",
    "health.anemia": "Anemia",
    "health.none": "None",
    "health.disclaimer": "This information is used to personalize your workouts safely",
    
    // How To
    "howto.title": "Gym Equipment Guide",
    "howto.subtitle": "Learn how to use common gym machines properly",
    "howto.howToUse": "How to Use",
    "howto.proTips": "Pro Tips",
    "howto.remember": "Remember",
    "howto.rememberText": "Always start with light weight to perfect your form before increasing the load. If you're unsure about any machine, ask a gym staff member for guidance.",
    
    // General
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
  },
  ro: {
    // Navbar
    "nav.dashboard": "Panou",
    "nav.train": "Antrenament",
    "nav.community": "Comunitate",
    "nav.progress": "Progres",
    "nav.forum": "Forum",
    "nav.findBuddy": "Găsește Partener",
    "nav.workout": "Antrenament",
    "nav.howTo": "Cum Se Folosește",
    "nav.profile": "Profil",
    "nav.signOut": "Deconectare",
    "nav.signIn": "Autentificare",
    
    // General Navigation
    "community": "Comunitate",
    "progress": "Progres",
    "settings": "Setări",
    "darkMode": "Mod Întunecat",
    "lightMode": "Mod Luminos",
    
    // Sleep Biohacking Hub
    "sleep.title": "Biohacking Somn",
    "sleep.subtitle": "Optimizează-ți somnul pentru performanță maximă",
    "sleep.import": "Importă Date Somn",
    "sleep.upload": "Încarcă Date Somn",
    "sleep.dragDrop": "Trage și plasează screenshot-ul",
    "sleep.orClick": "sau click pentru a răsfoi",
    "sleep.supportedFormats": "PNG, JPG până la 10MB",
    "sleep.processing": "Se procesează...",
    "sleep.analyzing": "AI analizează datele tale de somn",
    "sleep.progress": "Se analizează: ",
    "sleep.weeklyComparison": "Comparație Săptămânală Somn",
    "sleep.target": "Țintă",
    "sleep.actual": "Real",
    "sleep.avgTarget": "Medie Țintă",
    "sleep.avgActual": "Medie Reală",
    "sleep.difference": "Diferență",
    "sleep.timeline": "Timeline Somn",
    "sleep.chronotype": "Animalul Tău de Somn",
    "sleep.tips": "Sfaturi Personalizate",
    "sleep.noData": "Încă nu ai date de somn",
    "sleep.importFirst": "Importă un screenshot pentru a începe",
    // Sleep terms
    "sleep.rem": "Somn REM",
    "sleep.deepSleep": "Somn Profund",
    "sleep.lightSleep": "Somn Ușor",
    "sleep.sleepLatency": "Latența Somnului",
    "sleep.efficiency": "Eficiență",
    "sleep.bedtime": "Ora de Culcare",
    "sleep.wakeTime": "Ora de Trezire",
    "sleep.totalSleep": "Somn Total",
    "sleep.recovery": "Scor Recuperare",

    // Stats (Romanian)
    "stats.title": "Evoluție",
    "stats.subtitle": "Vezi cum îți evoluează activitatea în timp",
    "stats.steps": "Pași",
    "stats.calories": "Calorii",
    "stats.active": "Activ",
    "stats.streak": "Streak",
    "stats.daysInRow": "zile consecutive",
    "stats.target": "Target",
    "stats.weeklyActivity": "Evoluție 7 zile",
    "stats.weeklySteps": "pași / 7 zile",
    "stats.weeklyCalories": "calorii / 7 zile",
    "stats.weeklyActiveMin": "minute active / 7 zile",
    "stats.achievements": "Realizări",
    "stats.adaptiveTarget": "Target-uri adaptate pentru condițiile tale medicale. Pași zilnici:",
    
    // Dashboard
    "dashboard.title": "Panou",
    "dashboard.subtitle": "Urmărește-ți călătoria fitness",
    "dashboard.welcome": "Bine ai revenit",
    "dashboard.noWorkout": "Niciun antrenament",
    "dashboard.generateWorkout": "Generează Antrenament",
    "dashboard.noNutrition": "Nu ai plan de nutriție",
    "dashboard.noPosts": "Nu sunt postări",
    "dashboard.startDiscussion": "Începe o Discuție",
    "dashboard.noBuddies": "Nu am găsit potențiali parteneri",
    "dashboard.findMore": "Găsește mai mulți",
    "dashboard.yourGoals": "Obiectivele Tale",
    "dashboard.exercises": "exerciții",
    "dashboard.calories": "kcal/zi",
    
    // Auth
    "auth.title": "Ethos",
    "auth.subtitle": "Călătoria ta fitness începe aici",
    "auth.google": "Continuă cu Google",
    "auth.or": "sau continuă cu email",
    "auth.signIn": "Autentificare",
    "auth.register": "Înregistrare",
    "auth.email": "Email",
    "auth.password": "Parolă",
    "auth.terms": "Continuând, ești de acord cu Termenii și Condițiile",
    
    // Forum
    "forum.title": "Forum Community",
    "forum.subtitle": "Discută despre fitness, sfaturi și conectează-te",
    "forum.createPost": "Creează Postare",
    "forum.newPost": "Creează o Postare Nouă",
    "forum.postTitle": "Titlul postării",
    "forum.whatsOnMind": "Ce ai pe suflet?",
    "forum.cancel": "Anulează",
    "forum.post": "Postează",
    "forum.posting": "Se postează...",
    "forum.noPosts": "Nu sunt postări. Fii primul care începe o discuție!",
    "forum.viewAll": "Vezi toate",
    "forum.comment": "Comentează",
    "forum.comments": "comentarii",
    "forum.comment.single": "comentariu",
    "forum.recent": "Recente",
    "forum.popular": "Populare",
    "forum.backToForum": "Înapoi la Forum",
    "forum.addReply": "Adaugă un răspuns",
    "forum.replyTo": "Răspunde la comentariu",
    "forum.writeReply": "Scrie răspunsul tău...",
    "forum.postReply": "Publică răspuns",
    "forum.noReplies": "Încă nu există comentarii. Fii primul care răspunde!",
    "forum.replies": "Răspunsuri",
    "forum.reply": "Răspunde",
    
    // Find Buddy
    "buddy.title": "Găsește un Partener de Sală",
    "buddy.subtitle": "Conectează-te cu entuziaști fitness din zona ta",
    "buddy.sendRequest": "Trimite Cerere",
    "buddy.requestSent": "Cerere Trimisă",
    "buddy.sending": "Se trimite...",
    "buddy.noBuddies": "Nu am găsit parteneri",
    "buddy.checkBack": "Revino mai târziu pentru entuziaști fitness noi!",
    "buddy.goals": "Obiective",
    "buddy.hobbies": "Hobby-uri",
    
    // Find a Buddy 2.0 - Availability Slots
    "buddy.availability": "Disponibilitate",
    "buddy.addAvailability": "Adaugă Disponibilitate",
    "buddy.editAvailability": "Editează Disponibilitate",
    "buddy.selectSport": "Selectează Sportul",
    "buddy.selectCity": "Selectează Orașul",
    "buddy.selectTime": "Selectează Ora",
    "buddy.selectLocation": "Selectează Locația",
    "buddy.free": "Gratis",
    "buddy.paid": "Plătit",
    "buddy.preferredGender": "Gen Preferat",
    "buddy.anyone": "Oricine",
    "buddy.male": "Bărbat",
    "buddy.female": "Femeie",
    "buddy.mySlots": "Sloturile Mele de Disponibilitate",
    "buddy.availableSlots": "Sloturi Disponibile",
    "buddy.join": "Alătură-te",
    "buddy.joined": "Alăturat",
    "buddy.confirmed": "Confirmat",
    "buddy.noSlots": "Nu ai sloturi de disponibilitate",
    "buddy.createSlot": "Creează un slot pentru a anunța când ești disponibil",
    "buddy.slotCreated": "Slot de disponibilitate creat cu succes!",
    "buddy.slotDeleted": "Slot șters",
    "buddy.filterByCity": "Filtrează după oraș",
    "buddy.filterBySport": "Filtrează după sport",
    "buddy.allCities": "Toate Orașele",
    "buddy.allSports": "Toate Sporturile",
    
    // Workout
    "workout.title": "Generator de Antrenamente",
    "workout.subtitle": "Planuri de antrenament personalizate cu AI",
    "workout.generate": "Generează Antrenament Nou",
    "workout.generating": "Se generează...",
    "workout.yourPlan": "Planul Tău Săptămânal",
    "workout.save": "Salvează Antrenament",
    "workout.saved": "Antrenamente Salvate",
    "workout.noSaved": "Nu ai antrenamente salvate",
    "workout.completeProfile": "Completează-ți profilul pentru a genera antrenamente.",
    "workout.restDay": "Zi de odihnă",
    
    // Profile
    "profile.title": "Profil",
    "profile.subtitle": "Vizualizează și editează informațiile",
    "profile.edit": "Editează Profil",
    "profile.basicInfo": "Informații de Bază",
    "profile.fitnessDetails": "Detalii Fitness",
    "profile.buddy": "Partener de Antrenament",
    "profile.age": "Vârstă",
    "profile.city": "Oraș",
    "profile.education": "Educație",
    "profile.occupation": "Ocupație",
    "profile.height": "Înălțime (cm)",
    "profile.weight": "Greutate (kg)",
    "profile.fitnessLevel": "Nivel Fitness",
    "profile.goals": "Obiective",
    "profile.hobbies": "Hobby-uri",
    "profile.lookingBuddy": "Căutare partener de antrenament",
    "profile.lookingBuddyDesc": "Fii potrivit cu persoane din zona ta",
    "profile.save": "Salvează Modificări",
    "profile.saving": "Se salvează...",
    "profile.cancel": "Anulează",
    "profile.notSet": "Neconfigurat",
    "profile.addHobby": "Adaugă un hobby...",
    "profile.add": "Adaugă",
    
    // Profile Setup
    "setup.title": "Configurare Profil",
    "setup.subtitle": "Să te cunoaștem mai bine",
    "setup.basicInfo": "Informații de Bază",
    "setup.fitnessDetails": "Detalii Fitness",
    "setup.findBuddy": "Găsește Partener",
    "setup.complete": "Completează Configurarea",
    "setup.saving": "Se salvează...",
    "setup.next": "Continuă",
    "setup.back": "Înapoi",
    "setup.whatsNext": "Ce urmează?",
    "setup.step1": "Profilul tău va fi creat",
    "setup.step2": "Vei fi redirecționat la panoul tău",
    "setup.step3": "Poți găsi parteneri de sală în zona ta",
    "setup.age": "Vârstă",
    "setup.agePlaceholder": "25",
    "setup.city": "Oraș",
    "setup.cityPlaceholder": "București",
    "setup.education": "Educație",
    "setup.educationPlaceholder": "Universitate",
    "setup.occupation": "Ocupație",
    "setup.occupationPlaceholder": "Inginer Software",
    "setup.fitnessLevel": "Nivel Fitness",
    "setup.height": "Înălțime (cm)",
    "setup.heightPlaceholder": "175",
    "setup.weight": "Greutate (kg)",
    "setup.weightPlaceholder": "70",
    "setup.fitnessGoals": "Obiective Fitness",
    "setup.addHobby": "Adaugă un hobby...",
    "setup.add": "Adaugă",
    "setup.lookingForBuddy": "Caut partener de antrenament",
    "setup.getMatched": "Fii potrivit cu persoane din zona ta",
    "setup.required": "Obligatoriu",
    
    // Health & Medical
    "health.birthDate": "Data Nașterii",
    "health.age": "Vârstă",
    "health.medicalConditions": "Condiții Medicale",
    "health.noMedicalConditions": "Fără condiții medicale",
    "health.selectConditions": "Selectează condițiile care se aplică",
    "health.obesity": "Obezitate",
    "health.anorexia": "Anorexie",
    "health.anemia": "Anemie",
    "health.none": "Niciuna",
    "health.disclaimer": "Aceste informații sunt folosite pentru a-ți personaliza antrenamentele în siguranță",
    
    // How To
    "howto.title": "Ghid Echipamente Sală",
    "howto.subtitle": "Învață cum să folosești corect echipamentele",
    "howto.howToUse": "Cum se Folosește",
    "howto.proTips": "Sfaturi Profesionale",
    "howto.remember": "Nu Uita",
    "howto.rememberText": "Întotdeauna începe cu o greutate mică pentru a perfecționa forma înainte de a crește sarcina. Dacă nu ești sigur de cum funcționează o mașină, întreabă un membru al staff-ului.",
    
    // General
    "loading": "Se încarcă...",
    "error": "Eroare",
    "success": "Succes",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("ethos-language") as Language;
      return savedLang || "en";
    }
    return "en";
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return resolveInitialTheme(
        localStorage.getItem(THEME_STORAGE_KEY),
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    }

    return "light";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ethos-language", language);
    }
  }, [language]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      applyThemeToTarget(theme, document.documentElement);
    }
  }, [theme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((currentTheme) => getNextTheme(currentTheme));
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, theme, setTheme, toggleTheme, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
