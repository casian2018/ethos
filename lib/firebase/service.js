/**
 * Ethos Firebase Service
 * 
 * This file contains all Firebase service functions organized by feature.
 * All functions are isolated here to keep the codebase clean.
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

function getSortableTime(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

// ==================== User Service ====================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId) {
  if (!db) return null;
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Create or update user profile
 */
export async function saveUserProfile(userId, userData) {
  if (!db) return;
  try {
    await setDoc(doc(db, "users", userId), {
      ...userData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

/**
 * Update user preferences (language, theme)
 */
export async function updateUserPreferences(userId, preferences) {
  if (!db) return;
  try {
    await updateDoc(doc(db, "users", userId), {
      ...preferences,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    throw error;
  }
}

// ==================== Availability Slots Service ====================

/**
 * Create an availability slot
 */
export async function createAvailabilitySlot(userId, slotData) {
  if (!db) return;
  try {
    const docRef = await addDoc(collection(db, "availabilitySlots"), {
      ...slotData,
      userId,
      createdAt: serverTimestamp(),
      status: "open",
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating availability slot:", error);
    throw error;
  }
}

/**
 * Get all availability slots (for feed)
 */
export async function getAvailabilitySlots(filters = {}) {
  if (!db) return [];
  try {
    let q = collection(db, "availabilitySlots");
    const constraints = [];
    
    if (filters.city) {
      constraints.push(where("city", "==", filters.city));
    }
    if (filters.sport) {
      constraints.push(where("sportType", "==", filters.sport));
    }
    if (filters.status) {
      constraints.push(where("status", "==", filters.status));
    }
    
    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((left, right) => getSortableTime(right.createdAt) - getSortableTime(left.createdAt))
      .slice(0, 50);
  } catch (error) {
    console.error("Error fetching availability slots:", error);
    return [];
  }
}

/**
 * Get user's availability slots
 */
export async function getUserAvailabilitySlots(userId) {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "availabilitySlots"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((left, right) => getSortableTime(right.createdAt) - getSortableTime(left.createdAt));
  } catch (error) {
    console.error("Error fetching user slots:", error);
    return [];
  }
}

/**
 * Delete an availability slot
 */
export async function deleteAvailabilitySlot(slotId) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "availabilitySlots", slotId));
  } catch (error) {
    console.error("Error deleting slot:", error);
    throw error;
  }
}

/**
 * Join an availability slot
 */
export async function joinAvailabilitySlot(slotId, userId) {
  if (!db) return;
  try {
    const slotDoc = await getDoc(doc(db, "availabilitySlots", slotId));
    if (!slotDoc.exists()) throw new Error("Slot not found");
    
    const slotData = slotDoc.data();
    const joinedUsers = slotData.joinedUsers || [];
    
    if (joinedUsers.includes(userId)) {
      throw new Error("Already joined");
    }
    
    await updateDoc(doc(db, "availabilitySlots", slotId), {
      joinedUsers: [...joinedUsers, userId],
      status: joinedUsers.length + 1 >= slotData.maxParticipants ? "full" : "open",
    });
  } catch (error) {
    console.error("Error joining slot:", error);
    throw error;
  }
}

// ==================== Sport Events Service ====================

/**
 * Create a sport event
 */
export async function createSportEvent(userId, eventData) {
  if (!db) return;
  try {
    const docRef = await addDoc(collection(db, "sportEvents"), {
      ...eventData,
      creatorId: userId,
      joinedUsers: [userId],
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

/**
 * Get sport events with filters
 */
export async function getSportEvents(filters = {}) {
  if (!db) return [];
  try {
    let q = collection(db, "sportEvents");
    const constraints = [];
    
    if (filters.city) {
      constraints.push(where("city", "==", filters.city));
    }
    if (filters.sportType) {
      constraints.push(where("sportType", "==", filters.sportType));
    }
    if (filters.status) {
      constraints.push(where("status", "==", filters.status));
    }
    
    constraints.push(orderBy("startTime", "asc"));
    constraints.push(limit(50));
    
    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

/**
 * Join a sport event
 */
export async function joinSportEvent(eventId, userId) {
  if (!db) return;
  try {
    const eventDoc = await getDoc(doc(db, "sportEvents", eventId));
    if (!eventDoc.exists()) throw new Error("Event not found");
    
    const eventData = eventDoc.data();
    const joinedUsers = eventData.joinedUsers || [];
    
    if (joinedUsers.includes(userId)) {
      throw new Error("Already joined");
    }
    
    if (joinedUsers.length >= eventData.maxParticipants) {
      throw new Error("Event is full");
    }
    
    await updateDoc(doc(db, "sportEvents", eventId), {
      joinedUsers: [...joinedUsers, userId],
      status: joinedUsers.length + 1 >= eventData.maxParticipants ? "full" : "open",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error joining event:", error);
    throw error;
  }
}

// ==================== Forum Service ====================

/**
 * Create a forum post
 */
export async function createForumPost(userId, postData) {
  if (!db) return;
  try {
    const docRef = await addDoc(collection(db, "forumPosts"), {
      ...postData,
      authorId: userId,
      likes: [],
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

/**
 * Get forum posts
 */
export async function getForumPosts(sortBy = "recent") {
  if (!db) return [];
  try {
    const order = sortBy === "popular" ? "likes" : "createdAt";
    const q = query(
      collection(db, "forumPosts"),
      orderBy(order, "desc"),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

/**
 * Add comment to post
 */
export async function addComment(postId, userId, comment) {
  if (!db) return;
  try {
    await addDoc(collection(db, "forumPosts", postId, "comments"), {
      authorId: userId,
      content: comment,
      createdAt: serverTimestamp(),
    });
    
    // Update comment count
    const postDoc = await getDoc(doc(db, "forumPosts", postId));
    if (postDoc.exists()) {
      await updateDoc(doc(db, "forumPosts", postId), {
        commentsCount: (postDoc.data().commentsCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

// ==================== Chat Service ====================

/**
 * Get or create chat between two users
 */
export async function getOrCreateChat(userId1, userId2) {
  if (!db) return null;
  try {
    // Check if chat exists
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId1)
    );
    const snapshot = await getDocs(q);
    
    for (const chatDoc of snapshot.docs) {
      const chatData = chatDoc.data();
      if (chatData.participants.includes(userId2)) {
        return { id: chatDoc.id, ...chatData };
      }
    }
    
    // Create new chat
    const docRef = await addDoc(collection(db, "chats"), {
      participants: [userId1, userId2],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return { id: docRef.id, participants: [userId1, userId2] };
  } catch (error) {
    console.error("Error getting/creating chat:", error);
    return null;
  }
}

/**
 * Send message in chat
 */
export async function sendMessage(chatId, userId, message) {
  if (!db) return;
  try {
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: userId,
      content: message,
      createdAt: serverTimestamp(),
    });
    
    await updateDoc(doc(db, "chats", chatId), {
      updatedAt: serverTimestamp(),
      lastMessage: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Subscribe to chat messages
 */
export function subscribeToChat(chatId, callback) {
  if (!db) return () => {};
  
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
}

// ==================== Workout Service ====================

/**
 * Save a generated workout
 */
export async function saveWorkout(userId, workoutData) {
  if (!db) return;
  try {
    const docRef = await addDoc(collection(db, "workouts"), {
      ...workoutData,
      userId,
      savedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving workout:", error);
    throw error;
  }
}

/**
 * Get user's saved workouts
 */
export async function getUserWorkouts(userId) {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((left, right) => getSortableTime(right.savedAt) - getSortableTime(left.savedAt));
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return [];
  }
}

// ==================== Stats Service ====================

/**
 * Save workout session
 */
export async function saveWorkoutSession(userId, sessionData) {
  if (!db) return;
  try {
    const docRef = await addDoc(collection(db, "workoutSessions"), {
      ...sessionData,
      userId,
      completedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
}

/**
 * Get workout statistics
 */
export async function getUserStats(userId, _timeRange = "month") {
  if (!db) return null;
  try {
    void _timeRange;
    const q = query(
      collection(db, "workoutSessions"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate stats
    const stats = {
      totalWorkouts: sessions.length,
      totalDuration: sessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      totalCalories: sessions.reduce((acc, s) => acc + (s.calories || 0), 0),
      averageDuration: 0,
    };
    
    if (sessions.length > 0) {
      stats.averageDuration = Math.round(stats.totalDuration / sessions.length);
    }
    
    return stats;
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

const firebaseService = {
  // User
  getUserProfile,
  saveUserProfile,
  updateUserPreferences,
  
  // Availability Slots
  createAvailabilitySlot,
  getAvailabilitySlots,
  getUserAvailabilitySlots,
  deleteAvailabilitySlot,
  joinAvailabilitySlot,
  
  // Sport Events
  createSportEvent,
  getSportEvents,
  joinSportEvent,
  
  // Forum
  createForumPost,
  getForumPosts,
  addComment,
  
  // Chat
  getOrCreateChat,
  sendMessage,
  subscribeToChat,
  
  // Workouts
  saveWorkout,
  getUserWorkouts,
  
  // Stats
  saveWorkoutSession,
  getUserStats,
};

export default firebaseService;
