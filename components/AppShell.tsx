/**
 * AppShell - Main application wrapper with navigation
 * 
 * Uses the existing Navbar component for navigation
 */

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import { LanguageProvider } from "./LanguageContext";
import Navbar from "./Navbar";

const auth = firebaseAuth!;

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
        <Navbar user={user} />
        <main className="pt-20 md:pt-16 pb-24 md:pb-4">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}
