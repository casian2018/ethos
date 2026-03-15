"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorBadge: string;
  authorLevel: number;
  category: string;
  sport?: string;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: string;
  hasWorkout?: boolean;
  workoutData?: {
    name: string;
    exercises: number;
    duration: number;
  };
}

interface PostCardProps {
  post: ForumPost;
  onUpvote: (postId: string) => void;
  onDownvote: (postId: string) => void;
  onReply: (postId: string) => void;
  userVote?: "up" | "down" | null;
}

const sportEmojis: Record<string, string> = {
  gym: "🏋️",
  running: "🏃",
  swimming: "🏊",
  football: "⚽",
  tennis: "🎾",
  basketball: "🏀",
  cycling: "🚴",
  yoga: "🧘",
  general: "💪"
};

const badgeConfig: Record<string, { label: string; color: string }> = {
  "beginner": { label: "Beginner", color: "bg-slate-100 text-slate-600" },
  "runner": { label: "Runner", color: "bg-green-100 text-green-700" },
  "muscle": { label: "Muscle Builder", color: "bg-red-100 text-red-700" },
  "contributor": { label: "Top Contributor", color: "bg-amber-100 text-amber-700" },
  "expert": { label: "Fitness Expert", color: "bg-purple-100 text-purple-700" },
  "influencer": { label: "Community Leader", color: "bg-emerald-100 text-emerald-700" }
};

export default function PostCard({ post, onUpvote, onDownvote, onReply, userVote }: PostCardProps) {
  const { t, language } = useLanguage();
  
  const karma = post.upvotes - post.downvotes;
  const badge = badgeConfig[post.authorBadge] || badgeConfig.beginner;
  const sportEmoji = post.sport ? sportEmojis[post.sport] || sportEmojis.general : sportEmojis.general;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-300 transition-all hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Vote Buttons */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onUpvote(post.id)}
            className={`p-2 rounded-lg transition-colors ${
              userVote === "up" 
                ? "bg-emerald-100 text-emerald-600" 
                : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className={`text-sm font-bold ${
            karma > 0 ? "text-emerald-600" : karma < 0 ? "text-red-500" : "text-slate-500"
          }`}>
            {karma}
          </span>
          <button
            onClick={() => onDownvote(post.id)}
            className={`p-2 rounded-lg transition-colors ${
              userVote === "down" 
                ? "bg-red-100 text-red-600" 
                : "text-slate-400 hover:text-red-500 hover:bg-red-50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Category & Sport Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
              {post.category}
            </span>
            {post.sport && (
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium flex items-center gap-1">
                {sportEmoji} {post.sport}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 mb-2 hover:text-emerald-600 cursor-pointer">
            {post.title}
          </h3>

          {/* Content Preview */}
          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
            {post.content}
          </p>

          {/* Workout Card Embed */}
          {post.hasWorkout && post.workoutData && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 mb-3 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏋️</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{post.workoutData.name}</p>
                  <p className="text-sm text-slate-500">
                    {post.workoutData.exercises} exercises • {post.workoutData.duration} min
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Author & Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {post.authorName.slice(0, 2).toUpperCase()}
              </div>
              
              {/* Author Info */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 text-sm">{post.authorName}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                  L{post.authorLevel} - {badge.label}
                </span>
              </div>
            </div>

            {/* Reply Button */}
            <button
              onClick={() => onReply(post.id)}
              className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">{post.replyCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
