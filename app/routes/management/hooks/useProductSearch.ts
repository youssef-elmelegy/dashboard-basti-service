import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { getProductEndpoint } from "../utils/productTypeEndpoints";
import type { ProductType, ProductData } from "../types";

interface PaginationInfo {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface ApiResponse<T> {
  data?:
    | {
        items?: T[];
        pagination?: PaginationInfo;
        total?: number;
        totalPages?: number;
        page?: number;
        limit?: number;
      }
    | T[]
    | T;
  statusCode?: number;
  message?: string;
}

function extractPaginationInfo(data: any): PaginationInfo | null {
  // Handle pagination at root level (featured-cakes, addons, sweets, predesigned)
  if (data && typeof data === "object" && "totalPages" in data) {
    const info = {
      total: data.total || 0,
      totalPages: data.totalPages || 1,
      page: data.page || 1,
      limit: data.limit || 10,
    };
    console.log("[Pagination] Root level:", info);
    return info;
  }

  // Handle pagination in nested pagination object (decorations, predesigned-cakes)
  if (data && typeof data === "object" && "pagination" in data) {
    const pagination = data.pagination;
    const info = {
      total: pagination.total || 0,
      totalPages: pagination.totalPages || 1,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
    };
    console.log("[Pagination] Nested object:", info);
    return info;
  }

  console.log("[Pagination] No pagination info found");
  return null;
}

function extractProducts(data: any): ProductData[] {
  if (!data) return [];

  // Handle items array with pagination info
  if (
    typeof data === "object" &&
    "items" in data &&
    Array.isArray(data.items)
  ) {
    return data.items;
  }

  // Handle direct array response (shapes)
  if (Array.isArray(data)) {
    return data;
  }

  // Handle single item
  if (typeof data === "object") {
    return [data as ProductData];
  }

  return [];
}

export function useProductSearch(
  productType: ProductType | "",
  searchQuery: string,
) {
  const [results, setResults] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch products based on type and search query
  useEffect(() => {
    if (!productType) {
      setResults([]);
      setCurrentPage(1);
      setTotalPages(1);
      setHasMore(false);
      return;
    }

    const fetchResults = async () => {
      console.log(
        `[FetchResults] Starting fetch for ${productType}, search: "${searchQuery}"`,
      );
      setIsLoading(true);
      try {
        const endpoint = getProductEndpoint(productType, 1, 10, searchQuery);
        console.log(`[FetchResults] Endpoint: ${endpoint}`);
        const response =
          await apiClient.get<ApiResponse<ProductData>>(endpoint);
        const responseData = response.data;

        const products = extractProducts(responseData);
        const paginationInfo = extractPaginationInfo(responseData);

        console.log(
          `[FetchResults] Got ${products.length} products, pagination:`,
          paginationInfo,
        );

        setResults(products);
        setCurrentPage(1);

        if (paginationInfo) {
          setTotalPages(paginationInfo.totalPages);
          const shouldHaveMore = 1 < paginationInfo.totalPages;
          console.log(
            `[FetchResults] Page 1 < totalPages ${paginationInfo.totalPages} = hasMore: ${shouldHaveMore}`,
          );
          setHasMore(shouldHaveMore);
        } else {
          // For responses without pagination info, assume single page
          setTotalPages(1);
          setHasMore(false);
        }
      } catch (error) {
        console.error("[FetchResults] Search failed:", error);
        setResults([]);
        setCurrentPage(1);
        setTotalPages(1);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, searchQuery ? 300 : 0);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, productType]);

  // Load more products
  const loadMore = useCallback(async () => {
    console.log(
      `[LoadMore] Called - isLoading: ${isLoading}, hasMore: ${hasMore}, productType: ${productType}, currentPage: ${currentPage}`,
    );
    if (isLoading || !hasMore || !productType) {
      console.log("[LoadMore] Skipped - conditions not met");
      return;
    }

    const nextPage = currentPage + 1;
    console.log(`[LoadMore] Fetching page ${nextPage}`);
    setIsLoading(true);

    try {
      const endpoint = getProductEndpoint(
        productType,
        nextPage,
        10,
        searchQuery,
      );
      console.log(`[LoadMore] Endpoint: ${endpoint}`);
      const response = await apiClient.get<ApiResponse<ProductData>>(endpoint);
      const responseData = response.data;

      const products = extractProducts(responseData);
      const paginationInfo = extractPaginationInfo(responseData);

      console.log(
        `[LoadMore] Got ${products.length} products, pagination:`,
        paginationInfo,
      );

      setResults((prev) => {
        const newResults = [...prev, ...products];
        console.log(
          `[LoadMore] Total results after append: ${newResults.length}`,
        );
        return newResults;
      });
      setCurrentPage(nextPage);

      if (paginationInfo) {
        setTotalPages(paginationInfo.totalPages);
        const shouldHaveMore = nextPage < paginationInfo.totalPages;
        console.log(
          `[LoadMore] Page ${nextPage} < totalPages ${paginationInfo.totalPages} = hasMore: ${shouldHaveMore}`,
        );
        setHasMore(shouldHaveMore);
      } else {
        setTotalPages(1);
        setHasMore(false);
      }
    } catch (error) {
      console.error("[LoadMore] Failed:", error);
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
