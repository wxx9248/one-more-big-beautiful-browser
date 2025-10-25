export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}

export interface ChatToken {
  token: string;
}

export interface ChatError {
  error: string;
}

export interface ChatDone {
  done: boolean;
}
