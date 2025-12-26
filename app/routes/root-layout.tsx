import { useState } from "react";
import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";
import AppSidebar from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getSidebarState, setSidebarState } from "@/lib/sidebar-cookies";

export default function Root() {
  const [defaultOpen] = useState(() => getSidebarState());

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <div className="flex h-screen">
            <SidebarProvider
              defaultOpen={defaultOpen}
              onOpenChange={setSidebarState}
            >
              <AppSidebar />
              <main className="w-full flex flex-col">
                <Navbar />
                <div className="px-4 flex-1 overflow-auto">
                  <Outlet />
                </div>
              </main>
            </SidebarProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
