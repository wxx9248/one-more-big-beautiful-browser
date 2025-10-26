# Firebase Library Documentation

This directory contains all Firebase-related code for authentication and database operations.

## 📁 File Structure

```
lib/firebase/
├── config.ts              # Firebase initialization & config
├── auth-service.ts        # Authentication functions
├── database-service.ts    # Firestore CRUD operations
├── auth-context.tsx       # React context for auth state
├── index.ts              # Centralized exports (use this!)
└── README.md             # This file
```

## 🎯 Quick Import Guide

### ✅ Recommended: Use index.ts for all imports

```typescript
// Import everything from one place
import {
  useAuth, // Hook to get current user
  signInWithGoogle, // Google sign-in
  signInWithEmail, // Email/password sign-in
  signUpWithEmail, // Email/password signup
  createConversation, // Create conversation
  createMessage, // Create message
  getUserConversations, // Get user's conversations
  getConversationMessages, // Get conversation messages
  type User, // User type
  type Conversation, // Conversation type
  type Message, // Message type
} from "@/lib/firebase";
```

## 📚 Available Functions

### Authentication

#### `useAuth()` - React Hook

Get current authentication state (use in components)

```typescript
const { user, loading } = useAuth();

if (loading) return <Spinner />;
if (!user) return <LoginPrompt />;
return <Dashboard user={user} />;
```

#### `signUpWithEmail(email, password, displayName)`

Create new account with email/password

```typescript
await signUpWithEmail("user@example.com", "password123", "John Doe");
```

#### `signInWithEmail(email, password)`

Sign in with email/password

```typescript
await signInWithEmail("user@example.com", "password123");
```

#### `signInWithGoogle()`

Sign in with Google (opens popup)

```typescript
await signInWithGoogle();
```

#### `signOutUser()`

Sign out current user

```typescript
await signOutUser();
```

#### `getCurrentUser()`

Get current user (non-reactive)

```typescript
const user = getCurrentUser();
console.log(user?.email);
```

#### `getIdToken()`

Get Firebase ID token for API calls

```typescript
const token = await getIdToken();
// Use in API request headers
```

---

### Database - Users

#### `createOrUpdateUser(userId, displayName, email)`

Create or update user in Firestore
(Called automatically by AuthProvider)

```typescript
await createOrUpdateUser(user.uid, "John Doe", "john@example.com");
```

#### `getUser(userId)`

Get user data from Firestore

```typescript
const userData = await getUser(user.uid);
console.log(userData?.display_name);
```

#### `updateUser(userId, updates)`

Update user profile

```typescript
await updateUser(user.uid, {
  display_name: "Jane Doe",
  email: "jane@example.com",
});
```

---

### Database - Conversations

#### `createConversation(userId, topic)`

Create new conversation

```typescript
const conversationId = await createConversation(
  user.uid,
  "My First Conversation"
);
```

#### `getConversation(conversationId)`

Get conversation by ID

```typescript
const conversation = await getConversation(conversationId);
console.log(conversation?.topic);
```

#### `getUserConversations(userId, maxResults?)`

Get all conversations for a user

```typescript
const conversations = await getUserConversations(user.uid);
// or limit results
const recent = await getUserConversations(user.uid, 10);
```

#### `updateConversationStatus(conversationId, status)`

Update conversation status

```typescript
await updateConversationStatus(conversationId, "closed");
// or
await updateConversationStatus(conversationId, "active");
```

#### `updateConversationTopic(conversationId, topic)`

Update conversation topic

```typescript
await updateConversationTopic(conversationId, "New Topic");
```

#### `deleteConversation(conversationId)`

Delete conversation

```typescript
await deleteConversation(conversationId);
```

---

### Database - Messages

#### `createMessage(conversationId, sender, content)`

Create new message

```typescript
await createMessage(
  conversationId,
  "user", // "user" | "assistant" | "tool"
  "Hello, how are you?"
);
```

#### `getMessage(messageId)`

Get message by ID

```typescript
const message = await getMessage(messageId);
console.log(message?.content);
```

#### `getConversationMessages(conversationId, maxResults?)`

Get all messages in a conversation

```typescript
const messages = await getConversationMessages(conversationId);
// or limit results
const recent = await getConversationMessages(conversationId, 50);
```

#### `updateMessage(messageId, content)`

Update message content

```typescript
await updateMessage(messageId, "Updated message text");
```

#### `deleteMessage(messageId)`

Delete a message

```typescript
await deleteMessage(messageId);
```

#### `deleteConversationMessages(conversationId)`

Delete all messages in a conversation

```typescript
await deleteConversationMessages(conversationId);
```

---

## 🔄 Typical Workflow

### 1. User Signs Up/In

```typescript
// Google sign-in
await signInWithGoogle();
// or email/password
await signUpWithEmail(email, password, name);
```

→ User is automatically created in Firestore by AuthProvider

### 2. Create a Conversation

```typescript
const { user } = useAuth();
const conversationId = await createConversation(user.uid, "Chat Topic");
```

### 3. Add Messages to Conversation

```typescript
// User message
await createMessage(conversationId, "user", "Hello!");

// Assistant response
await createMessage(conversationId, "assistant", "Hi! How can I help?");

// Tool output
await createMessage(conversationId, "tool", "Tool executed successfully");
```

### 4. Retrieve Messages

```typescript
const messages = await getConversationMessages(conversationId);
messages.forEach((msg) => {
  console.log(`${msg.sender}: ${msg.content}`);
});
```

### 5. List User's Conversations

```typescript
const conversations = await getUserConversations(user.uid);
conversations.forEach((conv) => {
  console.log(`${conv.topic} - ${conv.status}`);
});
```

---

## 🎨 React Component Examples

### Protected Route Component

```typescript
"use client";
import { useAuth } from "@/lib/firebase";
import { redirect } from "next/navigation";

export default function ProtectedPage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) redirect("/login");

  return <div>Welcome, {user.displayName}!</div>;
}
```

### Chat Component

```typescript
"use client";
import { useState, useEffect } from "react";
import { useAuth, getConversationMessages, createMessage } from "@/lib/firebase";

export default function ChatComponent({ conversationId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  async function loadMessages() {
    const msgs = await getConversationMessages(conversationId);
    setMessages(msgs);
  }

  async function sendMessage() {
    if (!input.trim()) return;

    await createMessage(conversationId, "user", input);
    setInput("");
    await loadMessages(); // Refresh messages
  }

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.message_id} className={msg.sender}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

### Conversation List Component

```typescript
"use client";
import { useState, useEffect } from "react";
import { useAuth, getUserConversations, createConversation } from "@/lib/firebase";

export default function ConversationList() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  async function loadConversations() {
    const convs = await getUserConversations(user.uid);
    setConversations(convs);
  }

  async function newConversation() {
    await createConversation(user.uid, "New Chat");
    await loadConversations();
  }

  return (
    <div>
      <button onClick={newConversation}>New Chat</button>
      {conversations.map(conv => (
        <div key={conv.conversation_id}>
          {conv.topic} ({conv.status})
        </div>
      ))}
    </div>
  );
}
```

---

## 🔐 Security Notes

1. **Authentication Required**: All database operations require the user to be authenticated
2. **User Isolation**: Users can only access their own data
3. **Firebase Security Rules**: Set up proper rules in Firebase Console
4. **Environment Variables**: Never commit `.env.local` to git

---

## 📖 Type Definitions

### User

```typescript
interface User {
  user_id: string;
  display_name: string;
  email: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Conversation

```typescript
interface Conversation {
  conversation_id: string;
  user_id: string;
  topic: string;
  started_at: Timestamp;
  status: "active" | "closed";
}
```

### Message

```typescript
interface Message {
  message_id: string;
  conversation_id: string;
  sender: "user" | "assistant" | "tool";
  content: string;
  created_at: Timestamp;
}
```

---

## ❓ Common Questions

**Q: How do I get the current user?**

```typescript
const { user } = useAuth(); // In React components
// or
const user = getCurrentUser(); // Outside React
```

**Q: How do I check if user is logged in?**

```typescript
const { user, loading } = useAuth();
if (loading) return <Loading />;
if (!user) return <LoginPage />;
```

**Q: How do I sign out?**

```typescript
import { signOutUser } from "@/lib/firebase";
await signOutUser();
```

**Q: How do I handle errors?**

```typescript
try {
  await createConversation(user.uid, "Topic");
} catch (error) {
  console.error("Error creating conversation:", error);
  // Show error to user
}
```

---

## 🔗 Related Documentation

- `../../../FIREBASE_SETUP_GUIDE.md` - Firebase Console setup
- `../../../QUICKSTART.md` - Quick start guide
- `../../../IMPLEMENTATION_SUMMARY.md` - Implementation overview

---

**Happy coding! 🚀**
