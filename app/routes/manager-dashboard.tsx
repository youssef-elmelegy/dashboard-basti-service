import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsList } from "@/components/NotificationsList";
import { ReportsSidePanel } from "@/components/ReportsSidePanel";

/**
 * Home route — managers are redirected to their bakery orders,
 * everyone else sees the notifications list alongside a reports side panel.
 */
export default function ManagerDashboard() {
  const { admin } = useAuth();

  if (admin?.role === "manager" && admin?.bakeryId) {
    return <Navigate to={`/orders/bakery/${admin.bakeryId}`} replace />;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0">
        {/* Admin home shows only notifications that need action. */}
        <NotificationsList actionRequired />
      </div>
      <ReportsSidePanel className="lg:w-80 xl:w-96 lg:sticky lg:top-0 lg:max-h-[calc(100vh-7rem)]" />
    </div>
  );
}
