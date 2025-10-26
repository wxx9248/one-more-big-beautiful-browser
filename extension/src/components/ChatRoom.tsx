import { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { ArrowUp, Loader2 } from "lucide-react";
import { MessageType, type AuthState } from "@/src/types/auth";
import { browser } from "wxt/browser";
import { streamChat } from "@/src/lib/langgraph";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isCollapsible?: boolean;
  isExpanded?: boolean;
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

  useEffect(() => {
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

  return (
    <div className="fixed top-0 left-0 h-screen w-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Chat Room</h1>
          {authState.isAuthenticated && (
            <p className="text-xs text-green-600">Authenticated</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>
          Log Out
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mx-4 mt-2">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) =>
          message.sender === "System" ? (
            message.isCollapsible ? (
              // Collapsible intermediate text
              <div key={message.id} className="my-1">
                <button
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
            ) : (
              // System messages - simple text without card
              <div
                key={message.id}
                className="flex items-center gap-2 text-muted-foreground text-xs py-1"
              >
                <span className="opacity-50">{message.content}</span>
                {message.isStreaming && (
                  <span className="animate-pulse">...</span>
                )}
              </div>
            )
          ) : (
            // Regular messages with card
            <Card
              key={message.id}
              className={`max-w-[80%] ${
                message.sender === "You"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto"
              }`}
            >
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    {message.sender}
                  </span>
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">
                  {message.content}
                  {message.isStreaming && (
                    <span className="animate-pulse ml-1">|</span>
                  )}
                </p>
              </div>
            </Card>
          ),
        )}
        <div ref={messagesEndRef} />
      </div>

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
