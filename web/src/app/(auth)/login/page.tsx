"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUserAction } from "@/data/actions/auth-actions";

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
      <form action={formAction} className="space-y-6">
        <div className="rounded-lg bg-white px-8 py-10 shadow-md dark:bg-gray-800">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sign In
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Identifier Field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Username or Email
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="username or email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
              {formState?.zodErrors?.identifier && (
                <p className="mt-1 text-sm text-red-600">
                  {formState.zodErrors.identifier[0]}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="password"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
              {formState?.zodErrors?.password && (
                <p className="mt-1 text-sm text-red-600">
                  {formState.zodErrors.password[0]}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Sign In
            </button>
          </div>

          {/* Error Messages */}
          {formState?.strapiErrors && (
            <div className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-400">
                {formState.strapiErrors.message || "Login failed"}
              </p>
            </div>
          )}

          {formState?.message && !formState?.strapiErrors && (
            <div className="mt-4 rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                {formState.message}
              </p>
            </div>
          )}
        </div>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
}
