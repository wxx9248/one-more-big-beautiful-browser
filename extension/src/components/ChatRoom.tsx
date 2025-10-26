import { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { ArrowUp, Loader2, PlusIcon, SettingsIcon } from "lucide-react";
import { MessageType, type AuthState } from "@/src/types/auth";
import { browser } from "wxt/browser";
import { streamChat } from "@/src/lib/langgraph";
import {
  getCurrentConversation,
  endCurrentConversation,
} from "@/src/lib/conversation";

import "@/src/styles/messages.css";
import { marked } from "marked";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "../lib/utils";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  imageUrl?: string; // For displaying screenshots
}

interface ChatRoomProps {
  onLogout: () => void;
}

export function ChatRoom({ onLogout }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Ensure a conversation is started for this side panel session
    getCurrentConversation();
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const response = await browser.runtime.sendMessage({
        type: MessageType.GET_AUTH_STATE,
      });
      setAuthState(response);
    } catch (error) {
      console.error("Failed to load auth state:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isLoading) return;

    // Check if user is authenticated
    if (!authState.isAuthenticated || !authState.token) {
      setError("Please log in to send messages");
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "You",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    // Create assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      sender: "Assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      await streamChatMessage(inputValue, assistantMessageId);
    } catch (error) {
      console.error("Chat error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send message",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const streamChatMessage = async (
    userMessage: string,
    assistantMessageId: string,
  ) => {
    try {
      // Build message history for LangGraph
      const { HumanMessage, AIMessage } = await import(
        "@langchain/core/messages"
      );

      // Convert message history to LangChain format
      const messageHistory = messages
        .filter((msg) => msg.sender !== "System") // Exclude system messages
        .map((msg) => {
          if (msg.sender === "You") {
            return new HumanMessage(msg.content);
          } else {
            return new AIMessage(msg.content);
          }
        });

      // Add current user message
      messageHistory.push(new HumanMessage(userMessage));

      // Use streamChat for token-level streaming with LangGraph
      const stream = streamChat(messageHistory);
      let currentToolMessageId: string | null = null;

      for await (const chunk of stream) {
        if (chunk.type === "token") {
          // Real-time token streaming from first LLM call
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: chunk.content, isStreaming: true }
                : msg,
            ),
          );
        } else if (chunk.type === "intermediate_text") {
          // Intermediate LLM output - create collapsible system message
          const intermediateId = (Date.now() + Math.random()).toString();
          setMessages((prev) => [
            ...prev,
            {
              id: intermediateId,
              sender: "System",
              content: chunk.content,
              timestamp: new Date(),
              isCollapsible: true,
              isExpanded: false,
            },
          ]);
        } else if (chunk.type === "final_text") {
          // Final LLM output after tools - create new assistant message
          const finalMessageId = (Date.now() + Math.random()).toString();
          setMessages((prev) => [
            ...prev,
            {
              id: finalMessageId,
              sender: "Assistant",
              content: chunk.content,
              timestamp: new Date(),
              isStreaming: false,
            },
          ]);
        } else if (chunk.type === "tool_start") {
          // Tool execution starting - create a new message for tool status
          const toolMessageId = (Date.now() + Math.random()).toString();
          currentToolMessageId = toolMessageId;

          setMessages((prev) => [
            ...prev,
            {
              id: toolMessageId,
              sender: "System",
              content: `🔧 ${chunk.content}`,
              timestamp: new Date(),
              isStreaming: true,
            },
          ]);
        } else if (chunk.type === "tool_complete") {
          // Tool execution completed - update the tool message
          if (currentToolMessageId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === currentToolMessageId
                  ? {
                      ...msg,
                      content: `✅ ${chunk.content}`,
                      isStreaming: false,
                    }
                  : msg,
              ),
            );
            currentToolMessageId = null;
          }

          // Check if the tool result contains an image (screenshot)
          try {
            console.log("[ChatRoom] Raw toolResult:", chunk.toolResult);
            if (!chunk.toolResult) {
              console.warn("[ChatRoom] No toolResult in chunk");
              return;
            }

            const toolResult = JSON.parse(chunk.toolResult);
            console.log("[ChatRoom] Parsed toolResult:", toolResult);

            if (
              toolResult?.dataUrl &&
              toolResult.dataUrl.startsWith("data:image")
            ) {
              console.log(
                "[ChatRoom] Found image dataUrl, creating screenshot message",
              );
              // Display the screenshot in chat
              const screenshotMessageId = `${Date.now()}-screenshot`;
              setMessages((prev) => [
                ...prev,
                {
                  id: screenshotMessageId,
                  sender: "System",
                  content: toolResult.message || "Screenshot captured",
                  timestamp: new Date(),
                  imageUrl: toolResult.dataUrl,
                },
              ]);
            } else {
              console.log(
                "[ChatRoom] No dataUrl found in toolResult or not an image",
              );
            }
          } catch (e) {
            console.error(
              "[ChatRoom] Failed to parse tool result for image display:",
              e,
            );
            console.error("[ChatRoom] Raw chunk.toolResult:", chunk.toolResult);
          }
        } else if (chunk.type === "complete") {
          // Streaming complete, mark as finished
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg,
            ),
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted");
        return;
      }
      throw error;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // End the conversation when side panel closes/unmounts
      endCurrentConversation();
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 h-screen w-screen bg-background flex flex-col">
      {/* Header */}
      <div className="h-8 p-1 px-2 flex items-center justify-start">
        <div className="flex-1" />
        <div className="flex items-center gap-0">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer hover:bg-muted rounded-sm h-6 w-6"
          >
            <PlusIcon className="size-4 stroke-[1.5]" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer hover:bg-muted rounded-sm h-6 w-6"
              >
                <SettingsIcon className="size-4 stroke-[1.5]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mx-2 p-1 px-1 min-w-36">
              <DropdownMenuItem className="text-xs">Settings</DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onClick={onLogout}>
                <span className="text-destructive-foreground hover:text-destructive">
                  Logout
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mx-4 mt-2">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Messages Area */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 pb-8 flex flex-col gap-0">
          {messages.map((message, index) => {
            if (message.sender === "You") {
              return (
                <div
                  key={message.id}
                  className={cn(
                    "w-full rounded-sm border border-border px-2 py-1 bg-muted mb-2",
                    index === 0 ? "mt-1" : "mt-4",
                  )}
                >
                  <p>{message.content}</p>
                </div>
              );
            } else if (message.sender === "Assistant") {
              // Parse markdown to HTML
              const htmlContent = marked.parse(message.content) as string;

              return (
                <div key={message.id} className="flex justify-start">
                  <div className="bg-background text-secondary-foreground px-2 py-1 rounded-none prose prose-sm max-w-none">
                    <div
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                      className="ai-message"
                    />
                    {message.isStreaming && (
                      <span className="animate-pulse ml-1">|</span>
                    )}
                  </div>
                </div>
              );
            } else if (message.sender === "System") {
              if (message.isCollapsible) {
                // Collapsible intermediate text
                return (
                  <div key={message.id} className="my-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === message.id
                              ? { ...msg, isExpanded: !msg.isExpanded }
                              : msg,
                          ),
                        );
                      }}
                      className="flex items-center gap-2 text-muted-foreground text-xs py-1 hover:text-foreground transition-colors"
                    >
                      <span className="opacity-50">
                        {message.isExpanded ? "▼" : "▶"} Intermediate response
                      </span>
                    </button>
                    {message.isExpanded && (
                      <div className="mt-1 ml-4 text-xs text-muted-foreground opacity-70 border-l-2 border-muted pl-3">
                        {message.content}
                      </div>
                    )}
                  </div>
                );
              } else if (message.imageUrl) {
                // System messages with images
                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="bg-background text-secondary-foreground px-2 py-1 rounded-none">
                      <p>{message.content}</p>
                      <img
                        src={message.imageUrl}
                        alt="Screenshot"
                        className="mt-2 rounded border max-w-full h-auto"
                      />
                    </div>
                  </div>
                );
              } else {
                // System messages without images
                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="bg-background text-secondary-foreground px-2 py-1 rounded-none opacity-50">
                      <p>{message.content}</p>
                      {message.isStreaming && (
                        <span className="animate-pulse">...</span>
                      )}
                    </div>
                  </div>
                );
              }
            }
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area */}
      <div className="pb-2 px-2">
        <div className="flex rounded-md border min-h-10 flex-col">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            disabled={!authState.isAuthenticated || isLoading}
            className="rounded-none mt-2 resize-none text-sm px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 border-0 shadow-none min-h-10 h-auto"
          />
          <div className="flex gap-2 px-1.5 pb-1.5 items-center justify-end">
            <Button
              onClick={handleSendMessage}
              disabled={
                !authState.isAuthenticated || isLoading || !inputValue.trim()
              }
              className="rounded-full h-6 w-6 flex items-center justify-center cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
