/**
 * Conversation session manager
 * - Defines a lightweight, in-memory conversation for the current side panel session
 * - A new conversation starts when the side panel opens (first access)
 * - Conversation ends when the side panel unmounts/closes
 */

export interface ConversationInfo {
  id: string;
  startedAt: number; // epoch ms
}

let currentConversation: ConversationInfo | null = null;

/**
 * Get or create the current conversation info.
 * If none exists, a new one is created.
 */
export function getCurrentConversation(): ConversationInfo {
  if (!currentConversation) {
    currentConversation = {
      id: generateConversationId(),
      startedAt: Date.now(),
    };
  }
  return currentConversation;
}

/**
 * Explicitly end the current conversation (e.g., when side panel closes).
 */
export function endCurrentConversation(): void {
  currentConversation = null;
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
