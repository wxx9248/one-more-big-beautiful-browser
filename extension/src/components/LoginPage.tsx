import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { browser } from "wxt/browser";

interface LoginPageProps {
  authUrl?: string;
}

export function LoginPage({ authUrl }: LoginPageProps) {
  const handleLogin = async () => {
    const loginUrl =
      authUrl || import.meta.env.VITE_AUTH_URL || "http://localhost:3001/login";

    try {
      // Open auth URL in a new tab
      await browser.tabs.create({ url: loginUrl });
    } catch (error) {
      console.error("Failed to open login page:", error);
    }
  };

  return (
    <div className="fixed top-0 left-0 h-screen w-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please log in to access the application.
          </p>
          <Button onClick={handleLogin} className="w-full">
            Log In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
