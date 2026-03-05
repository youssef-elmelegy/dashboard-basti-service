import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { ProductData } from "../types";

export function useRegionalProducts(regionId: string | undefined) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!regionId) return;

      setIsLoading(true);
      try {
        const response = await apiClient.get(
          `/regions/${regionId}/products?page=1&limit=1000`,
        );
        const data = response.data;
        if (data && typeof data === "object" && "items" in data) {
          const items = (data as { items: ProductData[] }).items;
          setProducts(items);
        }
      } catch (error) {
        console.error("Failed to fetch regional products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [regionId]);

  const updateProduct = (productId: string, updates: Partial<ProductData>) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
    );
  };

  return { products, isLoading, updateProduct, setProducts };
}
