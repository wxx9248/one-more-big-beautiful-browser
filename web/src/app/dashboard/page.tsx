import { LogoutButton } from "@/components/logout-button";
import { getAuthToken } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const token = await getAuthToken();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-2xl">
        <div className="rounded-lg bg-white px-8 py-10 shadow-md dark:bg-gray-800">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Welcome! You are now logged in.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">
                    Authentication successful!
                  </p>
                </div>
              </div>
            </div>

            {token && (
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                <h3 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                  Token Status
                </h3>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  JWT Token: {token.substring(0, 20)}...
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ready to leave?
              </p>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
