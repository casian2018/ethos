"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import Sidebar from "@/components/shared/Sidebar";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";

const auth = firebaseAuth!;

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Redirect to auth if not logged in
      if (!currentUser) {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--background))' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Don't render content if not logged in (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--background))' }}>
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main content area with sidebar offset */}
        <div className="lg:pl-64">
          {/* Mobile Header */}
          <MobileHeader />
          
          <main className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
}
