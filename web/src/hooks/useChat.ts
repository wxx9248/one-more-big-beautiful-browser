// /web/src/hooks/useChat.ts - PRODUCTION READY
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { ChatService } from "@/lib/chat-service";
import { ChatMessage, ChatRequest } from "@/types/chat";

export interface UseChatOptions {
  model?: string;
  temperature?: number;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  currentResponse: string;
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState("");

  // Refs for stable references
  const fullResponseRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatServiceRef = useRef(new ChatService());

  // Debounced UI update for better performance
  const updateCurrentResponse = useMemo(
    () =>
      debounce((response: string) => {
        setCurrentResponse(response);
      }, 16), // ~60fps
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;

      // Cleanup previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const userMessage: ChatMessage = { role: "user", content };
      const newMessages = [...messages, userMessage];

      setMessages(newMessages);
      setIsLoading(true);
      setError(null);
      setCurrentResponse("");
      fullResponseRef.current = "";

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const request: ChatRequest = {
        messages: newMessages,
        model: options.model,
        temperature: options.temperature,
      };

      try {
        await chatServiceRef.current.streamChat(
          request,
          (token) => {
            fullResponseRef.current += token;
            updateCurrentResponse(fullResponseRef.current);
          },
          (error) => {
            console.error("Streaming error:", error);
            setError(`Streaming error: ${error}`);
            setIsLoading(false);
          },
          () => {
            const assistantMessage: ChatMessage = {
              role: "assistant",
              content: fullResponseRef.current,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setCurrentResponse("");
            setIsLoading(false);
          }
        );
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Request error:", err);
          setError(err.message);
          setIsLoading(false);
        }
      }
    },
    [
      messages,
      isLoading,
      options.model,
      options.temperature,
      updateCurrentResponse,
    ]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse("");
    setError(null);
    fullResponseRef.current = "";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    currentResponse,
  };
}
