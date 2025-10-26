import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";

// Type definitions matching your schema
export interface User {
  user_id: string;
  display_name: string;
  email: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Conversation {
  conversation_id: string;
  user_id: string;
  topic: string;
  started_at: Timestamp;
  status: "active" | "closed";
}

export interface Message {
  message_id: string;
  conversation_id: string;
  sender: "user" | "assistant" | "tool";
  content: string;
  created_at: Timestamp;
}

// Collection names
const COLLECTIONS = {
  USERS: "users",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
};

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Create or update a user in Firestore
 */
export const createOrUpdateUser = async (
  userId: string,
  displayName: string,
  email: string
): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        display_name: displayName,
        email: email,
        updated_at: serverTimestamp(),
      });
    } else {
      // Create new user
      await setDoc(userRef, {
        user_id: userId,
        display_name: displayName,
        email: email,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
};

/**
 * Get a user by ID
 */
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUser = async (
  userId: string,
  updates: Partial<Omit<User, "user_id" | "created_at">>
): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// ============================================
// CONVERSATION OPERATIONS
// ============================================

/**
 * Create a new conversation
 */
export const createConversation = async (
  userId: string,
  topic: string
): Promise<string> => {
  try {
    const conversationRef = await addDoc(
      collection(db, COLLECTIONS.CONVERSATIONS),
      {
        user_id: userId,
        topic: topic,
        started_at: serverTimestamp(),
        status: "active",
      }
    );

    // Update the document with its own ID
    await updateDoc(conversationRef, {
      conversation_id: conversationRef.id,
    });

    return conversationRef.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

/**
 * Get a conversation by ID
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation | null> => {
  try {
    const conversationRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      return conversationSnap.data() as Conversation;
    }
    return null;
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw error;
  }
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (
  userId: string,
  maxResults: number = 50
): Promise<Conversation[]> => {
  try {
    const conversationsRef = collection(db, COLLECTIONS.CONVERSATIONS);
    const q = query(
      conversationsRef,
      where("user_id", "==", userId),
      orderBy("started_at", "desc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as Conversation);
  } catch (error) {
    console.error("Error getting user conversations:", error);
    throw error;
  }
};

/**
 * Update conversation status
 */
export const updateConversationStatus = async (
  conversationId: string,
  status: "active" | "closed"
): Promise<void> => {
  try {
    const conversationRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
    await updateDoc(conversationRef, {
      status: status,
    });
  } catch (error) {
    console.error("Error updating conversation status:", error);
    throw error;
  }
};

/**
 * Update conversation topic
 */
export const updateConversationTopic = async (
  conversationId: string,
  topic: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
    await updateDoc(conversationRef, {
      topic: topic,
    });
  } catch (error) {
    console.error("Error updating conversation topic:", error);
    throw error;
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
    await deleteDoc(conversationRef);
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
};

// ============================================
// MESSAGE OPERATIONS
// ============================================

/**
 * Create a new message
 */
export const createMessage = async (
  conversationId: string,
  sender: "user" | "assistant" | "tool",
  content: string
): Promise<string> => {
  try {
    const messageRef = await addDoc(collection(db, COLLECTIONS.MESSAGES), {
      conversation_id: conversationId,
      sender: sender,
      content: content,
      created_at: serverTimestamp(),
    });

    // Update the document with its own ID
    await updateDoc(messageRef, {
      message_id: messageRef.id,
    });

    return messageRef.id;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
};

/**
 * Get a message by ID
 */
export const getMessage = async (
  messageId: string
): Promise<Message | null> => {
  try {
    const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    const messageSnap = await getDoc(messageRef);

    if (messageSnap.exists()) {
      return messageSnap.data() as Message;
    }
    return null;
  } catch (error) {
    console.error("Error getting message:", error);
    throw error;
  }
};

/**
 * Get all messages for a conversation
 */
export const getConversationMessages = async (
  conversationId: string,
  maxResults: number = 100
): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const q = query(
      messagesRef,
      where("conversation_id", "==", conversationId),
      orderBy("created_at", "asc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as Message);
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    throw error;
  }
};

/**
 * Update message content
 */
export const updateMessage = async (
  messageId: string,
  content: string
): Promise<void> => {
  try {
    const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    await updateDoc(messageRef, {
      content: content,
    });
  } catch (error) {
    console.error("Error updating message:", error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

/**
 * Delete all messages in a conversation
 */
export const deleteConversationMessages = async (
  conversationId: string
): Promise<void> => {
  try {
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const q = query(
      messagesRef,
      where("conversation_id", "==", conversationId)
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting conversation messages:", error);
    throw error;
  }
};
