"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp 
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb, getUserDisplayName } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: unknown;
  likes: string[];
  dislikes: string[];
}

interface Reply {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentReplyId: string | null;
  createdAt: unknown;
  likes: string[];
  dislikes: string[];
  replies?: Reply[];
}

function formatDate(timestamp: unknown) {
    if (!timestamp) return "";
    const date = timestamp instanceof Date ? timestamp : (timestamp as { toDate?: () => Date }).toDate ? (timestamp as { toDate: () => Date }).toDate() : new Date(String(timestamp));
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

function ReplyComponent({ 
  reply, 
  allReplies, 
  onReply,
  userId,
  onVote,
  votingReplies,
  language,
  userNames,
  depth = 0
}: { 
  reply: Reply; 
  allReplies: Reply[];
  onReply: (parentId: string) => void;
  userId: string | null;
  onVote: (replyId: string, type: "like" | "dislike") => void;
  votingReplies: Set<string>;
  language: string;
  userNames: Record<string, string>;
  depth?: number;
}) {
  const childReplies = allReplies.filter(r => r.parentReplyId === reply.id);
  const maxDepth = 4;
  
  const userVote = userId 
    ? (reply.likes?.includes(userId) ? "like" : reply.dislikes?.includes(userId) ? "dislike" : null)
    : null;
  const voteScore = (reply.likes?.length || 0) - (reply.dislikes?.length || 0);

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-zinc-100 border-slate-200 pl-4" : ""}`}>
      <div className="bg-white bg-slate-50 rounded-xl p-4 mb-2 border border-zinc-100 border-slate-200">
        <div className="flex items-start gap-3">
          {/* Vote Section */}
          <div className="flex flex-col items-center gap-0.5">
            <button 
              onClick={() => onVote(reply.id, "like")}
              disabled={votingReplies.has(reply.id)}
              className={`p-1 rounded transition-colors ${
                userVote === "like"
                  ? "text-emerald-600"
                  : "text-zinc-400 hover:text-emerald-600"
              }`}
            >
              <svg className="w-4 h-4" fill={userVote === "like" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className={`text-xs font-semibold ${
              voteScore > 0 ? "text-emerald-600" : voteScore < 0 ? "text-red-500" : "text-zinc-400"
            }`}>
              {voteScore}
            </span>
            <button 
              onClick={() => onVote(reply.id, "dislike")}
              disabled={votingReplies.has(reply.id)}
              className={`p-1 rounded transition-colors ${
                userVote === "dislike"
                  ? "text-red-500"
                  : "text-zinc-400 hover:text-red-500"
              }`}
            >
              <svg className="w-4 h-4" fill={userVote === "dislike" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 bg-emerald-100 flex items-center justify-center text-emerald-700 text-emerald-700 text-sm font-medium">
                {(userNames[reply.authorId] || reply.authorId).slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-zinc-700 text-slate-600">{userNames[reply.authorId] || reply.authorId.slice(0, 8)}</span>
              <span className="text-xs text-zinc-400">{formatDate(reply.createdAt)}</span>
            </div>
            <p className="text-zinc-700 text-slate-600">{reply.content}</p>
            <button
              onClick={() => onReply(reply.id)}
              className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 text-emerald-600 font-medium"
            >
              {language === "ro" ? "Răspunde" : "Reply"}
            </button>
          </div>
        </div>
      </div>
      
      {depth < maxDepth && childReplies.length > 0 && (
        <div className="space-y-2">
          {childReplies.map(childReply => (
            <ReplyComponent
              key={childReply.id}
              reply={childReply}
              allReplies={allReplies}
              onReply={onReply}
              userId={userId}
              onVote={onVote}
              votingReplies={votingReplies}
              language={language}
              userNames={userNames}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ForumThreadPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const { language } = useLanguage();
  
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [votingPost, setVotingPost] = useState(false);
  const [votingReplies, setVotingReplies] = useState<Set<string>>(new Set());
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
    if (!postId) return;

    // Fetch post
    const postRef = doc(db, "forum_posts", postId);
    getDoc(postRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPost({ 
          id: docSnap.id, 
          title: data.title,
          content: data.content,
          authorId: data.authorId,
          createdAt: data.createdAt,
          likes: data.likes || [],
          dislikes: data.dislikes || [],
        });
        // Fetch author name
        getUserDisplayName(data.authorId).then((name) => {
          setUserNames(prev => ({ ...prev, [data.authorId]: name }));
        });
      }
      setLoading(false);
    });

    // Subscribe to replies - fetch all and sort in JS to avoid index requirement
    const repliesQuery = query(
      collection(db, "forum_replies"),
      where("postId", "==", postId)
    );

    const unsubscribe = onSnapshot(repliesQuery, (snapshot) => {
      const repliesData: Reply[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        repliesData.push({
          id: doc.id,
          content: data.content,
          authorId: data.authorId,
          postId: data.postId,
          parentReplyId: data.parentReplyId,
          createdAt: data.createdAt,
          likes: data.likes || [],
          dislikes: data.dislikes || [],
        } as Reply);
        // Collect author IDs for name lookup
        if (!userNames[data.authorId]) {
          getUserDisplayName(data.authorId).then((name) => {
            setUserNames(prev => ({ ...prev, [data.authorId]: name }));
          });
        }
      });
      // Sort by createdAt ascending (oldest first)
      repliesData.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt as { toDate?: () => Date }).toDate?.()?.getTime() || 0 : 0;
        const dateB = b.createdAt ? (b.createdAt as { toDate?: () => Date }).toDate?.()?.getTime() || 0 : 0;
        return dateA - dateB;
      });
      setReplies(repliesData);
    });

    return () => unsubscribe();
  }, [postId, userNames]);

  async function handleVotePost(type: "like" | "dislike") {
    if (!userId || !post || votingPost) return;
    
    setVotingPost(true);
    const postRef = doc(db, "forum_posts", postId);
    const hasLiked = post.likes?.includes(userId);
    const hasDisliked = post.dislikes?.includes(userId);
    
    try {
      if (type === "like") {
        if (hasLiked) {
          await updateDoc(postRef, {
            likes: arrayRemove(userId),
          });
        } else {
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
          await updateDoc(postRef, {
            dislikes: arrayRemove(userId),
          });
        } else {
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
      setVotingPost(false);
    }
  }

  async function handleVoteReply(replyId: string, type: "like" | "dislike") {
    if (!userId || votingReplies.has(replyId)) return;
    
    const reply = replies.find(r => r.id === replyId);
    if (!reply) return;
    
    setVotingReplies(prev => new Set(prev).add(replyId));
    
    const replyRef = doc(db, "forum_replies", replyId);
    const hasLiked = reply.likes?.includes(userId);
    const hasDisliked = reply.dislikes?.includes(userId);
    
    try {
      if (type === "like") {
        if (hasLiked) {
          await updateDoc(replyRef, {
            likes: arrayRemove(userId),
          });
        } else {
          if (hasDisliked) {
            await updateDoc(replyRef, {
              likes: arrayUnion(userId),
              dislikes: arrayRemove(userId),
            });
          } else {
            await updateDoc(replyRef, {
              likes: arrayUnion(userId),
            });
          }
        }
      } else {
        if (hasDisliked) {
          await updateDoc(replyRef, {
            dislikes: arrayRemove(userId),
          });
        } else {
          if (hasLiked) {
            await updateDoc(replyRef, {
              dislikes: arrayUnion(userId),
              likes: arrayRemove(userId),
            });
          } else {
            await updateDoc(replyRef, {
              dislikes: arrayUnion(userId),
            });
          }
        }
      }
    } catch (err) {
      console.error("Error voting:", err);
    } finally {
      setVotingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(replyId);
        return newSet;
      });
    }
  }

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !replyContent.trim() || !postId) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "forum_replies"), {
        content: replyContent.trim(),
        authorId: userId,
        postId: postId,
        parentReplyId: replyingTo || null,
        createdAt: Timestamp.now(),
        likes: [],
        dislikes: [],
      });

      setReplyContent("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Error creating reply:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleReplyClick(parentId: string) {
    setReplyingTo(parentId);
    // Scroll to reply form
    document.getElementById("reply-form")?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-600 text-slate-500">Post not found</p>
          <Link href="/forum" className="text-emerald-600 hover:underline mt-2 inline-block">
            Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  // Get top-level replies (no parent)
  const topLevelReplies = replies.filter(r => !r.parentReplyId);

  // Post vote calculation
  const userPostVote = userId 
    ? (post.likes?.includes(userId) ? "like" : post.dislikes?.includes(userId) ? "dislike" : null)
    : null;
  const postVoteScore = (post.likes?.length || 0) - (post.dislikes?.length || 0);

  return (
    <div className="min-h-screen bg-zinc-50 bg-white py-8 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Back Button */}
        <Link 
          href="/forum" 
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-emerald-600 text-slate-500 hover:text-emerald-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {language === "ro" ? "Înapoi la Forum" : "Back to Forum"}
        </Link>

        {/* Post */}
        <div className="bg-white bg-slate-50 rounded-2xl shadow-sm border border-zinc-100 border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Vote Section */}
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => handleVotePost("like")}
                disabled={votingPost}
                className={`p-2 rounded-lg transition-colors ${
                  userPostVote === "like"
                    ? "text-emerald-600 bg-emerald-50 bg-emerald-100"
                    : "text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 hover:bg-emerald-50"
                }`}
              >
                <svg className="w-6 h-6" fill={userPostVote === "like" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className={`text-lg font-bold ${
                postVoteScore > 0 ? "text-emerald-600" : postVoteScore < 0 ? "text-red-500" : "text-zinc-500"
              }`}>
                {postVoteScore}
              </span>
              <button 
                onClick={() => handleVotePost("dislike")}
                disabled={votingPost}
                className={`p-2 rounded-lg transition-colors ${
                  userPostVote === "dislike"
                    ? "text-red-500 bg-red-50 bg-red-100"
                    : "text-zinc-400 hover:text-red-500 hover:bg-red-50 hover:bg-red-50"
                }`}
              >
                <svg className="w-6 h-6" fill={userPostVote === "dislike" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-zinc-900 text-slate-900 mb-4">{post.title}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 bg-emerald-100 flex items-center justify-center text-emerald-700 text-emerald-700 font-medium">
                  {(userNames[post.authorId] || post.authorId).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-zinc-900 text-slate-900">{userNames[post.authorId] || post.authorId.slice(0, 8)}</p>
                  <p className="text-sm text-zinc-500">{formatDate(post.createdAt)}</p>
                </div>
              </div>
              <div className="prose max-w-none text-zinc-700 text-slate-600">
                {post.content}
              </div>
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4">
            {language === "ro" ? "Comentarii" : "Replies"} ({replies.length})
          </h2>
          
          {topLevelReplies.length === 0 ? (
            <div className="bg-white bg-slate-50 rounded-xl p-6 border border-zinc-100 border-slate-200 text-center">
              <p className="text-zinc-500 text-slate-500">{language === "ro" ? "Încă nu există comentarii. Fii primul care răspunde!" : "No replies yet. Be the first to reply!"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topLevelReplies.map(reply => (
                <ReplyComponent
                  key={reply.id}
                  reply={reply}
                  allReplies={replies}
                  onReply={handleReplyClick}
                  userId={userId}
                  onVote={handleVoteReply}
                  votingReplies={votingReplies}
                  language={language}
                  userNames={userNames}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        <div id="reply-form" className="bg-white bg-slate-50 rounded-2xl shadow-sm border border-zinc-100 border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 text-slate-900 mb-4">
            {replyingTo ? (language === "ro" ? "Răspunde la comentariu" : "Reply to comment") : (language === "ro" ? "Adaugă un răspuns" : "Add a reply")}
          </h3>
          
          {replyingTo && (
            <div className="mb-3 p-2 bg-zinc-50 bg-slate-100 rounded-lg flex items-center justify-between">
              <span className="text-sm text-zinc-600 text-slate-600">{language === "ro" ? "Răspunzi la un comentariu" : "Replying to comment"}</span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-zinc-400 hover:text-zinc-600 hover:text-slate-700"
              >
                ×
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmitReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={language === "ro" ? "Scrie răspunsul tău..." : "Write your reply..."}
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 border-slate-200 bg-white bg-slate-100 text-zinc-900 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:ring-emerald-300 outline-none transition-all resize-none mb-3"
            />
            <div className="flex gap-3">
              {replyingTo && (
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 bg-zinc-100 bg-slate-200 text-zinc-700 text-slate-700 rounded-lg font-medium hover:bg-zinc-200 hover:bg-slate-300 transition-colors"
                >
                  {language === "ro" ? "Anulează" : "Cancel"}
                </button>
              )}
              <button
                type="submit"
                disabled={submitting || !replyContent.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {language === "ro" ? "Se postează..." : "Posting..."}
                  </>
                ) : (
                  language === "ro" ? "Publică răspuns" : "Post Reply"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
