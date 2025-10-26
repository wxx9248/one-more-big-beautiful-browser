// Firebase Configuration and Services
// Centralized export file for easy imports

// Firebase config
export { app, auth, db } from "./config";

// Authentication services
export {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  getCurrentUser,
  onAuthStateChange,
  getIdToken,
} from "./auth-service";

// Database services
export {
  // User operations
  createOrUpdateUser,
  getUser,
  updateUser,

  // Conversation operations
  createConversation,
  getConversation,
  getUserConversations,
  updateConversationStatus,
  updateConversationTopic,
  deleteConversation,

  // Message operations
  createMessage,
  getMessage,
  getConversationMessages,
  updateMessage,
  deleteMessage,
  deleteConversationMessages,

  // Type exports
  type User,
  type Conversation,
  type Message,
} from "./database-service";

// Auth context
export { AuthProvider, useAuth } from "./auth-context";
