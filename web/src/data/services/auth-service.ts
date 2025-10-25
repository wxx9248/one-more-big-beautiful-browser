// Configure your backend URL here
// Use localhost for local API routes (must match your dev server port)
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface RegisterUserProps {
  username: string;
  email: string;
  password: string;
}

export interface LoginUserProps {
  identifier: string;
  password: string;
}

/**
 * Register a new user
 * @param userData - User registration data
 * @returns Response data with jwt token and user info, or error
 */
export async function registerUserService(userData: RegisterUserProps) {
  const url = new URL("/api/auth/register", BACKEND_URL).toString();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
      cache: "no-cache",
    });

    return response.json();
  } catch (error) {
    console.error("Registration Service Error:", error);
    return {
      error: {
        message: "Failed to connect to the server",
      },
    };
  }
}

/**
 * Login an existing user
 * @param userData - User login credentials
 * @returns Response data with jwt token and user info, or error
 */
export async function loginUserService(userData: LoginUserProps) {
  const url = new URL("/api/auth/login", BACKEND_URL).toString();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
      cache: "no-cache",
    });

    return response.json();
  } catch (error) {
    console.error("Login Service Error:", error);
    return {
      error: {
        message: "Failed to connect to the server",
      },
    };
  }
}
