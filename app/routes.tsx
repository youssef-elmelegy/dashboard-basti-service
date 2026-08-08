import { lazy, Suspense } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import Root from "@/root";
import NotFoundPage from "@/routes/not-found";
import LoginPage from "@/routes/auth/login";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import { rolesFor, type Capability } from "@/lib/permissions";
import RouteErrorBoundary from "@/components/ErrorFallback";

const ManagerDashboard = lazy(() => import("@/routes/manager-dashboard"));
const Orders = lazy(() => import("@/routes/orders"));
const CompletedOrders = lazy(() => import("@/routes/completed-orders"));
const DispatchPage = lazy(() => import("@/routes/dispatch"));
const BakeryOrders = lazy(() => import("@/routes/bakery-orders"));
const BakeryCompletedOrders = lazy(() => import("@/routes/bakery-completed-orders"));
const BakeryOrderDetail = lazy(() => import("@/routes/bakery-order-detail"));
const BakeryStock = lazy(() => import("@/routes/bakery-stock"));
const BakeryReviews = lazy(() => import("@/routes/bakery-reviews"));
const Customers = lazy(() => import("@/routes/customers"));
const Settings = lazy(() => import("@/routes/settings"));
const Support = lazy(() => import("@/routes/support"));
const PaymentsPage = lazy(() => import("@/routes/payments"));
const RegionsPage = lazy(() => import("@/routes/management/regions"));
const RegionDetailPage = lazy(() => import("@/routes/management/region-detail"));
const RegionDriversPage = lazy(() => import("@/routes/management/region-drivers"));
const DriverDetailPage = lazy(() => import("@/routes/management/driver-detail"));
const BakeriesPage = lazy(() => import("@/routes/management/bakeries"));
const BakeryDetailPage = lazy(() => import("@/routes/management/bakery-detail"));
const ChefsPage = lazy(() => import("@/routes/management/chefs"));
const AdminsPage = lazy(() => import("@/routes/management/admins"));
const SliderImagesPage = lazy(() => import("@/routes/management/slider-images"));
const AppConfigPage = lazy(() => import("@/routes/management/app-config"));
const TagsPage = lazy(() => import("@/routes/management/tags"));
const FeaturedCakesPage = lazy(() => import("@/routes/products/featured-cakes"));
const AddOnsPage = lazy(() => import("@/routes/products/add-ons"));
const SweetsPage = lazy(() => import("@/routes/sweets"));
const FlavorsPage = lazy(() => import("@/routes/custom-cakes/flavors"));
const ShapesPage = lazy(() => import("@/routes/custom-cakes/shapes"));
const DecorationsPage = lazy(() => import("@/routes/custom-cakes/decorations"));
const PredesignedCakesPage = lazy(() => import("@/routes/custom-cakes/predesigned-cakes"));
const CouponsPage = lazy(() => import("@/routes/advertisement/coupons"));
const OffersPage = lazy(() => import("@/routes/advertisement/offers"));
const FinanceOrdersPage = lazy(() => import("@/routes/finance/orders"));
const BakeryFinancePage = lazy(() => import("@/routes/finance/bakery"));
const ForgotPasswordPage = lazy(() => import("@/routes/auth/forgot-password"));
const OTPVerifyPage = lazy(() => import("@/routes/auth/otp-verify"));
const ResetPasswordPage = lazy(() => import("@/routes/auth/reset-password"));
const OrderDetailPage = lazy(() => import("@/routes/order-detail"));
const ItemDetailPage = lazy(() => import("@/routes/item-detail"));
const NotificationsPage = lazy(() => import("@/routes/notifications"));

/**
 * Fallback shown while a route's JS chunk is being fetched. Deliberately a
 * bare sized box rather than a spinner: chunks are small and usually arrive
 * within a frame or two, and a spinner that flashes for 50ms reads as jank.
 */
const RouteFallback = () => <div className="min-h-[50vh]" />;

/**
 * Attach the error boundary to every route in a list, and put each page
 * behind Suspense so its lazily-loaded chunk has somewhere to suspend.
 *
 * The boundary is applied to the children of "/" so a crashing page is
 * contained inside <main> and the user keeps the sidebar and navbar to
 * navigate away with. Putting a boundary only on "/" would replace the whole
 * shell instead, leaving no way out but a manual URL edit.
 *
 * Suspense sits *inside* the error boundary (rather than wrapping the router)
 * so that a chunk which fails to download — a stale hash after a redeploy,
 * say — surfaces in the page area with the shell still usable, matching how
 * a render crash behaves.
 */
const withErrorBoundary = (routes: RouteObject[]): RouteObject[] =>
  routes.map((route) => ({
    ...route,
    element: <Suspense fallback={<RouteFallback />}>{route.element}</Suspense>,
    errorElement: <RouteErrorBoundary />,
  }));

/**
 * Wrap a group of routes in a role guard.
 *
 * The sidebar already hides links a role cannot use, but that only removes the
 * entry point — the URLs stayed reachable by typing, a bookmark, or an in-app
 * button pointing somewhere the user can't go. Guarding here means the page
 * never mounts and never fires the request it would be rejected for.
 */
const restrictTo = (
  capability: Capability,
  routes: RouteObject[],
): RouteObject[] =>
  routes.map((route) => ({
    ...route,
    element: (
      <ProtectedRoute requiredRole={[...rolesFor(capability)]}>
        {route.element}
      </ProtectedRoute>
    ),
  }));

export const router = createBrowserRouter([
  {
    path: "/auth",
    errorElement: <RouteErrorBoundary />,
    children: withErrorBoundary([
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
    ]),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Root />
      </ProtectedRoute>
    ),
    // Catches crashes in ProtectedRoute/Root itself (i.e. the shell). Page-level
    // crashes are caught by the per-child boundaries below, which preserve it.
    errorElement: <RouteErrorBoundary />,
    children: withErrorBoundary([
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
        path: "dispatch",
        element: <DispatchPage />,
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
        path: "settings",
        element: (
          <ProtectedRoute requiredRole={["super_admin", "admin"]}>
            <Settings />
          </ProtectedRoute>
        ),
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
      // Cross-bakery administration: a bakery manager is scoped to their own
      // bakery and has no business in these, so they redirect home instead of
      // rendering a full list of every bakery/region/chef.
      ...restrictTo("viewAllContent", [
        {
          path: "management/regions",
          element: <RegionsPage />,
        },
        {
          path: "management/regions/:id",
          element: <RegionDetailPage />,
        },
        {
          path: "management/regions/:id/drivers",
          element: <RegionDriversPage />,
        },
        {
          path: "management/regions/:id/drivers/:driverId",
          element: <DriverDetailPage />,
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
      ]),
      {
        path: "management/admins",
        // Guarded to match the backend: every admins endpoint, including the
        // list, is super_admin-only. Anyone else reaching this by URL is sent
        // home instead of shown a 403 on an empty table.
        element: (
          <ProtectedRoute requiredRole={[...rolesFor("manageAdmins")]}>
            <AdminsPage />
          </ProtectedRoute>
        ),
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
      {
        path: "finance/bakery",
        element: <BakeryFinancePage />,
      },
    ]),
  },
  {
    path: "*",
    element: <NotFoundPage />,
    errorElement: <RouteErrorBoundary />,
  },
]);
