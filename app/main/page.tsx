"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  Timestamp 
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

// Types
interface UserProfile {
  id: string;
  city: string;
  fitnessLevel: string;
  goals: string[];
  lookingForBuddy?: boolean;
  displayName?: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  completed?: boolean;
}

interface Workout {
  id: string;
  userId: string;
  name: string;
  exercises: Exercise[];
  createdAt: Timestamp;
}

interface NutritionPlan {
  id: string;
  userId: string;
  calories: number;
  meals: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
  createdAt: Timestamp;
}

interface ForumPost {
  id: string;
  title: string;
  authorId: string;
  createdAt: Timestamp;
}

interface BuddyMatch {
  id: string;
  displayName: string;
  city: string;
  fitnessLevel: string;
  goals: string[];
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-10 w-48 mb-8 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="skeleton h-48 rounded-2xl" />
          </div>
          <div>
            <div className="skeleton h-48 rounded-2xl" />
          </div>
          <div className="lg:col-span-3">
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Auth check component
function AuthCheck({ children }: { children: (user: User) => React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <DashboardSkeleton />;
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome to Ethos</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Please sign in to access your dashboard</p>
          <Link href="/auth" className="btn-primary inline-block mt-4">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}

// Welcome Section
function WelcomeSection({ profile }: { profile: UserProfile | null }) {
  const { t, language } = useLanguage();
  
  const getFitnessBadge = (level: string) => {
    switch (level) {
      case "beginner": return "badge-beginner";
      case "intermediate": return "badge-intermediate";
      case "advanced": return "badge-advanced";
      default: return "badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";
    }
  };

  if (!profile) {
    return (
      <div className="card p-6 dark:bg-zinc-900">
        <div className="skeleton h-6 w-32 rounded" />
        <div className="skeleton h-4 w-48 mt-4 rounded" />
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8 relative overflow-hidden dark:bg-zinc-900">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {t("dashboard.welcome")}{profile.displayName ? `, ${profile.displayName}` : ''}! 👋
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {profile.city && (
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.city}
                </span>
              )}
              {profile.fitnessLevel && (
                <span className={getFitnessBadge(profile.fitnessLevel)}>
                  {profile.fitnessLevel}
                </span>
              )}
            </div>
          </div>
          
          <Link href="/profile" className="btn-secondary flex items-center gap-2 self-start dark:bg-zinc-800 dark:text-zinc-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t("profile.edit")}
          </Link>
        </div>
        
        {profile.goals && profile.goals.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t("dashboard.yourGoals")}</p>
            <div className="flex flex-wrap gap-2">
              {profile.goals.map((goal, index) => (
                <span 
                  key={index}
                  className="badge-primary"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Today's Workout Section
function TodaysWorkoutSection({ workout }: { workout: Workout | null }) {
  const { t } = useLanguage();

  if (!workout) {
    return (
      <div className="card p-6 h-full dark:bg-zinc-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("workout.title")}</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-zinc-600 dark:text-zinc-300 mb-4">{t("dashboard.noWorkout")}</p>
          <Link href="/workout" className="btn-primary">
            {t("dashboard.generateWorkout")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 h-full dark:bg-zinc-900">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{workout.name}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{workout.exercises?.length || 0} {t("dashboard.exercises")}</p>
        </div>
      </div>
      
      <ul className="space-y-2">
        {workout.exercises?.slice(0, 5).map((exercise, index) => (
          <li 
            key={index}
            className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {index + 1}
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{exercise.name}</span>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {exercise.sets} × {exercise.reps}
            </span>
          </li>
        ))}
        {workout.exercises?.length > 5 && (
          <li className="text-center py-2 text-sm text-zinc-500 dark:text-zinc-400">
            +{workout.exercises.length - 5} more
          </li>
        )}
      </ul>
    </div>
  );
}

// Nutrition Summary Section
function NutritionSection({ plan }: { plan: NutritionPlan | null }) {
  const { t } = useLanguage();

  if (!plan) {
    return (
      <div className="card p-6 h-full dark:bg-zinc-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Nutrition</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm">{t("dashboard.noNutrition")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 h-full dark:bg-zinc-900">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Nutrition</h3>
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{plan.calories}</span>
          <span className="text-zinc-500 dark:text-zinc-400">{t("dashboard.calories")}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {plan.meals?.slice(0, 3).map((meal, index) => (
          <div 
            key={index}
            className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800"
          >
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{meal.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g
              </p>
            </div>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{meal.calories}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Forum Activity Section
function ForumActivitySection({ posts }: { posts: ForumPost[] }) {
  const { t } = useLanguage();

  return (
    <div className="card p-6 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Community</h3>
        </div>
        <Link href="/forum" className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300">
          {t("forum.viewAll")}
        </Link>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-zinc-500 dark:text-zinc-400">{t("dashboard.noPosts")}</p>
          <Link href="/forum" className="btn-primary inline-block mt-4">
            {t("dashboard.startDiscussion")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {posts.slice(0, 5).map((post) => (
            <li key={post.id}>
              <Link 
                href={`/forum/${post.id}`}
                className="block py-3 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <p className="font-medium text-zinc-700 dark:text-zinc-200 line-clamp-1">{post.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  by {post.authorId.slice(0, 8)}...
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Buddy Matches Section
function BuddyMatchesSection({ buddies }: { buddies: BuddyMatch[] }) {
  const { t } = useLanguage();

  return (
    <div className="card p-6 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Gym Buddies</h3>
        </div>
        <Link href="/find_a_buddy" className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300">
          {t("dashboard.findMore")}
        </Link>
      </div>
      
      {buddies.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">{t("dashboard.noBuddies")}</p>
          <p className="text-sm text-zinc-400">Update your profile to find matches</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {buddies.slice(0, 5).map((buddy) => (
            <div 
              key={buddy.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium text-sm">
                {buddy.displayName?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-700 dark:text-zinc-200 truncate">
                  {buddy.displayName || "Anonymous"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {buddy.fitnessLevel} · {buddy.city}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main Dashboard Component
function Dashboard({ user }: { user: User }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [buddyMatches, setBuddyMatches] = useState<BuddyMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user profile
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          userData.id = userDocSnap.id;
          setProfile(userData);

          // Fetch buddy matches (same city, looking for buddy, excluding current user)
          if (userData.city) {
            const buddiesQuery = query(
              collection(db, "users"),
              where("lookingForBuddy", "==", true),
              where("city", "==", userData.city),
              limit(5)
            );
            const buddiesSnapshot = await getDocs(buddiesQuery);
            const buddies: BuddyMatch[] = [];
            buddiesSnapshot.forEach((doc) => {
              if (doc.id !== user.uid) {
                buddies.push({ id: doc.id, ...doc.data() } as BuddyMatch);
              }
            });
            setBuddyMatches(buddies);
          }
        }

        // Fetch latest workout
        const workoutsQuery = query(
          collection(db, "workouts"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const workoutsSnapshot = await getDocs(workoutsQuery);
        if (!workoutsSnapshot.empty) {
          const workoutDoc = workoutsSnapshot.docs[0];
          setWorkout({ id: workoutDoc.id, ...workoutDoc.data() } as Workout);
        }

        // Fetch latest nutrition plan
        const nutritionQuery = query(
          collection(db, "nutrition_plans"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const nutritionSnapshot = await getDocs(nutritionQuery);
        if (!nutritionSnapshot.empty) {
          const planDoc = nutritionSnapshot.docs[0];
          setNutritionPlan({ id: planDoc.id, ...planDoc.data() } as NutritionPlan);
        }

        // Fetch latest 5 forum posts
        const forumQuery = query(
          collection(db, "forum_posts"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const forumSnapshot = await getDocs(forumQuery);
        const posts: ForumPost[] = [];
        forumSnapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() } as ForumPost);
        });
        setForumPosts(posts);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t("dashboard.title")}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t("dashboard.subtitle")}</p>
        </header>

        {/* Welcome Section */}
        <section className="mb-6">
          <WelcomeSection profile={profile} />
        </section>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Workout */}
          <div>
            <TodaysWorkoutSection workout={workout} />
          </div>

          {/* Nutrition */}
          <div>
            <NutritionSection plan={nutritionPlan} />
          </div>

          {/* Forum Activity */}
          <div>
            <ForumActivitySection posts={forumPosts} />
          </div>

          {/* Buddy Matches */}
          <div className="lg:col-span-3">
            <BuddyMatchesSection buddies={buddyMatches} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Page component
export default function DashboardPage() {
  return (
    <AuthCheck>
      {(user) => <Dashboard user={user} />}
    </AuthCheck>
  );
}
