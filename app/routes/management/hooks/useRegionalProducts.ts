import { useState, useEffect, useRef, useCallback } from "react";
import {
  regionApi,
  type RegionalProductType,
} from "@/lib/services/region.service";
import type { ProductData } from "../types";

export function useRegionalProducts(
  regionId: string | undefined,
  types?: RegionalProductType[],
) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Serialize so the effect only re-runs when the actual filter changes,
  // not on every re-render that rebuilds the array.
  const typesKey = types && types.length > 0 ? types.join(",") : "";
  const cacheKey = `${regionId ?? ""}|${typesKey}`;

  // Results already fetched for a given region+filter, so flipping back to a
  // filter you've already viewed renders from memory instead of refetching.
  const cacheRef = useRef<Map<string, ProductData[]>>(new Map());
  // Tracks the filter the UI is currently showing, so a slow in-flight
  // response for an abandoned filter can't overwrite it.
  const activeKeyRef = useRef(cacheKey);

  useEffect(() => {
    activeKeyRef.current = cacheKey;

    if (!regionId) return;

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setProducts(cached);
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await regionApi.getRegionalProducts(regionId, {
          types: typesKey
            ? (typesKey.split(",") as RegionalProductType[])
            : undefined,
          page: 1,
          limit: 1000,
        });
        const data = response.data;
        if (data && "items" in data) {
          const items = data.items as unknown as ProductData[];
          cacheRef.current.set(cacheKey, items);
          if (activeKeyRef.current === cacheKey) setProducts(items);
        }
      } catch (error) {
        console.error("Failed to fetch regional products:", error);
      } finally {
        if (activeKeyRef.current === cacheKey) setIsLoading(false);
      }
    };

    fetchProducts();
  }, [regionId, cacheKey, typesKey]);

  // Any mutation (add / edit / delete) invalidates every other cached filter,
  // since we can't know which families the change belongs to. The active
  // filter keeps the caller's new list so the UI stays optimistic.
  const replaceProducts = useCallback(
    (update: React.SetStateAction<ProductData[]>) => {
      setProducts((prev) => {
        const next =
          typeof update === "function"
            ? (update as (p: ProductData[]) => ProductData[])(prev)
            : update;
        cacheRef.current.clear();
        cacheRef.current.set(activeKeyRef.current, next);
        return next;
      });
    },
    [],
  );

  const updateProduct = useCallback(
    (productId: string, updates: Partial<ProductData>) => {
      replaceProducts((prevProducts) =>
        prevProducts.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
      );
    },
    [replaceProducts],
  );

  return {
    products,
    isLoading,
    updateProduct,
    setProducts: replaceProducts,
  };
}
