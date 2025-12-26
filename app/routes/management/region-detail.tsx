import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRegionStore } from "@/stores/regionStore";
import { useReadyCakeStore } from "@/stores/readyCakeStore";
import { useSweetStore } from "@/stores/sweetStore";
import { useRegionProductSelectionStore } from "@/stores/regionProductSelectionStore";
import { SelectedProductsDataTable } from "@/components/SelectedProductsDataTable";
import React, { useState, useRef } from "react";
import { selectedProductsColumns } from "@/components/SelectedProductsColumns";
import { RegionHeader } from "@/components/RegionHeader";
import { SearchProductsBar } from "@/components/SearchProductsBar";
import { SearchProductsDropdown } from "@/components/SearchProductsDropdown";
import { ProductSelectionSheet } from "@/components/ProductSelectionSheet";
import type { ReadyCake, Sweet } from "@/data/products";

type ProductSelection = {
  type: "cake" | "sweet";
  product: ReadyCake | Sweet;
  selectedSizes: Array<{ name: string; price: number }>;
} | null;

export default function RegionDetailPage() {
  const editingProductIdRef = useRef<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSelection>(null);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);

  // Store hooks
  const regions = useRegionStore((state) => state.regions);
  const readyCakes = useReadyCakeStore((state) => state.readyCakes);
  const sweets = useSweetStore((state) => state.sweets);
  const selectedProducts = useRegionProductSelectionStore(
    (state) => state.selectedProducts
  );
  const addProduct = useRegionProductSelectionStore(
    (state) => state.addProduct
  );
  const removeProduct = useRegionProductSelectionStore(
    (state) => state.removeProduct
  );
  const updateProduct = useRegionProductSelectionStore(
    (state) => state.updateProduct
  );

  // Handler to start editing a product
  const handleEditProduct = React.useCallback(
    (
      item: import("@/stores/regionProductSelectionStore").SelectedProductItem
    ) => {
      setSelectedProduct({
        type: item.type,
        product:
          item.type === "cake"
            ? readyCakes.find((c) => c.id === item.productId)!
            : sweets.find((s) => s.id === item.productId)!,
        selectedSizes: item.selectedSizes || [],
      });
      setEditingProductId(item.id);
      setIsSelectionOpen(true);
    },
    [readyCakes, sweets]
  );

  // Sync editingProductId state to ref
  React.useEffect(() => {
    editingProductIdRef.current = editingProductId;
  }, [editingProductId]);

  // Find region
  const region = regions.find(
    (r) => r.name.toLowerCase().replace(/\s+/g, "-") === name
  );

  if (!region) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Region Not Found</h1>
        <Button onClick={() => navigate("/management/regions")}>
          Back to Regions
        </Button>
      </div>
    );
  }

  const regionSelectedProducts = selectedProducts.filter(
    (p) => p.regionName === region.name
  );

  // Filter products based on search query
  const activeReadyCakes = readyCakes.filter((cake) => cake.isActive);
  const activeSweets = sweets.filter((sweet) => sweet.isActive);

  const filteredCakes = activeReadyCakes.filter(
    (cake) =>
      cake.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cake.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSweets = activeSweets.filter(
    (sweet) =>
      sweet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sweet.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle product selection
  const handleSelectCake = (cake: ReadyCake) => {
    setSelectedProduct({ type: "cake", product: cake, selectedSizes: [] });
    setIsSelectionOpen(true);
  };

  const handleSelectSweet = (sweet: Sweet) => {
    setSelectedProduct({ type: "sweet", product: sweet, selectedSizes: [] });
    setIsSelectionOpen(true);
  };

  const handleSelectSize = (size: { name: string; price: number }) => {
    if (selectedProduct?.type === "cake") {
      setSelectedProduct({
        ...selectedProduct,
        selectedSizes: [...selectedProduct.selectedSizes, size],
      });
    }
  };

  const handleRemoveSize = (sizeName: string) => {
    if (selectedProduct?.type === "cake") {
      setSelectedProduct({
        ...selectedProduct,
        selectedSizes: selectedProduct.selectedSizes.filter(
          (s) => s.name !== sizeName
        ),
      });
    }
  };

  const handleConfirmSelection = () => {
    if (selectedProduct) {
      if (editingProductId) {
        // Edit mode: update all fields of the existing product
        const updated = {
          type: selectedProduct.type,
          productId: selectedProduct.product.id,
          productName: selectedProduct.product.name,
          productImage: selectedProduct.product.image,
          basePrice:
            selectedProduct.type === "cake"
              ? (selectedProduct.product as ReadyCake).basePrice
              : (selectedProduct.product as Sweet).price,
          selectedSizes:
            selectedProduct.type === "cake"
              ? selectedProduct.selectedSizes
              : [],
        };
        updateProduct(editingProductId, updated);
        setEditingProductId(null);
      } else {
        // Add mode: add new product
        addProduct(
          region.name,
          region.id,
          selectedProduct.type,
          selectedProduct.product,
          selectedProduct.type === "cake"
            ? selectedProduct.selectedSizes
            : undefined
        );
      }
      setIsSelectionOpen(false);
      setSelectedProduct(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <RegionHeader regionName={region.name} />

      {/* Search & Select Section */}
      <h2 className="text-2xl font-bold tracking-tight">Add Products</h2>
      <div className="relative">
        <SearchProductsBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Search Results Dropdown */}
        <SearchProductsDropdown
          filteredCakes={filteredCakes}
          filteredSweets={filteredSweets}
          searchQuery={searchQuery}
          onSelectCake={handleSelectCake}
          onSelectSweet={handleSelectSweet}
          onClose={() => setSearchQuery("")}
        />
      </div>

      {/* Selected Products Table */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          Selected Products
        </h2>
        <SelectedProductsDataTable
          columns={selectedProductsColumns(removeProduct, handleEditProduct)}
          data={regionSelectedProducts}
        />
      </div>

      <hr className="my-8" />

      {/* Product Selection Sheet */}
      <ProductSelectionSheet
        selectedProduct={selectedProduct}
        isOpen={isSelectionOpen}
        onOpenChange={setIsSelectionOpen}
        onConfirm={handleConfirmSelection}
        onSelectSize={handleSelectSize}
        onRemoveSize={handleRemoveSize}
      />
    </div>
  );
}
