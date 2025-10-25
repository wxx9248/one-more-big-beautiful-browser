import { getAuthToken } from "@/lib/auth-helpers";

export default async function DebugPage() {
  const token = await getAuthToken();

  let decodedToken = null;
  let error = null;

  if (token) {
    try {
      // Decode the base64 token
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      decodedToken = JSON.parse(decoded);
    } catch (e) {
      error = "Failed to decode token";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white px-8 py-10 shadow-md dark:bg-gray-800">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🔍 Debug: JWT Token Viewer
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              View and decode your authentication token
            </p>
          </div>

          {/* Token Status */}
          <div className="space-y-6">
            {token ? (
              <>
                {/* Raw Token */}
                <div>
                  <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Raw Token (Base64)
                  </h2>
                  <div className="rounded-md bg-gray-100 p-4 dark:bg-gray-700">
                    <code className="break-all text-xs text-gray-800 dark:text-gray-200">
                      {token}
                    </code>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This is the encoded JWT token stored in your HTTP-only
                    cookie
                  </p>
                </div>

                {/* Decoded Token */}
                {decodedToken && (
                  <div>
                    <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                      Decoded Token (Payload)
                    </h2>
                    <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                      <pre className="text-sm text-blue-900 dark:text-blue-100">
                        {JSON.stringify(decodedToken, null, 2)}
                      </pre>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      This is what the token contains (user information)
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                    <p className="text-sm text-red-800 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {/* Token Details */}
                {decodedToken && (
                  <div>
                    <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                      Token Details
                    </h2>
                    <div className="space-y-2">
                      {Object.entries(decodedToken).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded border border-gray-200 p-3 dark:border-gray-700"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {key}:
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cookie Info */}
                <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                  <h3 className="mb-2 text-sm font-medium text-green-800 dark:text-green-400">
                    ✓ Authenticated
                  </h3>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Token is stored in an HTTP-only cookie named{" "}
                    <code className="rounded bg-green-100 px-1 dark:bg-green-800">
                      jwt
                    </code>
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <h3 className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-400">
                  ⚠️ Not Authenticated
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  No JWT token found. Please{" "}
                  <a
                    href="/login"
                    className="underline hover:text-yellow-900 dark:hover:text-yellow-200"
                  >
                    login
                  </a>{" "}
                  or{" "}
                  <a
                    href="/signup"
                    className="underline hover:text-yellow-900 dark:hover:text-yellow-200"
                  >
                    signup
                  </a>{" "}
                  first.
                </p>
              </div>
            )}
          </div>

          {/* How to View in Browser */}
          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              How to View Token in Browser DevTools
            </h2>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <strong className="text-gray-900 dark:text-white">
                  Chrome/Edge:
                </strong>
                <ol className="ml-4 mt-1 list-decimal space-y-1">
                  <li>Open DevTools (F12)</li>
                  <li>Go to "Application" tab</li>
                  <li>Left sidebar: Cookies → http://localhost:3000</li>
                  <li>Find cookie named "jwt"</li>
                </ol>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">
                  Firefox:
                </strong>
                <ol className="ml-4 mt-1 list-decimal space-y-1">
                  <li>Open DevTools (F12)</li>
                  <li>Go to "Storage" tab</li>
                  <li>Cookies → http://localhost:3000</li>
                  <li>Find cookie named "jwt"</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            <a
              href="/"
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
            >
              ← Home
            </a>
            {token && (
              <a
                href="/dashboard"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Dashboard →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
