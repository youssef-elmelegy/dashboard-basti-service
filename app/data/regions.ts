/**
 * Regions Data
 *
 * This is mock data that demonstrates the structure.
 *
 * In production, this would come from:
 * 1. API call: const regions = await fetch('/api/regions')
 * 2. Caching layer (React Query, SWR, Redux, etc.)
 * 3. Server component with revalidation
 *
 * The pattern allows:
 * - Shared data across pages (Regions, Bakeries, etc.)
 * - Single source of truth for region list
 * - Easy integration with real API later
 * - Caching strategies at the data layer
 */

export type Region = {
  id: string;
  name: string;
};

export const REGIONS_DATA: Region[] = [
  { id: "region1", name: "Cairo" },
  { id: "region2", name: "Alexandria" },
  { id: "region3", name: "Giza" },
  { id: "region4", name: "Aswan" },
];
