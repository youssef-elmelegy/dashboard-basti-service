import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getSidebarState } from "@/lib/sidebar-cookies";

export default function Root() {
  const defaultOpen = getSidebarState();
  // Direction/lang on <html> is owned centrally by i18n/config.ts.

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <div className="w-full h-screen flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto m-5 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
