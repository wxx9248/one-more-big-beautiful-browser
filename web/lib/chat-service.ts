// /web/src/lib/chat-service.ts
import { ChatRequest, ChatMessage } from "@/types/chat";

export class ChatService {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  /**
   * Stream chat messages using Server-Sent Events
   */
  async streamChat(
    request: ChatRequest,
    onToken: (token: string) => void,
    onError: (error: string) => void,
    onDone: () => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        // Handle non-streaming error responses
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // If we can't parse JSON, use the text response
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        onError(errorMessage);
        return;
      }

      // Check if response is streaming
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("text/event-stream")) {
        onError("Expected streaming response but got: " + contentType);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim(); // Remove "data: " prefix and trim

            if (data === "[DONE]") {
              onDone();
              return;
            }

            if (data) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.token) {
                  onToken(parsed.token);
                } else if (parsed.error) {
                  onError(parsed.error);
                  return;
                }
              } catch (e) {
                console.warn("Failed to parse SSE data:", data, e);
                // Continue processing other lines
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream chat error:", error);
      onError(error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Simple non-streaming chat (for testing)
   */
  async chat(request: ChatRequest): Promise<string> {
    return new Promise((resolve, reject) => {
      let fullResponse = "";

      this.streamChat(
        request,
        (token) => {
          fullResponse += token;
        },
        (error) => {
          reject(new Error(error));
        },
        () => {
          resolve(fullResponse);
        }
      );
    });
  }
}

// Export a default instance
export const chatService = new ChatService();
