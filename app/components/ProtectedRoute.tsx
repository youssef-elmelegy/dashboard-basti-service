import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import type { AdminRole } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed through. Anyone else is bounced to the dashboard root. */
  requiredRole?: AdminRole | AdminRole[];
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, admin, isLoading } = useAuthStore();

  // Only hold the screen while a session probe is genuinely undecided. Once
  // we know the user is signed in, keep rendering them through subsequent
  // loading states (e.g. a background re-check) instead of flashing a spinner.
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-gray-300 rounded mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    if (!allowedRoles.includes(admin.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Deliberately NOT gated on isLoading. The store sets isLoading during the
  // login request itself, so swapping the form out for a spinner unmounted it
  // mid-submit — and on failure it remounted with fresh state, discarding the
  // error the form had just set. The form owns its own submit/pending UI, so
  // this only ever needs to answer "are we already signed in?".
  return <>{children}</>;
}
