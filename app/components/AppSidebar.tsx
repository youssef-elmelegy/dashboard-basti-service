import {
  ChevronUp,
  Home,
  User2,
  MapPin,
  Building2,
  ChefHat,
  Package,
  Sparkles,
  Cake,
  Gift,
  Building,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoSvg from "@/assets/logo.svg";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

const AppSidebar = () => {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const items = [
    {
      title: t("sidebar.home"),
      url: "/",
      icon: Home,
    },
  ];

  const managementItems = [
    {
      title: t("sidebar.regions"),
      url: "/management/regions",
      icon: MapPin,
    },
    {
      title: t("sidebar.bakeries"),
      url: "/management/bakeries",
      icon: Building2,
    },
    {
      title: t("sidebar.chefs"),
      url: "/management/chefs",
      icon: ChefHat,
    },
  ];

  const productItems = [
    {
      title: t("sidebar.largeCakes"),
      url: "/products/large-cakes",
      icon: Sparkles,
    },
    {
      title: t("sidebar.smallCakes"),
      url: "/products/small-cakes",
      icon: Cake,
    },
    {
      title: t("sidebar.addOns"),
      url: "/products/add-ons",
      icon: Gift,
    },
  ];

  const orderItems = [
    {
      title: t("sidebar.orders"),
      url: "/orders",
      icon: Package,
    },
    {
      title: t("sidebar.bakeryOrders"),
      url: "/orders/bakery/bakery1",
      icon: Building,
    },
  ];

  return (
    <Sidebar collapsible="icon" side={isRTL ? "right" : "left"}>
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                <img src={logoSvg} alt="logo" width={18} height={18} />
                <span>Basti</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.main")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.orders")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {orderItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.management")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.products")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {productItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> John Doe <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>{t("sidebar.account")}</DropdownMenuItem>
                <DropdownMenuItem>{t("sidebar.setting")}</DropdownMenuItem>
                <DropdownMenuItem>{t("sidebar.signOut")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
