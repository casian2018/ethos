/**
 * SlotChatModal - Chat for matched availability slots
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { AvailabilitySlot, sportTypeLabels } from "@/lib/types";
import { onAuthStateChanged, User } from "firebase/auth";

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
  slot: AvailabilitySlot;
  userId: string | null;
  onClose: () => void;
}

export default function SlotChatModal({ slot, userId, onClose }: SlotChatModalProps) {
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

  // Subscribe to chat messages
  useEffect(() => {
    if (!slot.id) return;

    const chatQuery = query(
      collection(db, `availability_slots/${slot.id}/chat`),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          userId: data.userId || "",
          userName: data.userName || "Utilizator",
          content: data.content || "",
          type: data.type || "message",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        });
      });
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slot.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !slot.id) return;
    
    setSending(true);
    try {
      await addDoc(collection(db, `availability_slots/${slot.id}/chat`), {
        userId: user.uid,
        userName: user.displayName || "Utilizator",
        content: newMessage.trim(),
        type: "message",
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sport = sportTypeLabels[slot.sportType as keyof typeof sportTypeLabels];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-0 max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-white">
              💬 Chat Antrenament
            </h2>
            <p className="text-sm text-zinc-500">
              {sport?.emoji} {sport?.label} - {slot.location.name}
            </p>
            <p className="text-xs text-zinc-400">
              📅 {new Date(slot.dateTime).toLocaleDateString("ro-RO")} • 🕐 {new Date(slot.dateTime).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 p-4 bg-zinc-50 dark:bg-zinc-800 min-h-[200px] max-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-zinc-500 py-4">
              Încă niciun mesaj. Spune &ldquo;Bună!&rdquo; 👋
            </p>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = user && msg.userId === user.uid;
              const isSystem = msg.type === "system";
              
              if (isSystem) {
                return (
                  <div 
                    key={msg.id} 
                    className="text-center text-xs text-zinc-500 py-2"
                  >
                    {msg.content}
                  </div>
                );
              }
              
              return (
                <div 
                  key={msg.id} 
                  className={`p-2 rounded-lg ${
                    isOwnMessage 
                      ? "bg-emerald-100 dark:bg-emerald-900/30 ml-8" 
                      : "bg-zinc-100 dark:bg-zinc-700 mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-900 dark:text-white">
                      {msg.userName}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {msg.content}
                  </p>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrie un mesaj..."
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-primary px-4"
            >
              ➤
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
