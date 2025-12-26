import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getSidebarState } from "@/lib/sidebar-cookies";

export default function Root() {
  const defaultOpen = getSidebarState();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <div className="w-full flex flex-col">
        <Navbar />
        <main className="px-4 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
