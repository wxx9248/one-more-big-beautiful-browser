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
  try {
    const response = await fetch("/api/auth/register", {
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
  try {
    const response = await fetch("/api/auth/login", {
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
