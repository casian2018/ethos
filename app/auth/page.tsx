"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ProfileDetailsWizard from "@/components/features/profile/ProfileDetailsWizard";
import { useLanguage } from "@/components/LanguageContext";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import {
  buildProfileDocument,
  profileNeedsOnboarding,
  type DetailedUserProfile,
  type ProfileFormState,
} from "@/lib/profile";

const auth = firebaseAuth!;
const db = firebaseDb!;
const googleProvider = new GoogleAuthProvider();

async function getRedirectPath(userId: string): Promise<string> {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) {
    return "/dev/profile/setup";
  }

  const userProfile = userDoc.data() as Partial<DetailedUserProfile>;
  return profileNeedsOnboarding(userProfile) ? "/dev/profile/setup" : "/dev/main";
}

export default function AuthPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerStage, setRegisterStage] = useState<"credentials" | "profile">("credentials");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        return;
      }

      const redirectPath = await getRedirectPath(user.uid);
      router.replace(redirectPath);
    });

    return () => unsubscribe();
  }, [router]);

  const resetRegisterFlow = () => {
    setRegisterStage("credentials");
    setRegisterEmail("");
    setRegisterPassword("");
    setConfirmPassword("");
  };

  const toggleMode = () => {
    setError("");
    setLoading(false);
    setIsLogin((current) => !current);
    resetRegisterFlow();
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const redirectPath = await getRedirectPath(userCredential.user.uid);
      router.push(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "A apărut o eroare la autentificare.");
    } finally {
      setLoading(false);
    }
  };

  const continueToProfileQuiz = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!registerEmail.trim() || !registerPassword.trim()) {
      setError(language === "ro" ? "Completează emailul și parola." : "Complete the email and password.");
      return;
    }

    if (registerPassword.length < 6) {
      setError(language === "ro" ? "Parola trebuie să aibă minim 6 caractere." : "Password must have at least 6 characters.");
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError(language === "ro" ? "Parolele nu coincid." : "Passwords do not match.");
      return;
    }

    setRegisterStage("profile");
  };

  const handleRegisterSubmit = async (formState: ProfileFormState) => {
    setError("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const profileDocument = buildProfileDocument(
        {
          ...formState,
          email: registerEmail,
        },
        { email: registerEmail }
      );

      await setDoc(doc(db, "users", userCredential.user.uid), profileDocument, { merge: true });
      router.push("/dev/main");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "A apărut o eroare la crearea contului.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const redirectPath = await getRedirectPath(result.user.uid);
      router.push(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "A apărut o eroare la autentificarea cu Google.");
    } finally {
      setLoading(false);
    }
  };

  const isRegistering = !isLogin;
  const wideLayout = isRegistering && registerStage === "profile";

  return (
    <div className="ethos-shell-bg min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className={`mx-auto ${wideLayout ? "max-w-5xl" : "max-w-md"}`}>
        <div className={`${wideLayout ? "grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]" : ""}`}>
          <aside className="ethos-panel rounded-[36px] p-8">
            <div className="ethos-kicker">{language === "ro" ? "Acces Ethos" : "Ethos Access"}</div>
            <h1 className="ethos-display mt-5 text-5xl font-semibold leading-none text-slate-900">
              {isLogin
                ? (language === "ro" ? "Intră în cont" : "Sign in")
                : (language === "ro" ? "Creează contul cu profil complet" : "Create an account with full profile")}
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              {isLogin
                ? (language === "ro"
                    ? "Login-ul verifică acum și dacă onboarding-ul este complet, nu doar dacă există documentul de user."
                    : "Login now checks whether the onboarding is complete, not just whether a user document exists.")
                : (language === "ro"
                    ? "Profilul detaliat este folosit mai departe în workout generation, nutrition și profil."
                    : "The detailed profile is later used in workout generation, nutrition, and profile screens.")}
            </p>

            <div className="mt-8 rounded-[28px] border border-slate-200/80 bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {language === "ro" ? "Ce se personalizează" : "What gets personalized"}
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Workout context: goals, injuries, equipment, sleep, stress.</li>
                <li>Nutrition context: calories, macros, diet preference, allergies, hydration.</li>
                <li>Profile context: identity, body metrics, lifestyle, motivation.</li>
              </ul>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>🔵</span>
              {language === "ro" ? "Continuă cu Google" : "Continue with Google"}
            </button>

            <p className="mt-6 text-sm text-slate-500">
              {isLogin
                ? (language === "ro" ? "Nu ai cont?" : "Don't have an account?")
                : (language === "ro" ? "Ai deja cont?" : "Already have an account?")}
              <button
                onClick={toggleMode}
                className="ml-2 font-semibold text-orange-600 hover:text-orange-700"
              >
                {isLogin
                  ? (language === "ro" ? "Treci la înregistrare" : "Go to register")
                  : (language === "ro" ? "Treci la login" : "Go to login")}
              </button>
            </p>
          </aside>

          <main className="ethos-panel rounded-[36px] p-8">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {isLogin ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {language === "ro" ? "Email" : "Email"}
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {language === "ro" ? "Parolă" : "Password"}
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-white shadow-[0_16px_36px_rgba(240,116,62,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading
                    ? (language === "ro" ? "Se autentifică..." : "Signing in...")
                    : (language === "ro" ? "Conectează-te" : "Sign in")}
                </button>
              </form>
            ) : registerStage === "credentials" ? (
              <form onSubmit={continueToProfileQuiz} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {language === "ro" ? "Email pentru cont" : "Account email"}
                  </label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {language === "ro" ? "Parolă" : "Password"}
                  </label>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    placeholder="minimum 6 caractere"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {language === "ro" ? "Confirmă parola" : "Confirm password"}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    placeholder="repetă parola"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-white shadow-[0_16px_36px_rgba(240,116,62,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  {language === "ro" ? "Continuă la quiz-ul de profil" : "Continue to profile quiz"}
                </button>
              </form>
            ) : (
              <ProfileDetailsWizard
                key={registerEmail}
                mode="register"
                language={language}
                email={registerEmail}
                saving={loading}
                submitLabel={language === "ro" ? "Creează contul complet" : "Create full account"}
                onExit={() => setRegisterStage("credentials")}
                onSubmit={handleRegisterSubmit}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
