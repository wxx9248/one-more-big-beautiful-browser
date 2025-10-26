"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link as HeroLink } from "@heroui/link";
import { Divider } from "@heroui/divider";
import {
  signUpWithEmail,
  signInWithGoogle,
  getSignInMethodsForEmail,
} from "@/lib/firebase/auth-service";
import { FirebaseError } from "firebase/app";

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

interface FormState {
  zodErrors: any;
  firebaseError: string | null;
  message: string | null;
  success: boolean;
  loading: boolean;
}

const INITIAL_STATE: FormState = {
  zodErrors: null,
  firebaseError: null,
  message: null,
  success: false,
  loading: false,
};

// Helper function to get friendly error messages
const getFirebaseErrorMessage = (error: FirebaseError): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead or use a different sign-in method.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/operation-not-allowed":
      return "Email/password accounts are not enabled. Please contact support.";
    case "auth/weak-password":
      return "Password is too weak. Please use a stronger password.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled. Please try again.";
    default:
      return error.message || "An error occurred during sign up.";
  }
};

export default function SignupPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState((prev) => ({
      ...prev,
      loading: true,
      zodErrors: null,
      firebaseError: null,
      message: null,
    }));

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // Client-side validation
    const validatedFields = schemaRegister.safeParse(data);

    if (!validatedFields.success) {
      setFormState((prev) => ({
        ...prev,
        zodErrors: validatedFields.error.flatten().fieldErrors,
        firebaseError: null,
        message: "Missing Fields. Failed to Register.",
        loading: false,
      }));
      return;
    }

    try {
      // Sign up with Firebase
      const userCredential = await signUpWithEmail(
        validatedFields.data.email,
        validatedFields.data.password,
        validatedFields.data.username
      );

      // Get Firebase ID token (JWT)
      const idToken = await userCredential.user.getIdToken();

      // Store JWT in cookie for authentication
      document.cookie = `jwt=${idToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${
        window.location.protocol === "https:" ? "; Secure" : ""
      }`;

      // Send JWT to browser extension via postMessage
      window.postMessage({ type: "JWT_TOKEN", jwt: idToken }, "*");

      // Success
      setFormState((prev) => ({
        ...prev,
        success: true,
        zodErrors: null,
        firebaseError: null,
        message: "Registration successful! Redirecting...",
        loading: false,
      }));

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Registration Error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error instanceof FirebaseError) {
        // Check if email already exists with different provider
        if (error.code === "auth/email-already-in-use") {
          try {
            const signInMethods = await getSignInMethodsForEmail(
              validatedFields.data.email
            );

            if (signInMethods.includes("google.com")) {
              errorMessage =
                "This email is already registered with Google Sign-In. Please sign in using the 'Continue with Google' button.";
            } else if (signInMethods.includes("password")) {
              errorMessage =
                "This email is already registered. Please sign in instead.";
            } else {
              errorMessage = getFirebaseErrorMessage(error);
            }
          } catch {
            errorMessage = getFirebaseErrorMessage(error);
          }
        } else {
          errorMessage = getFirebaseErrorMessage(error);
        }
      }

      setFormState((prev) => ({
        ...prev,
        firebaseError: errorMessage,
        zodErrors: null,
        message: "Failed to Register.",
        loading: false,
      }));
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setFormState((prev) => ({
      ...prev,
      firebaseError: null,
      message: null,
    }));

    try {
      const userCredential = await signInWithGoogle();

      // Get Firebase ID token (JWT)
      const idToken = await userCredential.user.getIdToken();

      // Store JWT in cookie for authentication
      document.cookie = `jwt=${idToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${
        window.location.protocol === "https:" ? "; Secure" : ""
      }`;

      // Send JWT to browser extension via postMessage
      window.postMessage({ type: "JWT_TOKEN", jwt: idToken }, "*");

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      const errorMessage =
        error instanceof FirebaseError
          ? getFirebaseErrorMessage(error)
          : "Failed to sign in with Google. Please try again.";

      setFormState((prev) => ({
        ...prev,
        firebaseError: errorMessage,
        message: "Failed to sign in with Google.",
      }));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="w-full p-6">
        <CardHeader className="flex flex-col gap-1 items-start pb-6">
          <h1 className="text-3xl font-bold">Sign Up</h1>
          <p className="text-sm text-default-500">
            Create a new account to get started
          </p>
        </CardHeader>

        <CardBody className="gap-4">
          {/* Google Sign-In Button */}
          <Button
            color="default"
            variant="bordered"
            className="w-full"
            size="lg"
            onPress={handleGoogleSignIn}
            isLoading={googleLoading}
            disabled={googleLoading || formState.loading}
            startContent={
              !googleLoading && (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )
            }
          >
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <div className="flex items-center gap-4 py-2">
            <Divider className="flex-1" />
            <p className="text-tiny text-default-400">OR</p>
            <Divider className="flex-1" />
          </div>

          {/* Email Sign-Up Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username Field */}
            <Input
              label="Username"
              name="username"
              type="text"
              placeholder="Enter your username"
              variant="bordered"
              isInvalid={!!formState?.zodErrors?.username}
              errorMessage={formState?.zodErrors?.username?.[0]}
              isRequired
            />

            {/* Email Field */}
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="Enter your email"
              variant="bordered"
              isInvalid={!!formState?.zodErrors?.email}
              errorMessage={formState?.zodErrors?.email?.[0]}
              isRequired
            />

            {/* Password Field */}
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              variant="bordered"
              isInvalid={!!formState?.zodErrors?.password}
              errorMessage={formState?.zodErrors?.password?.[0]}
              isRequired
            />

            {/* Error Messages */}
            {formState?.firebaseError && (
              <div className="rounded-lg bg-danger/10 p-3">
                <p className="text-sm text-danger">{formState.firebaseError}</p>
              </div>
            )}

            {formState?.success && (
              <div className="rounded-lg bg-success/10 p-3">
                <p className="text-sm text-success">{formState.message}</p>
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              className="w-full"
              size="lg"
              isLoading={formState.loading}
              disabled={formState.loading || googleLoading}
            >
              {formState.loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </CardBody>

        <CardFooter className="flex flex-col gap-3 pt-0">
          <p className="text-center text-sm text-default-500">
            Already have an account?{" "}
            <HeroLink as={Link} href="/login" size="sm">
              Sign In
            </HeroLink>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
