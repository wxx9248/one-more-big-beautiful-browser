/**
 * LangGraph integration for browser extension using Anthropic
 * Implements an agentic loop: LLM → Tool → LLM with native Anthropic tool calling
 */

import {
  MessagesAnnotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph/web";
import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { browserTools } from "./browser-tools";
import { getAuthToken } from "./tool-messenger";
import { BACKEND_API_URL } from "@/src/config/env";
import type { StructuredToolInterface } from "@langchain/core/tools";

/**
 * Convert LangChain tools to Anthropic tool format
 */
function convertToAnthropicTools(tools: StructuredToolInterface[]): Array<{
  name: string;
  description: string;
  input_schema: any;
}> {
  return tools.map((tool) => {
    // Get the Zod schema and convert it to JSON schema format
    const schema = tool.schema as any;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    // Extract properties from Zod schema
    if (schema && schema._def) {
      // In Zod v4, shape can be either a function or an object
      const shape =
        typeof schema._def.shape === "function"
          ? schema._def.shape()
          : schema._def.shape;

      if (shape && typeof shape === "object") {
        for (const [key, value] of Object.entries(shape)) {
          const zodField = value as any;

          // Determine type
          let type = "string";
          if (zodField._def) {
            const typeName = zodField._def.typeName;
            if (typeName === "ZodString") type = "string";
            else if (typeName === "ZodNumber") type = "number";
            else if (typeName === "ZodBoolean") type = "boolean";
            else if (typeName === "ZodOptional") {
              // Handle optional fields
              const innerType = zodField._def.innerType?._def?.typeName;
              if (innerType === "ZodString") type = "string";
              else if (innerType === "ZodNumber") type = "number";
              else if (innerType === "ZodBoolean") type = "boolean";
            } else if (typeName === "ZodDefault") {
              // Handle default fields
              const innerType = zodField._def.innerType?._def?.typeName;
              if (innerType === "ZodString") type = "string";
              else if (innerType === "ZodNumber") type = "number";
              else if (innerType === "ZodBoolean") type = "boolean";
            }
          }

          properties[key] = {
            type,
            description:
              zodField._def?.description || zodField.description || "",
          };

          // Check if field is required (not optional and not default)
          const typeName = zodField._def?.typeName;
          if (
            typeName &&
            !typeName.includes("Optional") &&
            !typeName.includes("Default")
          ) {
            required.push(key);
          }
        }
      }
    }

    return {
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: "object",
        properties,
        required,
      },
    };
  });
}

/**
 * Create a map of tool names to tool instances for easy lookup
 */
const toolMap = new Map(browserTools.map((tool) => [tool.name, tool]));

/**
 * Convert LangChain messages to Anthropic format
 */
function convertToAnthropicMessages(
  messages: BaseMessage[],
): Array<{ role: string; content: any }> {
  const anthropicMessages: Array<{ role: string; content: any }> = [];

  for (const msg of messages) {
    if (msg instanceof HumanMessage) {
      anthropicMessages.push({
        role: "user",
        content:
          typeof msg.content === "string" ? msg.content : String(msg.content),
      });
    } else if (msg instanceof AIMessage) {
      // Handle AI messages with tool calls
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const content: any[] = [];

        // Add text content if present
        if (msg.content) {
          content.push({
            type: "text",
            text:
              typeof msg.content === "string"
                ? msg.content
                : String(msg.content),
          });
        }

        // Add tool use blocks
        for (const toolCall of msg.tool_calls) {
          content.push({
            type: "tool_use",
            id: toolCall.id || `call_${Date.now()}`,
            name: toolCall.name,
            input: toolCall.args || {},
          });
        }

        anthropicMessages.push({
          role: "assistant",
          content,
        });
      } else {
        // Regular AI message without tool calls
        anthropicMessages.push({
          role: "assistant",
          content:
            typeof msg.content === "string" ? msg.content : String(msg.content),
        });
      }
    } else if (msg instanceof ToolMessage) {
      // Tool result - Anthropic expects these as user messages with tool_result type
      anthropicMessages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: msg.tool_call_id || msg.name || "unknown",
            content:
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content),
          },
        ],
      });
    }
  }

  return anthropicMessages;
}

/**
 * LLM Node - Calls web API with streaming and emits tokens via config.writer
 */
async function llmNode(
  state: typeof MessagesAnnotation.State,
  config?: { writer?: (chunk: string) => void },
): Promise<{ messages: BaseMessage[] }> {
  const messages = state.messages;

  try {
    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      throw new Error("No auth token available");
    }

    // Convert messages to Anthropic format
    const anthropicMessages = convertToAnthropicMessages(messages);

    console.log("[LangGraph] Calling Anthropic streaming API via web proxy");
    console.log("[LangGraph] Message count:", anthropicMessages.length);

    // Convert LangChain tools to Anthropic format
    const anthropicTools = convertToAnthropicTools(browserTools);

    // Call web API with streaming (which will add API key and forward to Anthropic)
    const response = await fetch(BACKEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: anthropicMessages,
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        temperature: 1,
        tools: anthropicTools,
        stream: true,
        system: `You are a helpful AI assistant with access to browser automation tools. You can interact with web pages by:
- Getting information about the current page (getCurrentTabInfo, getPageContent)
- Finding and interacting with elements (findElements, clickElement, fillInput, scrollToElement)
- Managing tabs (getAllTabs, switchToTab)
- Capturing screenshots (captureScreenshot)

When the user asks you to interact with a page, use the appropriate tools. Always get page content or find elements before trying to click or fill them. Be proactive and helpful.`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Web API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let textContent = "";
    const toolCalls: Array<{
      name: string;
      args: Record<string, any>;
      id: string;
    }> = [];
    let currentToolCall: any = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);

              if (event.type === "content_block_start") {
                if (event.content_block?.type === "text") {
                  // Text block started
                } else if (event.content_block?.type === "tool_use") {
                  currentToolCall = {
                    name: event.content_block.name,
                    id: event.content_block.id,
                    args: {},
                  };
                }
              } else if (event.type === "content_block_delta") {
                if (event.delta?.type === "text_delta") {
                  const delta = event.delta.text;
                  textContent += delta;
                  // Stream token using config.writer
                  if (config?.writer) {
                    config.writer(delta);
                  }
                } else if (
                  event.delta?.type === "input_json_delta" &&
                  currentToolCall
                ) {
                  // Accumulate tool input JSON
                  if (!currentToolCall.inputJson) {
                    currentToolCall.inputJson = "";
                  }
                  currentToolCall.inputJson += event.delta.partial_json;
                }
              } else if (event.type === "content_block_stop") {
                if (currentToolCall) {
                  // Parse accumulated JSON input
                  if (currentToolCall.inputJson) {
                    try {
                      currentToolCall.args = JSON.parse(
                        currentToolCall.inputJson,
                      );
                    } catch (e) {
                      console.warn(
                        "Failed to parse tool input:",
                        currentToolCall.inputJson,
                      );
                    }
                  }
                  toolCalls.push({
                    name: currentToolCall.name,
                    id: currentToolCall.id,
                    args: currentToolCall.args,
                  });
                  currentToolCall = null;
                }
              } else if (event.type === "error") {
                throw new Error(event.error || "Stream error");
              }
            } catch (e) {
              if (e instanceof Error && e.message.includes("Stream error")) {
                throw e;
              }
              console.warn("Failed to parse SSE event:", data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Create AI message with tool calls if present
    if (toolCalls.length > 0) {
      console.log(
        "[LangGraph] Tool calls detected:",
        toolCalls.map((tc) => tc.name),
      );
      return {
        messages: [
          new AIMessage({
            content: textContent || "Using tools...",
            tool_calls: toolCalls,
          }),
        ],
      };
    } else {
      // No tool calls, just return text response
      return {
        messages: [new AIMessage(textContent || "I'm here to help!")],
      };
    }
  } catch (error: any) {
    console.error("[LangGraph] LLM node error:", error);
    return {
      messages: [
        new AIMessage(
          `Sorry, I encountered an error: ${error.message || "Unknown error"}`,
        ),
      ],
    };
  }
}

/**
 * Execute a single tool call using browser-tools
 */
async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
): Promise<string> {
  try {
    const tool = toolMap.get(toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    console.log(`[LangGraph] Executing tool: ${toolName}`, args);

    // Execute the tool directly using its invoke method
    // Cast to any to avoid type issues with different tool signatures
    const result = await (tool as any).invoke(args);

    // Return the result (already formatted as string by the tool)
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (error: any) {
    console.error(`[LangGraph] Tool execution error (${toolName}):`, error);
    return JSON.stringify({
      error: error.message || "Tool execution failed",
      toolName,
    });
  }
}

/**
 * Tool Node - Executes browser tools
 */
async function toolNode(
  state: typeof MessagesAnnotation.State,
): Promise<{ messages: BaseMessage[] }> {
  const lastMessage = state.messages[state.messages.length - 1];

  if (!(lastMessage instanceof AIMessage) || !lastMessage.tool_calls?.length) {
    console.warn("[LangGraph] Tool node called but no tool calls found");
    return { messages: [] };
  }

  const toolMessages: ToolMessage[] = [];

  // Execute all tool calls
  for (const toolCall of lastMessage.tool_calls) {
    const result = await executeToolCall(toolCall.name, toolCall.args || {});

    toolMessages.push(
      new ToolMessage({
        content: result,
        tool_call_id: toolCall.id || toolCall.name,
        name: toolCall.name,
      }),
    );
  }

  return { messages: toolMessages };
}

/**
 * Decide whether to continue with tool execution or end
 */
function shouldContinue(
  state: typeof MessagesAnnotation.State,
): "tools" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1];

  // Check if last message has tool calls
  if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length) {
    console.log("[LangGraph] Tool calls detected, routing to tools node");
    return "tools";
  }

  console.log("[LangGraph] No tool calls, ending graph");
  return END;
}

/**
 * Build and compile the graph
 */
export const graph = new StateGraph(MessagesAnnotation)
  .addNode("llm", llmNode)
  .addNode("tools", toolNode)
  .addEdge(START, "llm")
  .addConditionalEdges("llm", shouldContinue, {
    tools: "tools",
    [END]: END,
  })
  .addEdge("tools", "llm") // After tools, go back to LLM
  .compile();

/**
 * Stream chat using LangGraph with token-level streaming
 * Uses custom stream mode to receive tokens from llmNode in real-time
 */
export async function* streamChat(
  messages: BaseMessage[],
): AsyncGenerator<
  { type: string; content: string; delta?: string },
  void,
  unknown
> {
  let fullText = "";
  let llmCallCount = 0;
  let currentLLMText = "";
  let isFirstLLMCall = true;

  // Use multiple stream modes: custom for tokens, updates for node results
  const stream = await graph.stream(
    { messages },
    { streamMode: ["custom", "updates"] as any },
  );

  for await (const chunk of stream) {
    // chunk is a tuple: [mode, data]
    const [mode, data] = chunk as [string, any];

    if (mode === "custom") {
      // Token from llmNode via config.writer
      const token = data as string;
      fullText += token;
      currentLLMText += token;

      if (isFirstLLMCall) {
        // First LLM call - stream normally
        yield {
          type: "token",
          content: fullText,
          delta: token,
        };
      }
    } else if (mode === "updates") {
      // Node completion
      if (data.llm) {
        // LLM node completed - check for tool calls
        const messages = data.llm.messages;
        if (messages && messages.length > 0) {
          const message = messages[0] as AIMessage;
          llmCallCount++;

          if (message.tool_calls && message.tool_calls.length > 0) {
            // Tool calls detected
            const toolNames = message.tool_calls
              .map((tc) => tc.name)
              .join(", ");

            // If this is not the first LLM call and there's text, send as intermediate
            if (!isFirstLLMCall && currentLLMText) {
              yield {
                type: "intermediate_text",
                content: currentLLMText,
              };
            }

            yield {
              type: "tool_start",
              content: `Using tools: ${toolNames}`,
            };

            currentLLMText = "";
            isFirstLLMCall = false;
          } else {
            // No tool calls - this is the final response
            if (!isFirstLLMCall && currentLLMText) {
              // This is the last LLM call after tools
              yield {
                type: "final_text",
                content: currentLLMText,
              };
            }
          }
        }
      } else if (data.tools) {
        // Tools node completed
        const toolMessages = data.tools.messages;
        if (toolMessages && toolMessages.length > 0) {
          const toolNames = toolMessages.map((msg: any) => msg.name).join(", ");
          yield {
            type: "tool_complete",
            content: `Completed: ${toolNames}`,
          };
        }
      }
    }
  }

  // Stream complete
  yield {
    type: "complete",
    content: fullText,
  };
}
