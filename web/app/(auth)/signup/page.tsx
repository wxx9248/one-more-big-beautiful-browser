"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link as HeroLink } from "@heroui/link";

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

export default function SignupPage() {
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
        strapiErrors: null,
        message: "Missing Fields. Failed to Register.",
        loading: false,
      }));
      return;
    }

    try {
      // Make API call
      const response = await fetch("/api/auth/register", {
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
          message: "Failed to Register.",
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
        message: "Registration successful! Redirecting...",
        loading: false,
      }));
    } catch (error) {
      console.error("Registration Error:", error);
      setFormState((prev) => ({
        ...prev,
        strapiErrors: { message: "Failed to connect to the server" },
        zodErrors: null,
        message: "Failed to Register.",
        loading: false,
      }));
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="w-full p-6">
        <form onSubmit={handleSubmit}>
          <CardHeader className="flex flex-col gap-1 items-start pb-6">
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-sm text-default-500">
              Create a new account to get started
            </p>
          </CardHeader>

          <CardBody className="gap-4">
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
            {formState?.strapiErrors && (
              <div className="rounded-lg bg-danger/10 p-3">
                <p className="text-sm text-danger">
                  {formState.strapiErrors.message || "Registration failed"}
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
              {formState.loading ? "Creating Account..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-default-500">
              Already have an account?{" "}
              <HeroLink as={Link} href="/login" size="sm">
                Sign In
              </HeroLink>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
