"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sparkles } from "lucide-react";
import { auth as firebaseAuth } from "@/lib/firebase";
import Sidebar from "@/components/shared/Sidebar";
import { MobileHeader } from "@/components/ui/MobileHeader";

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
      <div className="ethos-shell-bg flex min-h-screen items-center justify-center px-4">
        <div className="ethos-panel flex w-full max-w-md flex-col items-center rounded-[32px] px-8 py-12 text-center">
          <div className="animate-ethos-float flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-emerald-500 text-white shadow-[0_18px_45px_rgba(94,186,145,0.22)]">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Ethos
          </p>
          <h1 className="ethos-display mt-3 text-4xl font-semibold text-slate-900">
            Loading your training space
          </h1>
          <div className="mt-7 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-2 w-1/2 animate-pulse rounded-full bg-gradient-to-r from-emerald-500 to-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render content if not logged in (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="ethos-shell-bg min-h-screen">
      <Sidebar />

      <div className="relative z-10 lg:pl-[22rem]">
        <MobileHeader />

        <main className="relative px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--foreground)/0.18)] to-transparent" />
          <div className="mx-auto max-w-[1480px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
