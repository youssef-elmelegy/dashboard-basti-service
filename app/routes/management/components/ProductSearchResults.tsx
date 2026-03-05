import { useEffect, useRef } from "react";
import { SearchProductsBar } from "@/components/SearchProductsBar";
import type { ProductData } from "../types";

interface ProductSearchResultsProps {
  results: ProductData[];
  isLoading: boolean;
  hasMore: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onProductSelect: (product: ProductData) => void;
  onLoadMore: () => void;
}

export function ProductSearchResults({
  results,
  isLoading,
  hasMore,
  searchQuery,
  onSearchChange,
  onProductSelect,
  onLoadMore,
}: ProductSearchResultsProps) {
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load more products on scroll
  useEffect(() => {
    const container = resultsContainerRef.current;
    if (!container || !hasMore || isLoading) return;

    const handleScroll = () => {
      const sheetContent = container.closest("[class*='overflow-y-auto']");
      if (!sheetContent) return;

      if (
        sheetContent.scrollHeight -
          sheetContent.scrollTop -
          sheetContent.clientHeight <
        200
      ) {
        onLoadMore();
      }
    };

    const sheetContent = container.closest(
      "[class*='overflow-y-auto']",
    ) as HTMLElement;
    if (sheetContent) {
      sheetContent.addEventListener("scroll", handleScroll);
      return () => sheetContent.removeEventListener("scroll", handleScroll);
    }
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div className="space-y-4">
      <SearchProductsBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      {/* Search Results List */}
      {results.length > 0 && (
        <div
          ref={resultsContainerRef}
          className="space-y-0 border rounded-lg divide-y"
        >
          {results.map((product) => (
            <div
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
            >
              <div className="flex gap-3">
                {(product.thumbnailUrl ||
                  product.images?.[0] ||
                  product.shapeUrl ||
                  product.flavorUrl ||
                  product.decorationUrl) && (
                  <img
                    src={
                      product.thumbnailUrl ||
                      product.images?.[0] ||
                      product.shapeUrl ||
                      product.flavorUrl ||
                      product.decorationUrl
                    }
                    alt={product.name || product.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {product.name || product.title}
                  </p>
                  {(product.description || product.category) && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {product.description || product.category}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchQuery && !isLoading && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No products found matching "{searchQuery}"
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      )}
    </div>
  );
}
