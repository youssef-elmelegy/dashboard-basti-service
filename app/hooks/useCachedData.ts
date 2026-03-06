import { useEffect } from "react";

/**
 * Hook to load data with caching support
 *
 * Usage:
 * const { isCached, data } = useStore();
 * useCachedData(isCached, fetchData);
 *
 * This will:
 * - Skip API calls if data is already cached
 * - Use cached data when returning to the page
 * - Provide forceRefresh option to manually refresh
 */
export const useCachedData = (
  isCached: boolean,
  fetchFn: (forceRefresh?: boolean) => void,
  dependencies: any[] = [],
) => {
  useEffect(() => {
    // Only fetch if not cached
    if (!isCached) {
      fetchFn();
    }
  }, [isCached, fetchFn, ...dependencies]);
};

/**
 * Helper to invalidate cache when needed
 * Usage: invalidateCache(usePredesignedCakeStore, 'isCached')
 */
export const invalidateCache = <T extends { isCached: boolean }>(
  store: { setState: (state: Partial<T>) => void },
  forceRefresh?: boolean,
) => {
  if (forceRefresh) {
    store.setState({ isCached: false } as Partial<T>);
  }
};
