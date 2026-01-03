import { Outlet } from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getSidebarState } from "@/lib/sidebar-cookies";

export default function Root() {
  const defaultOpen = getSidebarState();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Apply saved language and direction on page load
    const savedLanguage = localStorage.getItem("i18nextLng") || "en";
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = savedLanguage;
  }, [i18n.language]);

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
