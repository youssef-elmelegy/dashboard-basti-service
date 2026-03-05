import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";

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

  if (!isInitialized) {
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
