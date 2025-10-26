import { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { ArrowUp, Loader2, Wrench } from "lucide-react";
import { MessageType, type AuthState } from "@/src/types/auth";
import { browser } from "wxt/browser";
import { streamGraph } from "@/src/lib/langgraph";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isToolCall?: boolean;
  toolName?: string;
}

interface ChatRoomProps {
  onLogout: () => void;
}

export function ChatRoom({ onLogout }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "System",
      content: "Welcome to the chat room!",
      timestamp: new Date(),
    },
  ]);
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
    let followupMessageId: string | null = null;

    try {
      console.log("[ChatRoom] Starting LangGraph stream for:", userMessage);

      // Stream from LangGraph
      for await (const chunk of streamGraph(userMessage)) {
        console.log("[ChatRoom] Received chunk:", chunk);

        if (chunk.type === "llm") {
          // Initial LLM response - update assistant message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: chunk.content, isStreaming: true }
                : msg,
            ),
          );
        } else if (chunk.type === "llm_followup") {
          // Follow-up response after tool execution - create new message
          if (!followupMessageId) {
            followupMessageId = `${Date.now()}-followup`;
            setMessages((prev) => [
              ...prev,
              {
                id: followupMessageId!,
                sender: "Assistant",
                content: chunk.content,
                timestamp: new Date(),
                isStreaming: true,
              },
            ]);
          } else {
            // Update existing follow-up message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === followupMessageId
                  ? { ...msg, content: chunk.content, isStreaming: true }
                  : msg,
              ),
            );
          }
        } else if (chunk.type === "tool_call") {
          // Tool execution started
          try {
            const toolData = JSON.parse(chunk.content);
            const toolName = toolData.name || "unknown_tool";

            // Add tool execution message
            const toolMessageId = `${Date.now()}-tool`;
            setMessages((prev) => [
              ...prev,
              {
                id: toolMessageId,
                sender: "System",
                content: `🔧 Using tool: ${toolName}`,
                timestamp: new Date(),
                isToolCall: true,
                toolName,
              },
            ]);
          } catch (e) {
            console.warn("Failed to parse tool data:", chunk.content);
          }
        } else if (chunk.type === "tool_result") {
          // Tool execution completed
          try {
            const resultData = JSON.parse(chunk.content);
            console.log(
              `[ChatRoom] Tool ${resultData.name} result:`,
              resultData.result,
            );
          } catch (e) {
            console.warn("Failed to parse tool result:", chunk.content);
          }
        } else if (chunk.type === "tool_error") {
          // Tool execution failed
          try {
            const errorData = JSON.parse(chunk.content);
            setMessages((prev) => [
              ...prev,
              {
                id: `${Date.now()}-error`,
                sender: "System",
                content: `❌ Tool error: ${errorData.error}`,
                timestamp: new Date(),
              },
            ]);
          } catch (e) {
            console.warn("Failed to parse tool error:", chunk.content);
          }
        }
      }

      // Mark streaming as complete for both original and follow-up messages
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId || msg.id === followupMessageId
            ? { ...msg, isStreaming: false }
            : msg,
        ),
      );
    } catch (error) {
      console.error("[ChatRoom] LangGraph stream error:", error);
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
    };
  }, []);

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
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`max-w-[80%] ${
              message.sender === "You"
                ? "ml-auto bg-primary text-primary-foreground"
                : message.isToolCall
                  ? "mx-auto bg-blue-50 border-blue-200"
                  : "mr-auto"
            }`}
          >
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold flex items-center gap-1">
                  {message.isToolCall && <Wrench className="w-3 h-3" />}
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
        ))}
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
