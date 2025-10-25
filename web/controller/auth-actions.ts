"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { registerUserController, loginUserController } from "./auth-controller";

// Cookie configuration
const config = {
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

/**
 * Server action to register a new user
 */
export async function registerUserAction(prevState: any, formData: FormData) {
  const validatedFields = schemaRegister.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      zodErrors: validatedFields.error.flatten().fieldErrors,
      strapiErrors: null,
      message: "Missing Fields. Failed to Register.",
    };
  }

  const result = await registerUserController(validatedFields.data);

  if (!result.success) {
    return {
      ...prevState,
      strapiErrors: result.strapiErrors,
      zodErrors: result.zodErrors,
      message: result.message,
    };
  }

  // Store JWT token in cookies
  const cookieStore = await cookies();
  cookieStore.set("jwt", result.jwt!, config);

  redirect("/dashboard");
}

/**
 * Server action to login a user
 */
export async function loginUserAction(prevState: any, formData: FormData) {
  const validatedFields = schemaLogin.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      zodErrors: validatedFields.error.flatten().fieldErrors,
      strapiErrors: null,
      message: "Missing Fields. Failed to Login.",
    };
  }

  const result = await loginUserController(validatedFields.data);

  if (!result.success) {
    return {
      ...prevState,
      strapiErrors: result.strapiErrors,
      zodErrors: result.zodErrors,
      message: result.message,
    };
  }

  // Store JWT token in cookies
  const cookieStore = await cookies();
  cookieStore.set("jwt", result.jwt!, config);

  // Return JWT to client for postMessage
  return {
    ...prevState,
    jwt: result.jwt,
    success: true,
    zodErrors: null,
    strapiErrors: null,
    message: "Login successful",
  };
}

/**
 * Server action to logout a user
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("jwt");
  redirect("/");
}
