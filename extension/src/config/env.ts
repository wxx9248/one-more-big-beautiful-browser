/**
 * Environment configuration
 * Resolved at compile time based on environment variables
 */

// Get the auth URL from environment variable
const AUTH_URL =
  import.meta.env.VITE_AUTH_URL || "http://localhost:3001/auth/login";

// Parse the auth URL to get the origin
const authUrlObj = new URL(AUTH_URL);
export const AUTH_ORIGIN = authUrlObj.origin;
export const AUTH_FULL_URL = AUTH_URL;

// Generate the content script match pattern from the origin
// Converts "http://localhost:3001" to "http://localhost:3001/*"
export const AUTH_MATCH_PATTERN = `${AUTH_ORIGIN}/*`;

// For development and production
export const isDevelopment = import.meta.env.MODE === "development";
export const isProduction = import.meta.env.MODE === "production";
