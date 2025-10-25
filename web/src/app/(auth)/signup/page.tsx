"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerUserAction } from "@/data/actions/auth-actions";

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
      <form action={formAction} className="space-y-6">
        <div className="rounded-lg bg-white px-8 py-10 shadow-md dark:bg-gray-800">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sign Up
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create a new account to get started
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="username"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
              {formState?.zodErrors?.username && (
                <p className="mt-1 text-sm text-red-600">
                  {formState.zodErrors.username[0]}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
              {formState?.zodErrors?.email && (
                <p className="mt-1 text-sm text-red-600">
                  {formState.zodErrors.email[0]}
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
              Sign Up
            </button>
          </div>

          {/* Error Messages */}
          {formState?.strapiErrors && (
            <div className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-400">
                {formState.strapiErrors.message || "Registration failed"}
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

        {/* Sign In Link */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
