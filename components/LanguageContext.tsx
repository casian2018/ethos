"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ro";
type Theme = "light" | "dark";

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
    "nav.forum": "Forum",
    "nav.findBuddy": "Find Buddy",
    "nav.workout": "Workout",
    "nav.howTo": "How To",
    "nav.profile": "Profile",
    "nav.signOut": "Sign Out",
    "nav.signIn": "Sign In",
    
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
    "nav.forum": "Forum",
    "nav.findBuddy": "Găsește Partener",
    "nav.workout": "Antrenament",
    "nav.howTo": "Cum Se Folosește",
    "nav.profile": "Profil",
    "nav.signOut": "Deconectare",
    "nav.signIn": "Autentificare",
    
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
  const [language, setLanguageState] = useState<Language>("en");
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved preferences
    const savedLang = localStorage.getItem("ethos-language") as Language;
    const savedTheme = localStorage.getItem("ethos-theme") as Theme;
    
    if (savedLang) setLanguageState(savedLang);
    if (savedTheme) setThemeState(savedTheme);
    else {
      // Check system preference for theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeState(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("ethos-language", language);
  }, [language, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("ethos-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === "light" ? "dark" : "light");
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
