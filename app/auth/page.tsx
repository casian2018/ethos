"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const googleProvider = new GoogleAuthProvider();

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
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/dev/main");
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
      await signInWithPopup(auth, googleProvider);
      router.push("/dev/profile");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-6">
          {language === "ro" ? "Bine ai venit la ETHOS" : "Welcome to ETHOS"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {language === "ro" ? "Email" : "Email"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {language === "ro" ? "Parolă" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
            className="w-full py-2 px-4 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>🔵</span>
            {language === "ro" ? "Continuă cu Google" : "Continue with Google"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {isLogin 
            ? (language === "ro" ? "Nu ai cont?" : "Don't have an account?")
            : (language === "ro" ? "Ai deja cont?" : "Already have an account?")
          }
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-emerald-600 dark:text-emerald-400 hover:underline"
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
