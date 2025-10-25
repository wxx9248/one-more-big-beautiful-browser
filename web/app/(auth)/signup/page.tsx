"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerUserAction } from "@/data/actions/auth-actions";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link as HeroLink } from "@heroui/link";

const INITIAL_STATE = {
  zodErrors: null,
  strapiErrors: null,
  message: null,
};

export default function SignupPage() {
  const [formState, formAction] = useActionState(
    registerUserAction,
    INITIAL_STATE
  );

  return (
    <div className="w-full max-w-md">
      <Card className="w-full p-6">
        <form action={formAction}>
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
            <Button type="submit" color="primary" className="w-full" size="lg">
              Sign Up
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
