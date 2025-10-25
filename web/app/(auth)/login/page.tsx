"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUserAction } from "@/data/actions/auth-actions";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link as HeroLink } from "@heroui/link";

const INITIAL_STATE = {
  zodErrors: null,
  strapiErrors: null,
  message: null,
  jwt: null,
  success: false,
};

export default function LoginPage() {
  const router = useRouter();
  const [formState, formAction] = useActionState(
    loginUserAction,
    INITIAL_STATE
  );

  // Post message when JWT is available
  useEffect(() => {
    if (formState?.jwt && formState?.success) {
      window.postMessage({ type: "JWT_TOKEN", jwt: formState.jwt }, "*");
      // Redirect to dashboard after posting message
      router.push("/dashboard");
    }
  }, [formState?.jwt, formState?.success, router]);

  return (
    <div className="w-full max-w-md">
      <Card className="w-full p-6">
        <form action={formAction}>
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
            <Button type="submit" color="primary" className="w-full" size="lg">
              Sign In
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
