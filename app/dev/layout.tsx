"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { LanguageProvider } from "@/components/LanguageContext";

const auth = firebaseAuth!;

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
        <main className="pt-16 pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}
