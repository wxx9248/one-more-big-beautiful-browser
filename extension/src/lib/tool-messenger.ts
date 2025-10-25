/**
 * Tool messenger - Abstraction layer for tool communication
 * Handles message passing between side panel → background → content script
 */

import type { ToolMessage, ToolResponse } from "@/src/types/tools";

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Send a tool message and wait for response
 * @param toolName Name of the tool to execute
 * @param params Tool parameters
 * @param timeout Timeout in milliseconds
 * @returns Promise resolving to tool response
 */
export async function sendToolMessage<T = any>(
  toolName: string,
  params: Record<string, any> = {},
  timeout: number = DEFAULT_TIMEOUT,
): Promise<ToolResponse<T>> {
  const requestId = generateRequestId();

  const message: ToolMessage = {
    type: "TOOL_CALL",
    toolName,
    params,
    requestId,
  };

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      browser.runtime.onMessage.removeListener(responseListener);
      reject(new Error(`Tool call timeout: ${toolName} (${timeout}ms)`));
    }, timeout);

    const responseListener = (
      response: any,
      sender: browser.Runtime.MessageSender,
    ) => {
      if (
        response?.type === "TOOL_RESPONSE" &&
        response?.requestId === requestId
      ) {
        clearTimeout(timeoutId);
        browser.runtime.onMessage.removeListener(responseListener);

        if (response.success) {
          resolve(response as ToolResponse<T>);
        } else {
          reject(
            new Error(response.error || `Tool execution failed: ${toolName}`),
          );
        }
      }
    };

    browser.runtime.onMessage.addListener(responseListener);

    // Send message to background script
    browser.runtime.sendMessage(message).catch((error) => {
      clearTimeout(timeoutId);
      browser.runtime.onMessage.removeListener(responseListener);
      reject(new Error(`Failed to send tool message: ${error.message}`));
    });
  });
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper function to get auth token from storage
 */
export async function getAuthToken(): Promise<string | null> {
  const result = await browser.storage.local.get("authToken");
  return result.authToken || null;
}
