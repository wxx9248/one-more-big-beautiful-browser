import { browser } from "wxt/browser";
import { MessageType } from "@/src/types/auth";
import { AUTH_ORIGIN } from "@/src/config/env";

/**
 * Content script that listens for auth tokens from the login page
 * This runs on the Next.js auth domain to receive tokens via window.postMessage
 *
 * Expected message format from Next.js:
 * { type: "JWT_TOKEN", jwt: "eyJ..." }
 *
 * Note: Chrome extensions don't allow ports in match patterns, so we match
 * all localhost URLs and filter by origin in the code for security.
 */
export default defineContentScript({
  matches: ["http://localhost/*", "https://*.example.com/*"],

  main() {
    // Security: Only activate on the configured auth origin
    if (window.location.origin !== AUTH_ORIGIN) {
      // Silently exit if not on the auth domain
      return;
    }

    console.log("[Auth Listener] Activated on:", window.location.origin);

    // Listen for postMessage from the auth page
    window.addEventListener("message", async (event) => {
      // Security: Verify the origin matches the configured auth origin
      if (event.origin !== AUTH_ORIGIN) {
        console.warn(
          "[Auth Listener] Rejected message from untrusted origin:",
          event.origin,
        );
        return;
      }

      // Check if this is a JWT_TOKEN message from Next.js
      if (event.data?.type === "JWT_TOKEN" && event.data?.jwt) {
        console.log("[Auth Listener] Received JWT token from login page");

        try {
          // Forward the token to the background service worker
          const response = await browser.runtime.sendMessage({
            type: MessageType.AUTH_SUCCESS,
            token: event.data.jwt,
          });

          console.log(
            "[Auth Listener] Token sent to background script, response:",
            response,
          );

          // Notify the page that the token was received successfully
          window.postMessage(
            {
              type: "JWT_TOKEN_RECEIVED",
              success: true,
            },
            event.origin,
          );
        } catch (error) {
          console.error(
            "[Auth Listener] Failed to send token to background:",
            error,
          );

          // Notify the page that there was an error
          window.postMessage(
            {
              type: "JWT_TOKEN_RECEIVED",
              success: false,
              error: String(error),
            },
            event.origin,
          );
        }
      }
    });

    console.log("[Auth Listener] Ready and waiting for JWT token...");
  },
});
