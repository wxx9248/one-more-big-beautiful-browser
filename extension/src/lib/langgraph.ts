/**
 * LangGraph integration for browser extension
 * Implements an agentic loop: LLM → Tool → LLM
 */

import {
  MessagesAnnotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph/web";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { browserTools } from "./browser-tools";
import { getAuthToken } from "./tool-messenger";
import { BACKEND_API_URL } from "@/src/config/env";

/**
 * LLM Node - Calls backend API for LLM inference
 */
async function llmNode(
  state: typeof MessagesAnnotation.State,
): Promise<{ messages: BaseMessage[] }> {
  const messages = state.messages;

  try {
    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      throw new Error("No auth token available");
    }

    // Convert messages to backend format
    const formattedMessages = messages.map((msg) => {
      if (msg instanceof HumanMessage) {
        return { role: "user", content: msg.content };
      } else if (msg instanceof AIMessage) {
        return { role: "assistant", content: msg.content };
      } else if (msg instanceof ToolMessage) {
        // Tool results are sent as system messages
        return { role: "system", content: `Tool result: ${msg.content}` };
      }
      return { role: "system", content: msg.content };
    });

    // Add system message about available tools
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant with access to browser automation tools. You can:
- Get information about the current page (get_current_tab_info, get_page_content)
- Find and interact with elements (find_elements, click_element, fill_input, scroll_to_element)
- Manage tabs (get_all_tabs, switch_to_tab)
- Capture screenshots (capture_screenshot)

When the user asks you to interact with a page, use the appropriate tools. Always get page content or find elements before trying to click or fill them.

To use a tool, respond with a tool call in this format:
TOOL_CALL: tool_name
PARAMS: {"param1": "value1", "param2": "value2"}

Example:
TOOL_CALL: get_page_content
PARAMS: {}

Or:
TOOL_CALL: click_element
PARAMS: {"selector": "button.submit"}

After seeing tool results, provide a natural response to the user.`,
    };

    // Call backend API
    const response = await fetch(BACKEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [systemMessage, ...formattedMessages],
        stream: false, // For now, use non-streaming
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message || data.content || data.response || "";

    // Parse tool calls from LLM response
    const toolCalls = parseToolCalls(aiResponse);

    if (toolCalls.length > 0) {
      // LLM wants to use tools
      return {
        messages: [
          new AIMessage({
            content: aiResponse,
            tool_calls: toolCalls,
          }),
        ],
      };
    } else {
      // No tool calls, just a regular response
      return {
        messages: [new AIMessage(aiResponse)],
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
 * Parse tool calls from LLM response
 * Looks for TOOL_CALL and PARAMS markers
 */
function parseToolCalls(response: string): Array<{
  name: string;
  args: Record<string, any>;
  id: string;
}> {
  const toolCalls: Array<{
    name: string;
    args: Record<string, any>;
    id: string;
  }> = [];

  // Simple regex-based parsing
  const toolCallPattern = /TOOL_CALL:\s*(\w+)\s*PARAMS:\s*({[^}]*})/gs;
  let match;

  while ((match = toolCallPattern.exec(response)) !== null) {
    const toolName = match[1];
    let params = {};

    try {
      params = JSON.parse(match[2]);
    } catch (e) {
      console.warn(`Failed to parse tool params: ${match[2]}`);
    }

    toolCalls.push({
      name: toolName,
      args: params,
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    });
  }

  return toolCalls;
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
 * Create tool node with browser tools
 */
const toolNode = new ToolNode(browserTools);

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
 * Helper function to invoke the graph with a user message
 */
export async function invokeGraph(userMessage: string): Promise<string> {
  const result = await graph.invoke({
    messages: [new HumanMessage(userMessage)],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  return lastMessage.content as string;
}

/**
 * Helper function to stream graph execution
 */
export async function* streamGraph(
  userMessage: string,
): AsyncGenerator<{ type: string; content: string }, void, unknown> {
  const stream = await graph.stream({
    messages: [new HumanMessage(userMessage)],
  });

  for await (const chunk of stream) {
    if (chunk.llm) {
      yield {
        type: "llm",
        content: chunk.llm.messages[0].content as string,
      };
    } else if (chunk.tools) {
      yield {
        type: "tools",
        content: JSON.stringify(chunk.tools),
      };
    }
  }
}
