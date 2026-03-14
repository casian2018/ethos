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
  orderBy, 
  onSnapshot,
  Timestamp 
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: unknown;
}

interface Reply {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentReplyId: string | null;
  createdAt: unknown;
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
  depth = 0
}: { 
  reply: Reply; 
  allReplies: Reply[];
  onReply: (parentId: string) => void;
  depth?: number;
}) {
  const childReplies = allReplies.filter(r => r.parentReplyId === reply.id);
  const maxDepth = 4;
  
  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-zinc-100 pl-4" : ""}`}>
      <div className="bg-white rounded-xl p-4 mb-2 border border-zinc-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-medium">
            {reply.authorId.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-zinc-700">{reply.authorId.slice(0, 8)}...</span>
          <span className="text-xs text-zinc-400">{formatDate(reply.createdAt)}</span>
        </div>
        <p className="text-zinc-700">{reply.content}</p>
        <button
          onClick={() => onReply(reply.id)}
          className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Reply
        </button>
      </div>
      
      {depth < maxDepth && childReplies.length > 0 && (
        <div className="space-y-2">
          {childReplies.map(childReply => (
            <ReplyComponent
              key={childReply.id}
              reply={childReply}
              allReplies={allReplies}
              onReply={onReply}
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
  
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        setPost({ id: docSnap.id, ...docSnap.data() } as Post);
      }
      setLoading(false);
    });

    // Subscribe to replies
    const repliesQuery = query(
      collection(db, "forum_replies"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(repliesQuery, (snapshot) => {
      const repliesData: Reply[] = [];
      snapshot.forEach((doc) => {
        repliesData.push({
          id: doc.id,
          ...doc.data()
        } as Reply);
      });
      setReplies(repliesData);
    });

    return () => unsubscribe();
  }, [postId]);

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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-600">Post not found</p>
          <Link href="/forum" className="text-emerald-600 hover:underline mt-2 inline-block">
            Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  // Get top-level replies (no parent)
  const topLevelReplies = replies.filter(r => !r.parentReplyId);

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Back Button */}
        <Link 
          href="/forum" 
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Forum
        </Link>

        {/* Post */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">{post.title}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
              {post.authorId.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-zinc-900">{post.authorId.slice(0, 8)}...</p>
              <p className="text-sm text-zinc-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <div className="prose max-w-none text-zinc-700">
            {post.content}
          </div>
        </div>

        {/* Replies Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Replies ({replies.length})
          </h2>
          
          {topLevelReplies.length === 0 ? (
            <div className="bg-white rounded-xl p-6 border border-zinc-100 text-center">
              <p className="text-zinc-500">No replies yet. Be the first to reply!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topLevelReplies.map(reply => (
                <ReplyComponent
                  key={reply.id}
                  reply={reply}
                  allReplies={replies}
                  onReply={handleReplyClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        <div id="reply-form" className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">
            {replyingTo ? "Reply to comment" : "Add a reply"}
          </h3>
          
          {replyingTo && (
            <div className="mb-3 p-2 bg-zinc-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-zinc-600">Replying to comment</span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ×
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmitReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none mb-3"
            />
            <div className="flex gap-3">
              {replyingTo && (
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                >
                  Cancel
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
                    Posting...
                  </>
                ) : (
                  "Post Reply"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
