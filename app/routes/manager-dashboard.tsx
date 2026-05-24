import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsList } from "@/components/NotificationsList";

/**
 * Home route — managers are redirected to their bakery orders,
 * everyone else sees the notifications list.
 */
export default function ManagerDashboard() {
  const { admin } = useAuth();

  if (admin?.role === "manager" && admin?.bakeryId) {
    return <Navigate to={`/orders/bakery/${admin.bakeryId}`} replace />;
  }

  return <NotificationsList />;
}
