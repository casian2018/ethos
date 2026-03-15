"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;
const googleProvider = new GoogleAuthProvider();

// Helper to check if user has a profile
async function userHasProfile(userId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists();
  } catch {
    return false;
  }
}

// Determine where to redirect after auth
async function getRedirectPath(userId: string): Promise<string> {
  const hasProfile = await userHasProfile(userId);
  if (!hasProfile) {
    return "/dev/profile/setup";
  }
  return "/dev/main";
}

export default function AuthPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      
      // Check if user has profile and redirect accordingly
      const redirectPath = await getRedirectPath(userCredential.user.uid);
      router.push(redirectPath);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user has profile and redirect accordingly
      const redirectPath = await getRedirectPath(result.user.uid);
      router.push(redirectPath);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 bg-white px-4">
      <div className="max-w-md w-full bg-white bg-slate-50 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-zinc-900 text-slate-900 mb-6">
          {language === "ro" ? "Bine ai venit la ETHOS" : "Welcome to ETHOS"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 bg-red-100 text-red-600 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-1">
              {language === "ro" ? "Email" : "Email"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 border-slate-200 rounded-lg bg-white bg-slate-100 text-zinc-900 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 text-slate-600 mb-1">
              {language === "ro" ? "Parolă" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 border-slate-200 rounded-lg bg-white bg-slate-100 text-zinc-900 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading 
              ? (language === "ro" ? "Se încarcă..." : "Loading...") 
              : (isLogin 
                  ? (language === "ro" ? "Conectează-te" : "Sign In") 
                  : (language === "ro" ? "Creează cont" : "Sign Up"))
            }
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 px-4 bg-white bg-slate-100 border border-zinc-300 border-slate-200 text-zinc-700 text-slate-600 font-medium rounded-lg hover:bg-zinc-50 hover:bg-slate-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>🔵</span>
            {language === "ro" ? "Continuă cu Google" : "Continue with Google"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-600 text-slate-500">
          {isLogin 
            ? (language === "ro" ? "Nu ai cont?" : "Don't have an account?")
            : (language === "ro" ? "Ai deja cont?" : "Already have an account?")
          }
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-emerald-600 text-emerald-600 hover:underline"
          >
            {isLogin 
              ? (language === "ro" ? "Creează unul" : "Sign Up")
              : (language === "ro" ? "Conectează-te" : "Sign In")
            }
          </button>
        </p>
      </div>
    </div>
  );
}
