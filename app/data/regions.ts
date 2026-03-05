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
  image: string;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const REGIONS_DATA: Region[] = [
  {
    id: "23e2da5b-50a1-4f0e-b051-ce99a8fe620a",
    name: "Sirte",
    image:
      "http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038898/basti/general/1771038895856-sirte.png",
    isAvailable: true,
  },
  {
    id: "5e94f2f4-d65e-45e4-99a9-ed3d4d10c2ff",
    name: "Tobruk",
    image:
      "http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038923/basti/general/1771038922064-tobruk.png",
    isAvailable: true,
  },
  {
    id: "868046c7-bffc-4927-b504-f5c5eb7c5a24",
    name: "Tripoli",
    image:
      "http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038949/basti/general/1771038947054-tripoli.png",
    isAvailable: true,
  },
  {
    id: "92c9f70c-8980-4d21-a517-0f14a8056bb8",
    name: "Zawiya",
    image:
      "http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038986/basti/general/1771038984241-zawiya.png",
    isAvailable: true,
  },
];
