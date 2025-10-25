"use client";

import { useChat } from "@/hooks/useChat";
import { useState } from "react";

export default function ChatComponent() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    currentResponse,
  } = useChat({
    model: "anthropic:claude-sonnet-4-5",
    temperature: 0.7,
  });

  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="border rounded-lg p-4 mb-4 h-96 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-2 ${message.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block p-2 rounded ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && currentResponse && (
          <div className="mb-2 text-left">
            <div className="inline-block p-2 rounded bg-gray-200 text-black">
              {currentResponse}
              <span className="animate-pulse">|</span>
            </div>
          </div>
        )}

        {error && <div className="text-red-500 mb-2">Error: {error}</div>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
        <button
          type="button"
          onClick={clearMessages}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Clear
        </button>
      </form>
    </div>
  );
}
