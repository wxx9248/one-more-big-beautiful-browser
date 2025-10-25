"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link as HeroLink } from "@heroui/link";

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

interface FormState {
  zodErrors: any;
  strapiErrors: any;
  message: string | null;
  jwt: string | null;
  success: boolean;
  loading: boolean;
}

const INITIAL_STATE: FormState = {
  zodErrors: null,
  strapiErrors: null,
  message: null,
  jwt: null,
  success: false,
  loading: false,
};

export default function LoginPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE);

  // Post message when JWT is available
  useEffect(() => {
    if (formState?.jwt && formState?.success) {
      window.postMessage({ type: "JWT_TOKEN", jwt: formState.jwt }, "*");
      // Redirect to dashboard after posting message
      router.push("/dashboard");
    }
  }, [formState?.jwt, formState?.success, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState((prev) => ({
      ...prev,
      loading: true,
      zodErrors: null,
      strapiErrors: null,
      message: null,
    }));

    const formData = new FormData(e.currentTarget);
    const data = {
      identifier: formData.get("identifier") as string,
      password: formData.get("password") as string,
    };

    // Client-side validation
    const validatedFields = schemaLogin.safeParse(data);

    if (!validatedFields.success) {
      setFormState((prev) => ({
        ...prev,
        zodErrors: validatedFields.error.flatten().fieldErrors,
        strapiErrors: null,
        message: "Missing Fields. Failed to Login.",
        loading: false,
      }));
      return;
    }

    try {
      // Make API call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedFields.data),
        cache: "no-cache",
      });

      const responseData = await response.json();

      if (!responseData) {
        setFormState((prev) => ({
          ...prev,
          strapiErrors: null,
          zodErrors: null,
          message: "Ops! Something went wrong. Please try again.",
          loading: false,
        }));
        return;
      }

      if (responseData.error) {
        setFormState((prev) => ({
          ...prev,
          strapiErrors: responseData.error,
          zodErrors: null,
          message: "Failed to Login.",
          loading: false,
        }));
        return;
      }

      // Success - set JWT and success state
      setFormState((prev) => ({
        ...prev,
        jwt: responseData.jwt,
        success: true,
        zodErrors: null,
        strapiErrors: null,
        message: "Login successful",
        loading: false,
      }));
    } catch (error) {
      console.error("Login Error:", error);
      setFormState((prev) => ({
        ...prev,
        strapiErrors: { message: "Failed to connect to the server" },
        zodErrors: null,
        message: "Failed to Login.",
        loading: false,
      }));
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="w-full p-6">
        <form onSubmit={handleSubmit}>
          <CardHeader className="flex flex-col gap-1 items-start pb-6">
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-sm text-default-500">
              Enter your credentials to access your account
            </p>
          </CardHeader>

          <CardBody className="gap-4">
            {/* Identifier Field */}
            <Input
              label="Username or Email"
              name="identifier"
              type="text"
              placeholder="Enter your username or email"
              variant="bordered"
              isInvalid={!!formState?.zodErrors?.identifier}
              errorMessage={formState?.zodErrors?.identifier?.[0]}
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
            {formState?.strapiErrors && (
              <div className="rounded-lg bg-danger/10 p-3">
                <p className="text-sm text-danger">
                  {formState.strapiErrors.message || "Login failed"}
                </p>
              </div>
            )}

            {formState?.message && !formState?.strapiErrors && (
              <div className="rounded-lg bg-warning/10 p-3">
                <p className="text-sm text-warning">{formState.message}</p>
              </div>
            )}
          </CardBody>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              color="primary"
              className="w-full"
              size="lg"
              isLoading={formState.loading}
              disabled={formState.loading}
            >
              {formState.loading ? "Signing In..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-default-500">
              Don&apos;t have an account?{" "}
              <HeroLink as={Link} href="/signup" size="sm">
                Sign Up
              </HeroLink>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
