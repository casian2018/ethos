"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  getCountFromServer,
  where,
  getDocs,
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb, getUserDisplayName } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

// Sports and Goals categories
const SPORTS = [
  { id: "gym", emoji: "🏋️", label: "Gym", labelRo: "Sală" },
  { id: "running", emoji: "🏃", label: "Running", labelRo: "Alergare" },
  { id: "football", emoji: "⚽", label: "Football", labelRo: "Fotbal" },
  { id: "tennis", emoji: "🎾", label: "Tennis", labelRo: "Tenis" },
  { id: "swimming", emoji: "🏊", label: "Swimming", labelRo: "Înot" },
  { id: "cycling", emoji: "🚴", label: "Cycling", labelRo: "Ciclism" },
  { id: "yoga", emoji: "🧘", label: "Yoga", labelRo: "Yoga" },
  { id: "basketball", emoji: "🏀", label: "Basketball", labelRo: "Baschet" },
];

const GOALS = [
  { id: "weight_loss", label: "Weight Loss", labelRo: "Slăbire" },
  { id: "muscle", label: "Muscle Gain", labelRo: "Masă musculară" },
  { id: "endurance", label: "Endurance", labelRo: "Rezistență" },
  { id: "flexibility", label: "Flexibility", labelRo: "Flexibilitate" },
  { id: "health", label: "General Health", labelRo: "Sănătate generală" },
];

// Updated Categories
const CATEGORIES = [
  { id: "nutritie", label: "Nutriție", labelRo: "Nutriție", emoji: "🥗", color: "bg-green-100 text-green-700" },
  { id: "biohacking", label: "Biohacking", labelRo: "Biohacking", emoji: "🧬", color: "bg-purple-100 text-purple-700" },
  { id: "workout-tips", label: "Workout Tips", labelRo: "Sfaturi Antrenament", emoji: "💡", color: "bg-blue-100 text-blue-700" },
  { id: "suport", label: "Suport", labelRo: "Suport", emoji: "🤝", color: "bg-amber-100 text-amber-700" },
  { id: "discutii", label: "Discuții", labelRo: "Discuții", emoji: "💬", color: "bg-slate-100 text-slate-700" },
];

// Difficulty tags
const DIFFICULTY_TAGS = [
  { id: "beginner", label: "Începător", labelEn: "Beginner", emoji: "🌱", color: "bg-emerald-100 text-emerald-700" },
  { id: "intermediate", label: "Intermediar", labelEn: "Intermediate", emoji: "💪", color: "bg-blue-100 text-blue-700" },
  { id: "advanced", label: "Avansat", labelEn: "Advanced", emoji: "🔥", color: "bg-red-100 text-red-700" },
];

interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Timestamp;
  likes: string[];
  dislikes: string[];
  commentCount?: number;
  sport?: string;
  goal?: string;
  category?: string;
  difficulty?: string;
  isVerifiedExpert?: boolean;
}

interface UserProfile {
  displayName?: string;
  badge?: string;
  level?: number;
  karma?: number;
  isVerifiedExpert?: boolean;
}

export default function ForumPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ 
  title: "", 
  content: "", 
  sport: "", 
  goal: "", 
  category: "discutii",
  difficulty: "beginner"
});
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [votingPosts, setVotingPosts] = useState<Set<string>>(new Set());
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  
  // Filters
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedGoal, setSelectedGoal] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Fetch posts
    const postsQuery = query(
      collection(db, "forum_posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      const postsData: ForumPost[] = [];
      const uniqueAuthorIds = new Set<string>();
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Collect author IDs
        if (!uniqueAuthorIds.has(data.authorId)) {
          uniqueAuthorIds.add(data.authorId);
          // Fetch author name
          getUserDisplayName(data.authorId).then((name) => {
            setUserNames(prev => ({ ...prev, [data.authorId]: name }));
            // Set default profile
            setUserProfiles(prev => ({ ...prev, [data.authorId]: { displayName: name, level: 1 } }));
          });
        }
        
        // Get comment count
        const commentsSnapshot = await getCountFromServer(
          query(collection(db, "forum_replies"), where("postId", "==", docSnap.id))
        );
        
        postsData.push({
          id: docSnap.id,
          title: data.title,
          content: data.content,
          authorId: data.authorId,
          createdAt: data.createdAt,
          likes: data.likes || [],
          dislikes: data.dislikes || [],
          commentCount: commentsSnapshot.data().count,
          sport: data.sport || "",
          goal: data.goal || "",
          category: data.category || "discutii",
          difficulty: data.difficulty || "beginner",
        } as ForumPost);
      }
      
      // Filter posts
      let filteredPosts = postsData;
      if (selectedSport !== "all") {
        filteredPosts = filteredPosts.filter(p => p.sport === selectedSport);
      }
      if (selectedGoal !== "all") {
        filteredPosts = filteredPosts.filter(p => p.goal === selectedGoal);
      }
      if (selectedCategory !== "all") {
        filteredPosts = filteredPosts.filter(p => p.category === selectedCategory);
      }
      
      // Sort based on sortBy
      const sortedPosts = sortBy === "popular" 
        ? [...filteredPosts].sort((a, b) => {
            const aScore = (a.likes?.length || 0) - (a.dislikes?.length || 0);
            const bScore = (b.likes?.length || 0) - (b.dislikes?.length || 0);
            return bScore - aScore;
          })
        : filteredPosts;
      
      setPosts(sortedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortBy, selectedSport, selectedGoal, selectedCategory]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !newPost.title.trim() || !newPost.content.trim()) return;

    setCreating(true);
    try {
      await addDoc(collection(db, "forum_posts"), {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        authorId: userId,
        createdAt: Timestamp.now(),
        likes: [],
        dislikes: [],
        sport: newPost.sport || "",
        goal: newPost.goal || "",
        category: newPost.category || "discutii",
        difficulty: newPost.difficulty || "beginner",
      });

      setNewPost({ title: "", content: "", sport: "", goal: "", category: "discutii", difficulty: "beginner" });
      setShowCreateForm(false);
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleVote(postId: string, type: "like" | "dislike") {
    if (!userId || votingPosts.has(postId)) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    setVotingPosts(prev => new Set(prev).add(postId));
    
    const postRef = doc(db, "forum_posts", postId);
    const hasLiked = post.likes?.includes(userId);
    const hasDisliked = post.dislikes?.includes(userId);
    
    try {
      if (type === "like") {
        if (hasLiked) {
          await updateDoc(postRef, { likes: arrayRemove(userId) });
        } else {
          if (hasDisliked) {
            await updateDoc(postRef, { likes: arrayUnion(userId), dislikes: arrayRemove(userId) });
          } else {
            await updateDoc(postRef, { likes: arrayUnion(userId) });
          }
        }
      } else {
        if (hasDisliked) {
          await updateDoc(postRef, { dislikes: arrayRemove(userId) });
        } else {
          if (hasLiked) {
            await updateDoc(postRef, { dislikes: arrayUnion(userId), likes: arrayRemove(userId) });
          } else {
            await updateDoc(postRef, { dislikes: arrayUnion(userId) });
          }
        }
      }
    } catch (err) {
      console.error("Error voting:", err);
    } finally {
      setVotingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  }

  function formatDate(timestamp: { toDate?: () => Date } | null | undefined) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as string);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return language === "ro" ? "acum" : "just now";
    if (minutes < 60) return `${minutes}m ${language === "ro" ? "în urmă" : "ago"}`;
    if (hours < 24) return `${hours}h ${language === "ro" ? "în urmă" : "ago"}`;
    if (days < 7) return `${days}d ${language === "ro" ? "în urmă" : "ago"}`;
    
    return date.toLocaleDateString();
  }

  function getVoteScore(post: ForumPost) {
    const likes = post.likes?.length || 0;
    const dislikes = post.dislikes?.length || 0;
    return likes - dislikes;
  }

  function getBadgeInfo(profile: UserProfile | undefined) {
    if (!profile?.badge) {
      return { label: "Newbie", color: "bg-slate-100 text-slate-600" };
    }
    const badges: Record<string, { label: string; color: string }> = {
      "beginner": { label: "Beginner", color: "bg-slate-100 text-slate-600" },
      "runner": { label: "Runner 🏃", color: "bg-green-100 text-green-700" },
      "muscle": { label: "Muscle 💪", color: "bg-red-100 text-red-700" },
      "contributor": { label: "Top Contributor ⭐", color: "bg-amber-100 text-amber-700" },
      "expert": { label: "Expert 🎯", color: "bg-purple-100 text-purple-700" },
      "influencer": { label: "Leader 🏆", color: "bg-emerald-100 text-emerald-700" },
    };
    return badges[profile.badge] || badges.beginner;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t("forum.title")}</h1>
            <p className="text-slate-500 mt-1">
              {language === "ro" ? "Comunitatea Ethos - Antrenează-te, învață, crește" : "Ethos Community - Train, Learn, Grow"}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">{language === "ro" ? "Postare" : "Post"}</span>
          </button>
        </div>

        {/* Category Pills - Horizontal Scroll */}
        <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === "all"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {language === "ro" ? "Toate" : "All"}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.emoji} {language === "ro" ? cat.labelRo : cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sport & Goal Filters */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === "ro" ? "Sport" : "Sport"}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSport("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedSport === "all"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {language === "ro" ? "Toate" : "All"}
                </button>
                {SPORTS.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => setSelectedSport(sport.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedSport === sport.id
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {sport.emoji} {language === "ro" ? sport.labelRo : sport.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === "ro" ? "Obiectiv" : "Goal"}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGoal("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedGoal === "all"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {language === "ro" ? "Toate" : "All"}
                </button>
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedGoal === goal.id
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {language === "ro" ? goal.labelRo : goal.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setSortBy("recent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "recent"
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {language === "ro" ? "Recente" : "Recent"}
          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "popular"
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {language === "ro" ? "Populare" : "Popular"}
          </button>
          
          <span className="ml-auto text-sm text-slate-500">
            {posts.length} {posts.length === 1 ? (language === "ro" ? "postare" : "post") : (language === "ro" ? "postări" : "posts")}
          </span>
        </div>

        {/* Create Post Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl p-6 mb-6 border border-slate-200 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {language === "ro" ? "Crează o postare nouă" : "Create New Post"}
            </h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={language === "ro" ? "Titlul postării..." : "Post title..."}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>
              
              <div>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={language === "ro" ? "Ce ai pe suflet?" : "What's on your mind?"}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                />
              </div>

              {/* Category & Sport Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === "ro" ? "Categorie" : "Category"}
                  </label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {language === "ro" ? cat.labelRo : cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === "ro" ? "Sport" : "Sport"}
                  </label>
                  <select
                    value={newPost.sport}
                    onChange={(e) => setNewPost(prev => ({ ...prev, sport: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  >
                    <option value="">{language === "ro" ? "Selectează..." : "Select..."}</option>
                    {SPORTS.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.emoji} {language === "ro" ? sport.labelRo : sport.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === "ro" ? "Obiectiv" : "Goal"}
                  </label>
                  <select
                    value={newPost.goal}
                    onChange={(e) => setNewPost(prev => ({ ...prev, goal: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  >
                    <option value="">{language === "ro" ? "Selectează..." : "Select..."}</option>
                    {GOALS.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {language === "ro" ? goal.labelRo : goal.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPost({ title: "", content: "", sport: "", goal: "", category: "discutii", difficulty: "beginner" });
                  }}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                >
                  {language === "ro" ? "Anulează" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={creating || !newPost.title.trim() || !newPost.content.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  {creating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {language === "ro" ? "Se postează..." : "Posting..."}
                    </>
                  ) : (
                    language === "ro" ? "Postează" : "Post"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <p className="text-slate-500">{t("forum.noPosts")}</p>
              <p className="text-slate-400 text-sm mt-1">
                {language === "ro" ? "Fii primul care postează!" : "Be the first to post!"}
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const userVote = userId 
                ? (post.likes?.includes(userId) ? "like" : post.dislikes?.includes(userId) ? "dislike" : null)
                : null;
              const voteScore = getVoteScore(post);
              const authorProfile = userProfiles[post.authorId];
              const badgeInfo = getBadgeInfo(authorProfile);
              
              // Find sport emoji
              const sportInfo = SPORTS.find(s => s.id === post.sport);
              const categoryInfo = CATEGORIES.find(c => c.id === post.category);
              const difficultyInfo = DIFFICULTY_TAGS.find(d => d.id === (post.difficulty || "beginner"));
              const isVerifiedExpert = authorProfile?.isVerifiedExpert || false;
              
              return (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={() => handleVote(post.id, "like")}
                        disabled={votingPosts.has(post.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          userVote === "like"
                            ? "text-emerald-600 bg-emerald-100"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        <svg className="w-5 h-5" fill={userVote === "like" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className={`text-sm font-bold ${
                        voteScore > 0 ? "text-emerald-600" : voteScore < 0 ? "text-red-500" : "text-slate-500"
                      }`}>
                        {voteScore}
                      </span>
                      <button 
                        onClick={() => handleVote(post.id, "dislike")}
                        disabled={votingPosts.has(post.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          userVote === "dislike"
                            ? "text-red-500 bg-red-100"
                            : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <svg className="w-5 h-5" fill={userVote === "dislike" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Badges Row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {categoryInfo && (
                          <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${categoryInfo.color}`}>
                            {categoryInfo.emoji} {language === "ro" ? categoryInfo.labelRo : categoryInfo.label}
                          </span>
                        )}
                        {difficultyInfo && (
                          <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${difficultyInfo.color}`}>
                            {difficultyInfo.emoji} {language === "ro" ? difficultyInfo.label : difficultyInfo.labelEn}
                          </span>
                        )}
                        {sportInfo && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">
                            {sportInfo.emoji} {language === "ro" ? sportInfo.labelRo : sportInfo.label}
                          </span>
                        )}
                        {isVerifiedExpert && (
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                            ✓ Expert Verificat
                          </span>
                        )}
                      </div>

                      {/* Title */}

                      {/* Title */}
                      <Link href={`/dev/forum/${post.id}`}>
                        <h3 className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>
                      
                      {/* Content Preview */}
                      <p className="text-slate-600 mt-2 line-clamp-2">{post.content}</p>
                      
                      {/* Meta - Author Info */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {(userNames[post.authorId] || post.authorId.slice(0, 2)).slice(0, 2).toUpperCase()}
                          </div>
                          
                          {/* Author & Badge */}
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 text-sm">
                              {userNames[post.authorId] || post.authorId.slice(0, 8)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeInfo.color}`}>
                              {authorProfile?.level || 1} • {badgeInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Time & Comments */}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(post.createdAt)}
                          </span>
                          <Link 
                            href={`/dev/forum/${post.id}`}
                            className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.commentCount || 0}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
