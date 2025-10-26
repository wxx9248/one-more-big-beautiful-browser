import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Code } from "@heroui/code";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { logoutAction } from "@/controller/auth-actions";
import { getAuthToken, isAuthenticated } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

interface DecodedToken {
  user_id?: string;
  email?: string;
  name?: string;
  // Firebase token fields
  uid?: string;
  email_verified?: boolean;
  // Custom token fields
  id?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

export default async function DashboardPage() {
  // Check authentication on server side
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  // Get and decode the token
  const token = await getAuthToken();
  let decodedToken: DecodedToken | null = null;
  let tokenPreview = "";

  if (token) {
    try {
      // Decode token without verification (Firebase tokens are verified by Firebase)
      // For production, you should verify Firebase tokens using Firebase Admin SDK
      decodedToken = jwt.decode(token) as DecodedToken;
      tokenPreview = token.substring(0, 40);

      if (!decodedToken) {
        // Token is invalid, redirect to login
        redirect("/login");
      }
    } catch (error) {
      // Token is invalid, redirect to login
      redirect("/login");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <Card className="p-6">
          <CardHeader>
            <div className="flex flex-col gap-2 items-start">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-default-500">
                Welcome back,{" "}
                {decodedToken?.name ||
                  decodedToken?.username ||
                  decodedToken?.email ||
                  "User"}
                !
              </p>
            </div>
          </CardHeader>

          <CardBody>
            <div className="flex flex-col gap-6">
              {/* Success Message */}
              <div className="flex items-center gap-3 bg-success/10 p-4 rounded-lg">
                <svg
                  className="w-6 h-6 text-success flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-success">
                    Authentication Successful
                  </p>
                  <p className="text-success">
                    You have full access to the dashboard
                  </p>
                </div>
              </div>

              <Divider />

              {/* Token Status */}
              {decodedToken && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Token Status</h3>
                    <Chip color="success" variant="flat" size="sm">
                      Active
                    </Chip>
                  </div>
                  <div className="space-y-2">
                    <Code className="block">
                      User ID: {decodedToken.uid || decodedToken.id || "N/A"}
                    </Code>
                    <Code className="block">
                      Email: {decodedToken.email || "N/A"}
                    </Code>
                    {decodedToken.email_verified !== undefined && (
                      <Code className="block">
                        Email Verified:{" "}
                        {decodedToken.email_verified ? "Yes" : "No"}
                      </Code>
                    )}
                    <Code className="block">JWT: {tokenPreview}...</Code>
                  </div>
                  <p className="text-default-400">
                    Your session token is stored securely and will be used for
                    authenticated requests
                  </p>
                </div>
              )}

              <Divider />

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-divider p-4 rounded-lg">
                  <p className="text-default-500">Session Duration</p>
                  <p className="text-2xl font-bold mt-1">24h</p>
                </div>
                <div className="border border-divider p-4 rounded-lg">
                  <p className="text-default-500">API Calls</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                </div>
                <div className="border border-divider p-4 rounded-lg">
                  <p className="text-default-500">Storage Used</p>
                  <p className="text-2xl font-bold mt-1">0 KB</p>
                </div>
              </div>
            </div>
          </CardBody>

          <CardFooter>
            <div className="flex flex-col gap-3 w-full">
              <Divider />
              <div className="flex items-center justify-between">
                <p className="text-default-500">Ready to leave?</p>
                <form action={logoutAction}>
                  <Button type="submit" color="danger" variant="flat" size="sm">
                    Logout
                  </Button>
                </form>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
