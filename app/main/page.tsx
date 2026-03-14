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

// Get non-null references for use in the component
const auth = firebaseAuth!;
const db = firebaseDb!;

// Type for Firestore Timestamp
type FirebaseTimestamp = ReturnType<typeof Timestamp.now>;

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
  createdAt: FirebaseTimestamp;
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
  createdAt: FirebaseTimestamp;
}

interface ForumPost {
  id: string;
  title: string;
  authorId: string;
  createdAt: FirebaseTimestamp;
}

interface BuddyMatch {
  id: string;
  displayName: string;
  city: string;
  fitnessLevel: string;
  goals: string[];
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-zinc-200" />
          ))}
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">Please sign in</h1>
          <p className="mt-2 text-zinc-600">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}

// Welcome Section
function WelcomeSection({ profile }: { profile: UserProfile | null }) {
  if (!profile) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
        <div className="mt-4 h-4 w-48 animate-pulse rounded bg-zinc-200" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
      <h2 className="text-lg font-semibold text-zinc-900">
        Welcome back{profile.displayName ? `, ${profile.displayName}` : ''}!
      </h2>
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-zinc-600">{profile.city || 'No city set'}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-zinc-600">{profile.fitnessLevel || 'No fitness level set'}</span>
        </div>
      </div>
      {profile.goals && profile.goals.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-500">Your Goals</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.goals.map((goal, index) => (
              <span 
                key={index}
                className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
              >
                {goal}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Today's Workout Section
function TodaysWorkoutSection({ workout }: { workout: Workout | null }) {
  if (!workout) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
        <h3 className="text-lg font-semibold text-zinc-900">Today&apos;s Workout</h3>
        <p className="mt-2 text-zinc-500">No workout found. Create your first workout!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">{workout.name}</h3>
        <span className="text-sm text-zinc-500">
          {workout.exercises?.length || 0} exercises
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {workout.exercises?.map((exercise, index) => (
          <li 
            key={index}
            className="flex items-center justify-between rounded-xl bg-zinc-50 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600">
                {index + 1}
              </div>
              <span className="font-medium text-zinc-700">{exercise.name}</span>
            </div>
            <span className="text-sm text-zinc-500">
              {exercise.sets} × {exercise.reps}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Nutrition Summary Section
function NutritionSection({ plan }: { plan: NutritionPlan | null }) {
  if (!plan) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
        <h3 className="text-lg font-semibold text-zinc-900">Nutrition Summary</h3>
        <p className="mt-2 text-zinc-500">No nutrition plan found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
      <h3 className="text-lg font-semibold text-zinc-900">Nutrition Summary</h3>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-emerald-600">{plan.calories}</span>
          <span className="text-zinc-500">kcal/day</span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {plan.meals?.map((meal, index) => (
          <div 
            key={index}
            className="flex items-center justify-between rounded-xl bg-zinc-50 p-3"
          >
            <div>
              <p className="font-medium text-zinc-700">{meal.name}</p>
              <p className="text-sm text-zinc-500">
                P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g
              </p>
            </div>
            <span className="font-semibold text-zinc-700">{meal.calories} kcal</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Forum Activity Section
function ForumActivitySection({ posts }: { posts: ForumPost[] }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
      <h3 className="text-lg font-semibold text-zinc-900">Forum Activity</h3>
      {posts.length === 0 ? (
        <p className="mt-2 text-zinc-500">No posts yet. Start a conversation!</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {posts.map((post) => (
            <li 
              key={post.id}
              className="group cursor-pointer rounded-xl bg-zinc-50 p-3 transition-colors hover:bg-zinc-100"
            >
              <p className="font-medium text-zinc-700 group-hover:text-emerald-600">
                {post.title}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                by {post.authorId.slice(0, 8)}...
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Buddy Matches Section
function BuddyMatchesSection({ buddies }: { buddies: BuddyMatch[] }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
      <h3 className="text-lg font-semibold text-zinc-900">Buddy Matches</h3>
      {buddies.length === 0 ? (
        <p className="mt-2 text-zinc-500">No potential buddies found in your area.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {buddies.map((buddy) => (
            <div 
              key={buddy.id}
              className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                {buddy.displayName?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-700">
                  {buddy.displayName || 'Anonymous'}
                </p>
                <p className="text-sm text-zinc-500">
                  {buddy.fitnessLevel} · {buddy.city}
                </p>
              </div>
              <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
                Connect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main Dashboard Component
function Dashboard({ user }: { user: User }) {
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
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-zinc-500">Track your fitness journey</p>
        </header>

        <section className="mb-6">
          <WelcomeSection profile={profile} />
        </section>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-1 lg:col-span-1">
            <TodaysWorkoutSection workout={workout} />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <NutritionSection plan={nutritionPlan} />
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <ForumActivitySection posts={forumPosts} />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
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
