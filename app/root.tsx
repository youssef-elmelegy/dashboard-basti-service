import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getSidebarState } from "@/lib/sidebar-cookies";

export default function Root() {
  const defaultOpen = getSidebarState();
  const { i18n } = useTranslation();
  // Direction/lang on <html> is owned centrally by i18n/config.ts.

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <div className="w-full h-screen flex flex-col overflow-hidden">
        <Navbar />
        {/*
          Keying on the active language remounts the routed page on every
          language switch. i18n/config.ts invalidates the API-backed stores
          (isCached -> false) in its "languageChanged" listener, which runs
          before React commits this remount, so each page's mount-effect
          refetches and gets data in the new language. Routes fetch on mount
          with stable Zustand action deps, so without the remount nothing
          would re-run and the current page would keep stale-language data.
          The key is scoped to <main> so the sidebar/navbar shell is preserved.
        */}
        <main
          key={i18n.language}
          className="flex-1 overflow-y-auto m-5 custom-scrollbar"
        >
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
