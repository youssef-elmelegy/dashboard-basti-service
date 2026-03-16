import {
  Home,
  MapPin,
  Building2,
  ChefHat,
  Users,
  Package,
  Cake,
  Gift,
  Palette,
  Shapes,
  Flower,
  Film,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoSvg from "@/assets/logo.svg";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";

const AppSidebar = () => {
  const { i18n, t } = useTranslation();
  const { canViewAllContent } = useAuth();
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
      title: t("sidebar.admins"),
      url: "/management/admins",
      icon: Users,
    },
    {
      title: t("sidebar.chefs"),
      url: "/management/chefs",
      icon: ChefHat,
    },
    {
      title: t("sidebar.sliderImages"),
      url: "/management/slider-images",
      icon: Film,
    },
  ];

  const productItems = [
    // {
    //   title: t("sidebar.largeCakes"),
    //   url: "/products/large-cakes",
    //   icon: Sparkles,
    // },
    // {
    //   title: t("sidebar.smallCakes"),
    //   url: "/products/small-cakes",
    //   icon: Cake,
    // },
    {
      title: t("sidebar.featuredCakes"),
      url: "/products/featured-cakes",
      icon: Cake,
    },
    {
      title: t("sidebar.addOns"),
      url: "/products/add-ons",
      icon: Gift,
    },
    {
      title: t("sidebar.sweets"),
      url: "/sweets",
      icon: Gift,
    },
  ];

  const customCakesItems = [
    {
      title: t("sidebar.flavors"),
      url: "/custom-cakes/flavors",
      icon: Palette,
    },
    {
      title: t("sidebar.shapes"),
      url: "/custom-cakes/shapes",
      icon: Shapes,
    },
    {
      title: t("sidebar.decorations"),
      url: "/custom-cakes/decorations",
      icon: Flower,
    },
    {
      title: t("sidebar.predesignedCakes"),
      url: "/custom-cakes/predesigned-cakes",
      icon: Cake,
    },
  ];

  const orderItems = [
    {
      title: t("sidebar.orders"),
      url: "/orders",
      icon: Package,
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

        {canViewAllContent() && (
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
        )}

        {canViewAllContent() && (
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
        )}

        {canViewAllContent() && (
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
        )}

        {canViewAllContent() && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.customCakes")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {customCakesItems.map((item) => (
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
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
