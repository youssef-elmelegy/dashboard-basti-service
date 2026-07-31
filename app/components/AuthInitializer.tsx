import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";

/** Auth screens render immediately — they never depend on the session probe. */
const isAuthRoute = () =>
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/auth");

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const checkAuth = useAuthStore.getState().checkAuth;
        await checkAuth();
      } catch (error) {
        console.error("Initial auth check failed:", error);
        // Set auth to false so ProtectedRoute will handle redirect
        useAuthStore.setState({
          admin: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Gate only the protected side of the app on the session probe. Auth screens
  // render straight away: blocking them meant every cold load showed a
  // full-screen spinner while check-auth (plus its 401 refresh + retry) went
  // out, which on a slow connection is seconds of blank page before the login
  // form appears — and a logged-out user is exactly who lands there.
  if (!isInitialized && !isAuthRoute()) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-gray-300 rounded mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
