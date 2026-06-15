import {
  Home,
  MapPin,
  Building2,
  ChefHat,
  Users,
  Package,
  PackageCheck,
  Truck,
  Boxes,
  Star,
  Cake,
  Gift,
  Palette,
  Shapes,
  Flower,
  Film,
  Tag,
  Settings,
  BadgePercent,
  ReceiptText,
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
  const { canViewAllContent, admin, isManager } = useAuth();
  const isRTL = i18n.language === "ar";
  const showManagerOrders = isManager() && admin?.bakeryId;

  // Bakery managers go straight to their orders, so the global home link is hidden for them.
  const items = isManager()
    ? []
    : [
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
    {
      title: t("sidebar.tags"),
      url: "/management/tags",
      icon: Tag,
    },
    {
      title: t("sidebar.appConfig"),
      url: "/management/app-config",
      icon: Settings,
    },
    {
      title: t("sidebar.finance"),
      url: "/finance/orders",
      icon: ReceiptText,
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

  const advertisementItems = [
    {
      title: t("sidebar.coupons"),
      url: "/advertisement/coupons",
      icon: BadgePercent,
    },
    {
      title: t("sidebar.offers"),
      url: "/advertisement/offers",
      icon: Tag,
    },
  ];

  const orderItems = [
    {
      title: t("sidebar.orders"),
      url: "/orders",
      icon: Package,
    },
    {
      title: t("sidebar.completedOrders"),
      url: "/completed-orders",
      icon: PackageCheck,
    },
    {
      title: t("sidebar.dispatch"),
      url: "/dispatch",
      icon: Truck,
    },
  ];

  const managerOrderItems = admin?.bakeryId
    ? [
        {
          title: t("sidebar.orders") || "Active Orders",
          url: `/orders/bakery/${admin.bakeryId}`,
          icon: Package,
        },
        {
          title: t("sidebar.completedOrders") || "Completed Orders",
          url: `/orders/bakery/${admin.bakeryId}/completed`,
          icon: PackageCheck,
        },
        {
          title: t("sidebar.stock") || "Stock",
          url: "/bakery-stock",
          icon: Boxes,
        },
        {
          title: t("sidebar.reviews") || "Reviews",
          url: "/bakery-reviews",
          icon: Star,
        },
        {
          title: t("sidebar.finance"),
          url: "/finance/bakery",
          icon: ReceiptText,
        },
      ]
    : [];

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
        {items.length > 0 && (
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
        )}

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

        {showManagerOrders && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.orders")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managerOrderItems.map((item) => (
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

        {canViewAllContent() && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.advertisement")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {advertisementItems.map((item) => (
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
