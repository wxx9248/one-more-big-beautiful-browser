import { browser } from "wxt/browser";
import {
  MessageType,
  type AuthMessage,
  type AuthState,
} from "@/src/types/auth";
import type { ToolMessage, ToolResponse } from "@/src/types/tools";

// In-memory auth state
let authState: AuthState = {
  isAuthenticated: false,
  token: null,
};

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  // Initialize side panel on install
  browser.runtime.onInstalled.addListener(async () => {
    await browser.sidePanel.setOptions({
      path: "sidepanel.html",
      enabled: true,
    });

    browser.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.error(err));

    // Load stored auth state
    await loadAuthState();
  });

  // Load auth state on startup
  loadAuthState();

  // Listen for messages from content scripts and side panel
  browser.runtime.onMessage.addListener(
    (
      message: AuthMessage | ToolMessage,
      sender,
      sendResponse: (response?: AuthState | ToolResponse) => void,
    ) => {
      console.log("Background received message:", message);

      // Handle tool calls
      if (message.type === "TOOL_CALL") {
        handleToolCall(
          message as ToolMessage,
          sendResponse as (response: ToolResponse) => void,
        );
        return true; // Keep channel open for async response
      }

      // Handle auth messages
      switch ((message as AuthMessage).type) {
        case MessageType.AUTH_TOKEN:
        case MessageType.AUTH_SUCCESS:
          // Store the token
          handleAuthSuccess((message as AuthMessage).token);
          sendResponse(authState);
          break;

        case MessageType.AUTH_LOGOUT:
          // Clear the token
          handleLogout();
          sendResponse(authState);
          break;

        case MessageType.GET_AUTH_STATE:
          // Return current auth state
          sendResponse(authState);
          break;

        default:
          console.warn("Unknown message type:", message);
      }

      return true; // Keep message channel open for async response
    },
  );
});

/**
 * Load auth state from storage
 */
async function loadAuthState(): Promise<void> {
  try {
    const result = await browser.storage.local.get("authToken");
    if (result.authToken) {
      authState = {
        isAuthenticated: true,
        token: result.authToken,
      };
      console.log("Auth state loaded from storage");
    }
  } catch (error) {
    console.error("Failed to load auth state:", error);
  }
}

/**
 * Handle successful authentication
 */
async function handleAuthSuccess(token: string): Promise<void> {
  authState = {
    isAuthenticated: true,
    token,
  };

  // Persist to storage
  try {
    await browser.storage.local.set({ authToken: token });
    console.log("Auth token stored successfully");
  } catch (error) {
    console.error("Failed to store auth token:", error);
  }

  // Notify all extension pages about auth state change
  notifyAuthStateChange();
}

/**
 * Handle logout
 */
async function handleLogout(): Promise<void> {
  authState = {
    isAuthenticated: false,
    token: null,
  };

  // Clear storage
  try {
    await browser.storage.local.remove("authToken");
    console.log("Auth token cleared");
  } catch (error) {
    console.error("Failed to clear auth token:", error);
  }

  // Notify all extension pages about auth state change
  notifyAuthStateChange();
}

/**
 * Notify all extension pages about auth state changes
 */
function notifyAuthStateChange(): void {
  // This can be used to notify the side panel or other extension pages
  // For now, they will query the state when needed
  console.log("Auth state changed:", authState);
}

/**
 * Handle tool calls by routing to active tab's content script
 */
async function handleToolCall(
  message: ToolMessage,
  sendResponse: (response: ToolResponse) => void,
): Promise<void> {
  const { toolName, requestId } = message;
  console.log(`[Background] Routing tool call: ${toolName}`);

  try {
    // Special handling for screenshot capture
    if (toolName === "captureScreenshot") {
      const screenshot = await captureScreenshot();
      sendResponse({
        type: "TOOL_RESPONSE",
        requestId,
        success: true,
        data: screenshot,
      });
      return;
    }

    // Special handling for tab management tools
    if (toolName === "getAllTabs") {
      const tabs = await getAllTabs();
      sendResponse({
        type: "TOOL_RESPONSE",
        requestId,
        success: true,
        data: tabs,
      });
      return;
    }

    if (toolName === "switchToTab") {
      const result = await switchToTab(message.params.tabId);
      sendResponse({
        type: "TOOL_RESPONSE",
        requestId,
        success: true,
        data: result,
      });
      return;
    }

    // Special handling for screenshot capture and download
    if (toolName === "captureScreenshotAndDownload") {
      const result = await captureScreenshotAndDownload(
        message.params.filename || "screenshot.png",
      );
      sendResponse({
        type: "TOOL_RESPONSE",
        requestId,
        success: true,
        data: result,
      });
      return;
    }

    // Special handling for file downloads
    if (toolName === "downloadFile") {
      const result = await downloadFile(
        message.params.url,
        message.params.filename,
      );
      sendResponse({
        type: "TOOL_RESPONSE",
        requestId,
        success: true,
        data: result,
      });
      return;
    }

    // Get active tab
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTab = tabs[0];

    if (!activeTab?.id) {
      sendResponse({
        type: "TOOL_RESPONSE",
        requestId,
        success: false,
        error: "No active tab found",
      });
      return;
    }

    // Forward message to content script
    const response = await browser.tabs.sendMessage(activeTab.id, message);
    sendResponse(response);
  } catch (error: any) {
    console.error(`[Background] Tool call failed:`, error);
    sendResponse({
      type: "TOOL_RESPONSE",
      requestId,
      success: false,
      error: error.message || "Tool execution failed",
    });
  }
}

/**
 * Capture screenshot of visible viewport
 */
async function captureScreenshot(): Promise<{
  dataUrl: string;
  timestamp: number;
}> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (!activeTab?.id) {
    throw new Error("No active tab found");
  }

  const dataUrl = await browser.tabs.captureVisibleTab(activeTab.windowId, {
    format: "png",
  });

  return {
    dataUrl,
    timestamp: Date.now(),
  };
}

/**
 * Get all open tabs
 */
async function getAllTabs(): Promise<
  Array<{ id?: number; url: string; title: string }>
> {
  const tabs = await browser.tabs.query({});
  return tabs.map((tab) => ({
    id: tab.id,
    url: tab.url || "",
    title: tab.title || "",
  }));
}

/**
 * Switch to a specific tab
 */
async function switchToTab(
  tabId: number,
): Promise<{ success: boolean; message: string }> {
  try {
    await browser.tabs.update(tabId, { active: true });
    const tab = await browser.tabs.get(tabId);
    if (tab.windowId) {
      await browser.windows.update(tab.windowId, { focused: true });
    }
    return {
      success: true,
      message: `Switched to tab: ${tab.title}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to switch tab: ${error.message}`,
    };
  }
}

/**
 * Capture screenshot and immediately download it
 */
async function captureScreenshotAndDownload(filename: string): Promise<{
  success: boolean;
  message: string;
  filename: string;
  dataUrl: string;
  timestamp: number;
}> {
  try {
    // Capture the screenshot
    const screenshot = await captureScreenshot();

    // Download it
    const downloadResult = await downloadFile(screenshot.dataUrl, filename);

    if (!downloadResult.success) {
      throw new Error(downloadResult.message);
    }

    return {
      success: true,
      message: `Screenshot saved as ${filename}`,
      filename: filename,
      dataUrl: screenshot.dataUrl,
      timestamp: screenshot.timestamp,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to capture and download screenshot: ${error.message}`,
      filename: filename,
      dataUrl: "",
      timestamp: Date.now(),
    };
  }
}

/**
 * Download a file from a URL or data URL
 */
async function downloadFile(
  url: string,
  filename: string,
): Promise<{ success: boolean; message: string; filename: string }> {
  try {
    console.log(
      `[Background] Downloading file: ${filename} from ${url.substring(0, 100)}...`,
    );

    // Chrome's downloads API can handle data URLs directly
    const downloadId = await browser.downloads.download({
      url: url,
      filename: filename,
      saveAs: false,
    });

    console.log(`[Background] Download initiated with ID: ${downloadId}`);

    return {
      success: true,
      message: `File downloaded successfully: ${filename}`,
      filename: filename,
    };
  } catch (error: any) {
    console.error(`[Background] Download failed:`, error);
    return {
      success: false,
      message: `Failed to download file: ${error.message}`,
      filename: filename,
    };
  }
}
