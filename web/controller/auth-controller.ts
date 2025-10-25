import { z } from "zod";
import { findUser, createUser } from "@/lib/fake-db";
import jwt from "jsonwebtoken";

// JWT Secret - In production, use environment variable
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d"; // Token expires in 7 days

// Cookie configuration
export const cookieConfig = {
  maxAge: 60 * 60 * 24 * 7, // 1 week
  path: "/",
  domain: process.env.HOST ?? "localhost",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

// Validation schema for registration
const schemaRegister = z.object({
  username: z.string().min(3).max(20, {
    message: "Username must be between 3 and 20 characters",
  }),
  password: z.string().min(6).max(100, {
    message: "Password must be between 6 and 100 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
});

// Validation schema for login
const schemaLogin = z.object({
  identifier: z
    .string()
    .min(3, {
      message: "Identifier must have at least 3 or more characters",
    })
    .max(50, {
      message: "Please enter a valid username or email address",
    }),
  password: z
    .string()
    .min(6, {
      message: "Password must have at least 6 or more characters",
    })
    .max(100, {
      message: "Password must be between 6 and 100 characters",
    }),
});

export interface AuthResult {
  success: boolean;
  jwt?: string;
  user?: any;
  zodErrors?: any;
  strapiErrors?: any;
  message?: string;
}

/**
 * Generate a real JWT token
 */
function generateToken(user: any): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Controller function to register a user (for use in API routes)
 */
export async function registerUserController(userData: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const validatedFields = schemaRegister.safeParse(userData);

  if (!validatedFields.success) {
    return {
      success: false,
      zodErrors: validatedFields.error.flatten().fieldErrors,
      strapiErrors: null,
      message: "Missing Fields. Failed to Register.",
    };
  }

  const { username, email, password } = validatedFields.data;

  // Check if user already exists
  const existingUser = findUser(username) || findUser(email);
  if (existingUser) {
    return {
      success: false,
      strapiErrors: { message: "Username or email already exists" },
      zodErrors: null,
      message: "Failed to Register.",
    };
  }

  // Create new user
  const newUser = createUser(username, email, password);

  // Generate real JWT token
  const jwt = generateToken(newUser);

  return {
    success: true,
    jwt,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    },
    zodErrors: null,
    strapiErrors: null,
    message: "Registration successful",
  };
}

/**
 * Controller function to login a user (for use in API routes)
 */
export async function loginUserController(userData: {
  identifier: string;
  password: string;
}): Promise<AuthResult> {
  const validatedFields = schemaLogin.safeParse(userData);

  if (!validatedFields.success) {
    return {
      success: false,
      zodErrors: validatedFields.error.flatten().fieldErrors,
      strapiErrors: null,
      message: "Missing Fields. Failed to Login.",
    };
  }

  const { identifier, password } = validatedFields.data;

  // Find user by username or email
  const user = findUser(identifier);

  if (!user) {
    return {
      success: false,
      strapiErrors: { message: "Invalid credentials" },
      zodErrors: null,
      message: "Failed to Login.",
    };
  }

  // Check password (in production, compare hashed passwords!)
  if (user.password !== password) {
    return {
      success: false,
      strapiErrors: { message: "Invalid credentials" },
      zodErrors: null,
      message: "Failed to Login.",
    };
  }

  // Generate real JWT token
  const jwt = generateToken(user);

  return {
    success: true,
    jwt,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    zodErrors: null,
    strapiErrors: null,
    message: "Login successful",
  };
}
