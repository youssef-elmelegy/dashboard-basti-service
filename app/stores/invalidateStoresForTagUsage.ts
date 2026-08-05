/**
 * Invalidate the product stores affected by a tag deletion.
 *
 * Force-deleting a tag clears `tag_id` on every product that used it and hides
 * any slider image linked to it. Those rows are already cached in their stores
 * with the old tagId/tagName, so without this the dashboard keeps showing a tag
 * that no longer exists until a full reload.
 *
 * Only the stores the usage report actually touched are invalidated — there is
 * no reason to force a refetch of, say, coupons because a sweets tag was
 * removed. See `invalidateAllStores` for the language-change case, where every
 * store genuinely does need to refetch.
 */

import { useAddOnStore } from "./addOnStore";
import { useDecorationStore } from "./decorationStore";
import { useFeaturedCakeStore } from "./featuredCakeStore";
import { usePredesignedCakeStore } from "./predesignedCakeStore";
import { useSliderImageStore } from "./sliderImageStore";
import { useSweetStore } from "./sweetStore";
import type { TagUsage } from "@/lib/services/tags.service";

export function invalidateStoresForTagUsage(usage: TagUsage | null) {
  // Without a usage report we cannot tell what was affected, so invalidate
  // every product store rather than risk leaving stale tags on screen.
  if (!usage) {
    useSweetStore.getState().invalidate();
    useAddOnStore.getState().invalidate();
    useDecorationStore.getState().invalidate();
    usePredesignedCakeStore.getState().invalidate();
    useFeaturedCakeStore.getState().invalidate();
    useSliderImageStore.getState().invalidate();
    return;
  }

  if (usage.sweets > 0) useSweetStore.getState().invalidate();
  if (usage.addons > 0) useAddOnStore.getState().invalidate();
  if (usage.decorations > 0) useDecorationStore.getState().invalidate();
  if (usage.predesignedCakes > 0) usePredesignedCakeStore.getState().invalidate();
  if (usage.featuredCakes > 0) useFeaturedCakeStore.getState().invalidate();
  if (usage.sliderImages.length > 0) useSliderImageStore.getState().invalidate();
}
