import { browser } from "wxt/browser";
import { MessageType } from "@/src/types/auth";

/**
 * Content script that listens for auth tokens from the login page
 * This runs on the Next.js auth domain to receive tokens via window.postMessage
 */
export default defineContentScript({
  matches: ["http://localhost:3001/*", "https://app.example.com/*"],

  main() {
    console.log("Auth listener content script loaded");

    // Listen for postMessage from the auth page
    window.addEventListener("message", async (event) => {
      // Security: Verify the origin
      const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:3001";
      const authOrigin = new URL(authUrl).origin;

      if (event.origin !== authOrigin) {
        console.warn("Rejected message from untrusted origin:", event.origin);
        return;
      }

      // Check if this is an auth token message
      if (event.data?.type === "AUTH_TOKEN" && event.data?.token) {
        console.log("Received auth token from login page");

        try {
          // Forward the token to the background service worker
          const response = await browser.runtime.sendMessage({
            type: MessageType.AUTH_SUCCESS,
            token: event.data.token,
          });

          console.log("Token sent to background script, response:", response);

          // Optionally notify the page that the token was received
          window.postMessage(
            {
              type: "AUTH_TOKEN_RECEIVED",
              success: true,
            },
            event.origin,
          );
        } catch (error) {
          console.error("Failed to send token to background:", error);

          window.postMessage(
            {
              type: "AUTH_TOKEN_RECEIVED",
              success: false,
              error: String(error),
            },
            event.origin,
          );
        }
      }
    });

    console.log("Auth listener ready, waiting for tokens...");
  },
});
