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
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb, getUserDisplayName } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Timestamp;
  likes: string[];
  dislikes: string[];
  commentCount?: number;
}

export default function ForumPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [votingPosts, setVotingPosts] = useState<Set<string>>(new Set());
  const [userNames, setUserNames] = useState<Record<string, string>>({});

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
    // First, get all posts
    const postsQuery = query(
      collection(db, "forum_posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      const postsData: ForumPost[] = [];
      const uniqueAuthorIds = new Set<string>();
      
      // Get comment counts for each post
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Collect author IDs
        if (!uniqueAuthorIds.has(data.authorId)) {
          uniqueAuthorIds.add(data.authorId);
          // Fetch author name
          getUserDisplayName(data.authorId).then((name) => {
            setUserNames(prev => ({ ...prev, [data.authorId]: name }));
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
        } as ForumPost);
      }
      
      // Sort based on sortBy
      const sortedPosts = sortBy === "popular" 
        ? [...postsData].sort((a, b) => {
            const aScore = (a.likes?.length || 0) - (a.dislikes?.length || 0);
            const bScore = (b.likes?.length || 0) - (b.dislikes?.length || 0);
            return bScore - aScore;
          })
        : postsData;
      
      setPosts(sortedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortBy]);

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
      });

      setNewPost({ title: "", content: "" });
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
          // Remove like
          await updateDoc(postRef, {
            likes: arrayRemove(userId),
          });
        } else {
          // Add like, remove dislike if exists
          if (hasDisliked) {
            await updateDoc(postRef, {
              likes: arrayUnion(userId),
              dislikes: arrayRemove(userId),
            });
          } else {
            await updateDoc(postRef, {
              likes: arrayUnion(userId),
            });
          }
        }
      } else {
        if (hasDisliked) {
          // Remove dislike
          await updateDoc(postRef, {
            dislikes: arrayRemove(userId),
          });
        } else {
          // Add dislike, remove like if exists
          if (hasLiked) {
            await updateDoc(postRef, {
              dislikes: arrayUnion(userId),
              likes: arrayRemove(userId),
            });
          } else {
            await updateDoc(postRef, {
              dislikes: arrayUnion(userId),
            });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function formatDate(timestamp: any) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t("forum.title")}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t("forum.subtitle")}</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">{t("forum.createPost")}</span>
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setSortBy("recent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "recent"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {language === "ro" ? "Recente" : "Recent"}
          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "popular"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {language === "ro" ? "Populare" : "Popular"}
          </button>
        </div>

        {/* Create Post Form */}
        {showCreateForm && (
          <div className="card p-6 mb-6 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t("forum.newPost")}</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t("forum.postTitle")}
                  required
                  className="input"
                />
              </div>
              <div>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={t("forum.whatsOnMind")}
                  required
                  rows={4}
                  className="input resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPost({ title: "", content: "" });
                  }}
                  className="btn-secondary dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {t("forum.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={creating || !newPost.title.trim() || !newPost.content.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t("forum.posting")}
                    </>
                  ) : (
                    t("forum.post")
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="card p-8 text-center dark:bg-zinc-900">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">{t("forum.noPosts")}</p>
            </div>
          ) : (
            posts.map((post) => {
              const userVote = userId 
                ? (post.likes?.includes(userId) ? "like" : post.dislikes?.includes(userId) ? "dislike" : null)
                : null;
              const voteScore = getVoteScore(post);
              
              return (
                <div
                  key={post.id}
                  className="card-hover p-6 dark:bg-zinc-900"
                >
                  <div className="flex items-start gap-4">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={() => handleVote(post.id, "like")}
                        disabled={votingPosts.has(post.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          userVote === "like"
                            ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30"
                            : "text-zinc-300 dark:text-zinc-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        }`}
                      >
                        <svg className="w-5 h-5" fill={userVote === "like" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className={`text-sm font-semibold ${
                        voteScore > 0 ? "text-emerald-600" : voteScore < 0 ? "text-red-500" : "text-zinc-500"
                      }`}>
                        {voteScore}
                      </span>
                      <button 
                        onClick={() => handleVote(post.id, "dislike")}
                        disabled={votingPosts.has(post.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          userVote === "dislike"
                            ? "text-red-500 bg-red-50 dark:bg-red-900/30"
                            : "text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        }`}
                      >
                        <svg className="w-5 h-5" fill={userVote === "dislike" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/forum/${post.id}`}>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-zinc-600 dark:text-zinc-300 mt-2 line-clamp-3">{post.content}</p>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {userNames[post.authorId] || post.authorId.slice(0, 8)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(post.createdAt)}
                        </span>
                        <Link 
                          href={`/forum/${post.id}`}
                          className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ml-auto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.commentCount || 0} {post.commentCount === 1 ? (language === "ro" ? "comentariu" : "comment") : (language === "ro" ? "comentarii" : "comments")}
                        </Link>
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
