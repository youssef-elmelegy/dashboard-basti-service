/**
 * Invalidate all API-backed Zustand stores on language change.
 *
 * Store data (names, labels, etc.) is locale-dependent, so when the user
 * switches language every store that caches API data must be invalidated
 * to refetch in the new language. Pure-UI-state stores (e.g. dialog
 * visibility) don't hold API data and are intentionally excluded.
 */

import { useAddOnStore } from "./addOnStore";
import { useAdminStore } from "./adminStore";
import { useAssignedOrdersStore } from "./assignedOrdersStore";
import { useBakeryCompletedOrdersStore } from "./bakeryCompletedOrdersStore";
import { useBakeryItemStore } from "./bakeryItemStore";
import { useBakeryStore } from "./bakeryStore";
import { useChefStore } from "./chefStore";
import { useCompletedOrdersStore } from "./completedOrdersStore";
import { useConfigStore } from "./configStore";
import { useCouponStore } from "./couponStore";
import { useDecorationStore } from "./decorationStore";
import { useDispatchStore } from "./dispatchStore";
import { useDriverStore } from "./driverStore";
import { useFeaturedCakeStore } from "./featuredCakeStore";
import { useFlavorStore } from "./flavorStore";
import { useNotificationStore } from "./notificationStore";
import { useOfferStore } from "./offerStore";
import { useOrderStore } from "./orderStore";
import { usePredesignedCakeStore } from "./predesignedCakeStore";
import { useRegionStore } from "./regionStore";
import { useReportStore } from "./reportStore";
import { useReviewStore } from "./reviewStore";
import { useShapeStore } from "./shapeStore";
import { useSliderImageStore } from "./sliderImageStore";
import { useSweetStore } from "./sweetStore";
import { useTagsStore } from "./tagsStore";
import { useUnassignedOrdersStore } from "./unassignedOrdersStore";

export function invalidateAllStores() {
  useAddOnStore.getState().invalidate();
  useAdminStore.getState().invalidate();
  useAssignedOrdersStore.getState().invalidate();
  useBakeryCompletedOrdersStore.getState().invalidate();
  useBakeryItemStore.getState().invalidate();
  useBakeryStore.getState().invalidate();
  useChefStore.getState().invalidate();
  useCompletedOrdersStore.getState().invalidate();
  useConfigStore.getState().invalidate();
  useCouponStore.getState().invalidate();
  useDecorationStore.getState().invalidate();
  useDispatchStore.getState().invalidate();
  useDriverStore.getState().invalidate();
  useFeaturedCakeStore.getState().invalidate();
  useFlavorStore.getState().invalidate();
  useNotificationStore.getState().invalidate();
  useOfferStore.getState().invalidate();
  useOrderStore.getState().invalidate();
  usePredesignedCakeStore.getState().invalidate();
  useRegionStore.getState().invalidate();
  useReportStore.getState().invalidate();
  useReviewStore.getState().invalidate();
  useShapeStore.getState().invalidate();
  useSliderImageStore.getState().invalidate();
  useSweetStore.getState().invalidate();
  useTagsStore.getState().invalidate();
  useUnassignedOrdersStore.getState().invalidate();
}
