import { useState, useEffect } from "react";
import { browser } from "wxt/browser";
import { MessageType, type AuthState } from "@/src/types/auth";
import { LoginPage } from "@/src/components/LoginPage";
import { ChatRoom } from "@/src/components/ChatRoom";

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  // Listen for storage changes (when user logs in from another tab)
  useEffect(() => {
    const handleStorageChange = (changes: any) => {
      if (changes.authToken) {
        loadAuthState();
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadAuthState = async () => {
    try {
      const response = await browser.runtime.sendMessage({
        type: MessageType.GET_AUTH_STATE,
      });
      setAuthState(response);
    } catch (error) {
      console.error("Failed to load auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await browser.runtime.sendMessage({
        type: MessageType.AUTH_LOGOUT,
      });
      setAuthState({
        isAuthenticated: false,
        token: null,
      });
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authState.isAuthenticated) {
    return <LoginPage />;
  }

  // Show chat interface when authenticated
  return <ChatRoom onLogout={handleLogout} />;
}

export default App;
