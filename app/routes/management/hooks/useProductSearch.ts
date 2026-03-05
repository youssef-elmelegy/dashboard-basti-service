import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { getProductEndpoint } from "../utils/productTypeEndpoints";
import type { ProductType, ProductData } from "../types";

interface ApiResponse<T> {
  data?:
    | {
        items?: T[];
      }
    | T[]
    | T;
  statusCode?: number;
  message?: string;
}

export function useProductSearch(
  productType: ProductType | "",
  searchQuery: string,
) {
  const [results, setResults] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch products based on type and search query
  useEffect(() => {
    if (!productType) {
      setResults([]);
      setCurrentPage(1);
      setHasMore(true);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const endpoint = getProductEndpoint(productType, 1, 10, searchQuery);
        const response =
          await apiClient.get<ApiResponse<ProductData>>(endpoint);
        const data = response.data;

        let products: ProductData[] = [];
        if (data && typeof data === "object") {
          if ("items" in data && Array.isArray(data.items)) {
            products = data.items;
          } else if (Array.isArray(data)) {
            products = data;
          } else {
            products = [data as ProductData];
          }
        }

        setResults(products);
        setCurrentPage(1);
        setHasMore(products.length >= 10);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, searchQuery ? 300 : 0);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, productType]);

  // Load more products
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !productType) return;

    const nextPage = currentPage + 1;
    setIsLoading(true);

    try {
      const endpoint = getProductEndpoint(
        productType,
        nextPage,
        10,
        searchQuery,
      );
      const response = await apiClient.get<ApiResponse<ProductData>>(endpoint);
      const data = response.data;

      let products: ProductData[] = [];
      if (data && typeof data === "object") {
        if ("items" in data && Array.isArray(data.items)) {
          products = data.items;
        } else if (Array.isArray(data)) {
          products = data;
        } else {
          products = [data as ProductData];
        }
      }

      setResults((prev) => [...prev, ...products]);
      setCurrentPage(nextPage);
      setHasMore(products.length >= 10);
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, productType, currentPage, searchQuery]);

  return {
    results,
    isLoading,
    hasMore,
    loadMore,
  };
}
