import { browser } from "wxt/browser";
import {
  MessageType,
  type AuthMessage,
  type AuthState,
} from "@/src/types/auth";

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
      message: AuthMessage,
      sender,
      sendResponse: (response?: AuthState) => void,
    ) => {
      console.log("Background received message:", message);

      switch (message.type) {
        case MessageType.AUTH_TOKEN:
        case MessageType.AUTH_SUCCESS:
          // Store the token
          handleAuthSuccess(message.token);
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
