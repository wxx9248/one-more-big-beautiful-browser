import { cookies } from "next/headers";

/**
 * Get the JWT authentication token from cookies
 * @returns The JWT token string or undefined if not found
 */
export async function getAuthToken() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("jwt")?.value;
  return authToken;
}

/**
 * Check if user is authenticated
 * @returns true if JWT token exists, false otherwise
 */
export async function isAuthenticated() {
  const token = await getAuthToken();
  return !!token;
}
