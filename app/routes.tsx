import { createBrowserRouter } from "react-router-dom";
import Root from "@/root";
import Dashboard from "@/routes/dashboard";
import Orders from "@/routes/orders";
import BakeryOrders from "@/routes/bakery-orders";
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
import CustomCreationsPage from "@/routes/products/custom-creations";
import SmallCakesPage from "@/routes/products/small-cakes";
import AddOnsPage from "@/routes/products/add-ons";
import NotFoundPage from "@/routes/not-found";
import LoginPage from "@/routes/auth/login";
import ForgotPasswordPage from "@/routes/auth/forgot-password";
import OTPVerifyPage from "@/routes/auth/otp-verify";
import ResetPasswordPage from "@/routes/auth/reset-password";
import OrderDetailPage from "@/routes/order-detail";

export const router = createBrowserRouter([
  {
    path: "/auth",
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "otp-verify",
        element: <OTPVerifyPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "orders/:id",
        element: <OrderDetailPage />,
      },
      {
        path: "orders/bakery/:id",
        element: <BakeryOrders />,
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
        path: "management/regions/:name",
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
        path: "products/custom-creations",
        element: <CustomCreationsPage />,
      },
      {
        path: "products/small-cakes",
        element: <SmallCakesPage />,
      },
      {
        path: "products/add-ons",
        element: <AddOnsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
