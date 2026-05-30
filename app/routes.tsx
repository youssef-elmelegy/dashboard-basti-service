import { createBrowserRouter } from "react-router-dom";
import Root from "@/root";
import ManagerDashboard from "@/routes/manager-dashboard";
import Orders from "@/routes/orders";
import CompletedOrders from "@/routes/completed-orders";
import BakeryOrders from "@/routes/bakery-orders";
import BakeryCompletedOrders from "@/routes/bakery-completed-orders";
import BakeryOrderDetail from "@/routes/bakery-order-detail";
import BakeryStock from "@/routes/bakery-stock";
import BakeryReviews from "@/routes/bakery-reviews";
import Customers from "@/routes/customers";
import CustomerDetail from "@/routes/customer-detail";
import Settings from "@/routes/settings";
import Support from "@/routes/support";
import PaymentsPage from "@/routes/payments";
import RegionsPage from "@/routes/management/regions";
import RegionDetailPage from "@/routes/management/region-detail";
import BakeriesPage from "@/routes/management/bakeries";
import BakeryDetailPage from "@/routes/management/bakery-detail";
import ChefsPage from "@/routes/management/chefs";
import AdminsPage from "@/routes/management/admins";
import SliderImagesPage from "@/routes/management/slider-images";
import AppConfigPage from "@/routes/management/app-config";
import TagsPage from "@/routes/management/tags";
import FeaturedCakesPage from "@/routes/products/featured-cakes";
import AddOnsPage from "@/routes/products/add-ons";
import SweetsPage from "@/routes/sweets";
import FlavorsPage from "@/routes/custom-cakes/flavors";
import ShapesPage from "@/routes/custom-cakes/shapes";
import DecorationsPage from "@/routes/custom-cakes/decorations";
import PredesignedCakesPage from "@/routes/custom-cakes/predesigned-cakes";
import CouponsPage from "@/routes/advertisement/coupons";
import OffersPage from "@/routes/advertisement/offers";
import FinanceOrdersPage from "@/routes/finance/orders";
import NotFoundPage from "@/routes/not-found";
import LoginPage from "@/routes/auth/login";
import ForgotPasswordPage from "@/routes/auth/forgot-password";
import OTPVerifyPage from "@/routes/auth/otp-verify";
import ResetPasswordPage from "@/routes/auth/reset-password";
import OrderDetailPage from "@/routes/order-detail";
import ItemDetailPage from "@/routes/item-detail";
import NotificationsPage from "@/routes/notifications";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/auth",
    children: [
      {
        path: "login",
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        ),
      },
      {
        path: "otp-verify",
        element: (
          <PublicRoute>
            <OTPVerifyPage />
          </PublicRoute>
        ),
      },
      {
        path: "reset-password",
        element: (
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        ),
      },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Root />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ManagerDashboard />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "completed-orders",
        element: <CompletedOrders />,
      },
      {
        path: "orders/:id",
        element: <OrderDetailPage />,
      },
      {
        path: "item-detail",
        element: <ItemDetailPage />,
      },
      {
        path: "orders/bakery/:id",
        element: <BakeryOrders />,
      },
      {
        path: "orders/bakery/:id/completed",
        element: <BakeryCompletedOrders />,
      },
      {
        path: "orders/bakery/:bakeryId/orders/:orderId",
        element: <BakeryOrderDetail />,
      },
      {
        path: "bakery-stock",
        element: <BakeryStock />,
      },
      {
        path: "bakery-reviews",
        element: <BakeryReviews />,
      },
      {
        path: "customers",
        element: <Customers />,
      },
      {
        path: "customers/:username",
        element: <CustomerDetail />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "notifications",
        element: <NotificationsPage />,
      },
      {
        path: "support",
        element: <Support />,
      },
      {
        path: "payments",
        element: <PaymentsPage />,
      },
      {
        path: "management/regions",
        element: <RegionsPage />,
      },
      {
        path: "management/regions/:id",
        element: <RegionDetailPage />,
      },
      {
        path: "management/bakeries",
        element: <BakeriesPage />,
      },
      {
        path: "management/bakeries/:id",
        element: <BakeryDetailPage />,
      },
      {
        path: "management/chefs",
        element: <ChefsPage />,
      },
      {
        path: "management/admins",
        element: <AdminsPage />,
      },
      {
        path: "management/slider-images",
        element: <SliderImagesPage />,
      },
      {
        path: "management/tags",
        element: <TagsPage />,
      },
      {
        path: "management/app-config",
        element: <AppConfigPage />,
      },
      {
        path: "products/featured-cakes",
        element: <FeaturedCakesPage />,
      },
      {
        path: "products/add-ons",
        element: <AddOnsPage />,
      },
      {
        path: "sweets",
        element: <SweetsPage />,
      },
      {
        path: "custom-cakes/flavors",
        element: <FlavorsPage />,
      },
      {
        path: "custom-cakes/shapes",
        element: <ShapesPage />,
      },
      {
        path: "custom-cakes/decorations",
        element: <DecorationsPage />,
      },
      {
        path: "custom-cakes/predesigned-cakes",
        element: <PredesignedCakesPage />,
      },
      {
        path: "advertisement/coupons",
        element: <CouponsPage />,
      },
      {
        path: "advertisement/offers",
        element: <OffersPage />,
      },
      {
        path: "finance/orders",
        element: <FinanceOrdersPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
