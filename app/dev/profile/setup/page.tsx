"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ProfileDetailsWizard from "@/components/features/profile/ProfileDetailsWizard";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import {
  buildProfileDocument,
  profileNeedsOnboarding,
  type DetailedUserProfile,
  type ProfileFormState,
} from "@/lib/profile";

const auth = firebaseAuth!;
const db = firebaseDb!;

export default function ProfileSetupPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [initialData, setInitialData] = useState<Partial<DetailedUserProfile> | null>(null);
  const [shouldReturnToProfile, setShouldReturnToProfile] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }

      setUserId(user.uid);
      setUserEmail(user.email || "");

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<DetailedUserProfile>;
          setInitialData(data);
          setShouldReturnToProfile(!profileNeedsOnboarding(data));
        }
      } catch (err) {
        console.error("Error loading detailed profile:", err);
        setError(language === "ro" ? "Nu am putut încărca profilul existent." : "Failed to load existing profile.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [language, router]);

  const handleSubmit = async (formState: ProfileFormState) => {
    if (!userId) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const profileDocument = buildProfileDocument(
        {
          ...formState,
          email: userEmail,
        },
        {
          email: userEmail,
          createdAt: initialData?.createdAt,
        }
      );

      await setDoc(doc(db, "users", userId), profileDocument, { merge: true });
      router.push(shouldReturnToProfile ? "/dev/profile" : "/dev/main");
    } catch (err) {
      console.error("Error saving detailed profile:", err);
      setError(language === "ro" ? "Nu am putut salva profilul." : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <ProfileDetailsWizard
          key={`${userEmail}-${String(initialData?.updatedAt || initialData?.createdAt || "new")}`}
          mode="setup"
          language={language}
          email={userEmail}
          initialData={initialData}
          saving={saving}
          submitLabel={language === "ro" ? "Salvează profilul detaliat" : "Save detailed profile"}
          onExit={() => router.push(shouldReturnToProfile ? "/dev/profile" : "/dev/main")}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
