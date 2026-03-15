"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { MessageCircle, Send, X } from "lucide-react";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { type FindBuddySlot, getSportLabel } from "@/lib/findBuddy";
import { sportTypeLabels } from "@/lib/types";

const auth = firebaseAuth!;
const db = firebaseDb!;

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  type: "message" | "system";
  createdAt: Date;
}

interface SlotChatModalProps {
  slot: FindBuddySlot;
  onClose: () => void;
}

function getUserNameForSlot(user: User, slot: FindBuddySlot): string {
  const participantIndex = slot.participants.indexOf(user.uid);
  if (participantIndex >= 0 && slot.participantNames[participantIndex]) {
    return slot.participantNames[participantIndex];
  }

  return user.displayName || "Ethos Member";
}

export default function SlotChatModal({ slot, onClose }: SlotChatModalProps) {
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const chatQuery = query(
      collection(db, `availability_slots/${slot.id}/chat`),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const nextMessages: ChatMessage[] = snapshot.docs.map((messageDoc) => {
        const data = messageDoc.data();
        return {
          id: messageDoc.id,
          userId: typeof data.userId === "string" ? data.userId : "",
          userName: typeof data.userName === "string" ? data.userName : "Ethos Member",
          content: typeof data.content === "string" ? data.content : "",
          type: data.type === "system" ? "system" : "message",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });

      setMessages(nextMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slot.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newMessage.trim() || !user) {
      return;
    }

    setSending(true);

    try {
      await addDoc(collection(db, `availability_slots/${slot.id}/chat`), {
        userId: user.uid,
        userName: getUserNameForSlot(user, slot),
        content: newMessage.trim(),
        type: "message",
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending find buddy message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString(language === "ro" ? "ro-RO" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sportEmoji = sportTypeLabels[slot.sportType]?.emoji || "🏃";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                {language === "ro" ? "Chat sesiune" : "Session chat"}
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {sportEmoji} {getSportLabel(slot.sportType, language)} • {slot.location.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {slot.dateTime.toLocaleDateString(language === "ro" ? "ro-RO" : "en-US")} •{" "}
              {slot.dateTime.toLocaleTimeString(language === "ro" ? "ro-RO" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-[260px] flex-1 space-y-3 overflow-y-auto bg-slate-50 px-6 py-5">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              {language === "ro" ? "Încă nu există mesaje. Deschide conversația." : "No messages yet. Start the conversation."}
            </div>
          ) : (
            messages.map((message) => {
              if (message.type === "system") {
                return (
                  <div
                    key={message.id}
                    className="mx-auto max-w-[85%] rounded-full bg-white px-4 py-2 text-center text-xs text-slate-500 shadow-sm"
                  >
                    {message.content}
                  </div>
                );
              }

              const isOwnMessage = user?.uid === message.userId;

              return (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${
                    isOwnMessage
                      ? "ml-auto bg-emerald-600 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                    <span className={isOwnMessage ? "text-white/80" : "text-slate-500"}>{message.userName}</span>
                    <span className={isOwnMessage ? "text-white/70" : "text-slate-400"}>
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder={language === "ro" ? "Scrie un mesaj..." : "Write a message..."}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || !user}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
