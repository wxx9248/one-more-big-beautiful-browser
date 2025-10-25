import { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { ArrowUp } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "You",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed top-0 left-0 h-screen w-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Chat Room</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
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
                <span className="text-xs font-semibold">{message.sender}</span>
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pb-2 px-2">
        <div className="flex rounded-md border min-h-10 flex-col">
          <Textarea
            placeholder="Type a message..."
            className="rounded-none mt-2 resize-none text-sm px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 border-0 shadow-none min-h-10 h-auto"
          />
          <div className="flex gap-2 px-1.5 pb-1.5 items-center justify-end">
            <Button className="rounded-full h-6 w-6 flex items-center justify-center cursor-pointer">
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
