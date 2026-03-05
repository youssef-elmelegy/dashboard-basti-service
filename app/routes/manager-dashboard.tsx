import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Manager dashboard - redirects to their bakery orders page
 */
export default function ManagerDashboard() {
  const { admin } = useAuth();

  // If user is not a manager or doesn't have a bakeryId, redirect to main dashboard
  if (admin?.role !== "manager" || !admin?.bakeryId) {
    return <Navigate to="/" replace />;
  }

  // Redirect manager to their bakery orders
  return <Navigate to={`/orders/bakery/${admin.bakeryId}`} replace />;
}
