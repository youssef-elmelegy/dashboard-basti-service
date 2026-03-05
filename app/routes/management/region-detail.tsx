import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRegionStore } from "@/stores/regionStore";
import { useRegionProductSelectionStore } from "@/stores/regionProductSelectionStore";
import React from "react";
import { RegionHeader } from "@/components/RegionHeader";
import { ProductSelectionSheet } from "@/components/ProductSelectionSheet";
import { Plus } from "lucide-react";

import { ProductTypeSelectionSheet } from "./components/ProductTypeSelectionSheet";
import { SelectedProductsTable } from "./components/SelectedProductsTable";
import { useRegionalProducts } from "./hooks/useRegionalProducts";
import { useProductSelection } from "./hooks/useProductSelection";
import { useEditProductHandler } from "./hooks/useEditProductHandler";
import { useConfirmSelectionHandler } from "./hooks/useConfirmSelectionHandler";
import { useDeleteRegionalProduct } from "./hooks/useDeleteRegionalProduct";
import { transformRegionalProductsToItems } from "./utils/productTransformers";
import type { SelectedProductItem } from "./types";

export default function RegionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isTypeDialogOpen, setIsTypeDialogOpen] = React.useState(false);

  // Region hooks
  const currentRegion = useRegionStore((state) => state.currentRegion);
  const fetchRegionById = useRegionStore((state) => state.fetchRegionById);
  const isLoading = useRegionStore((state) => state.isLoading);

  // Product selection hook
  const {
    selectedProduct,
    setSelectedProduct,
    isSelectionOpen,
    setIsSelectionOpen,
    editingProductId,
    setEditingProductId,
    handleSelectProductFromSheet,
    handleSelectSize,
    handleRemoveSize,
    resetSelection,
  } = useProductSelection();

  // Regional products hook
  const {
    products: regionalProducts,
    isLoading: isLoadingRegionalProducts,
    setProducts: setRegionalProducts,
  } = useRegionalProducts(id);

  // Edit product handler hook
  const { handleEditProduct } = useEditProductHandler({
    regionalProducts,
    setSelectedProduct,
    setEditingProductId,
    setIsSelectionOpen,
  });

  const { handleDeleteProduct } = useDeleteRegionalProduct({
    regionId: id || "",
    regionalProducts,
    onSuccess: (deletedProductId) => {
      // Remove from regional products (from API)
      setRegionalProducts(
        regionalProducts.filter((p) => p.id !== deletedProductId),
      );
    },
    onError: (error) => {
      console.error("Failed to delete product:", error);
    },
  });

  // Confirm selection handler hook
  const { handleConfirmSelection } = useConfirmSelectionHandler({
    currentRegion,
    selectedProduct,
    editingProductId,
    setRegionalProducts,
    setEditingProductId,
    resetSelection,
  });

  // Fetch region details
  React.useEffect(() => {
    if (id) {
      fetchRegionById(id).catch((error) => {
        console.error("Failed to fetch region details:", error);
      });
    }
  }, [id, fetchRegionById]);

  // Transform regional products
  const transformedRegionalProducts: SelectedProductItem[] =
    transformRegionalProductsToItems(
      regionalProducts,
      currentRegion?.id || "",
      currentRegion?.name || "",
    );

  const selectedProducts = useRegionProductSelectionStore(
    (state) => state.selectedProducts,
  );
  const regionSelectedProducts = [
    ...transformedRegionalProducts,
    ...selectedProducts.filter((p) => p.regionName === currentRegion?.name),
  ];

  const region = currentRegion;

  if (isLoading && !region) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Loading...</h1>
      </div>
    );
  }

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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <RegionHeader regionName={region.name} />

      {/* Add Products Button Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <Button onClick={() => setIsTypeDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Product Type Selection Sheet */}
      <ProductTypeSelectionSheet
        isOpen={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onSelectProduct={handleSelectProductFromSheet}
      />

      {/* Selected Products Table */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          Selected Products
        </h2>
        <SelectedProductsTable
          isLoading={isLoadingRegionalProducts}
          data={regionSelectedProducts}
          onRemoveProduct={(id) => {
            const item = regionSelectedProducts.find((p) => p.id === id);
            if (item) {
              // Check if it's a regional product (starts with "regional-")
              if (item.id.startsWith("regional-")) {
                // Optimistically remove from UI first
                setRegionalProducts(
                  regionalProducts.filter((p) => p.id !== item.productId),
                );
                // Then delete from API in background
                handleDeleteProduct(item).catch(() => {
                  // If delete fails, we could add it back (but for now just log)
                  console.error("Failed to delete product");
                });
              } else {
                // It's a product from the store, just remove it from store
                const removeProduct =
                  useRegionProductSelectionStore.getState().removeProduct;
                removeProduct(id);
              }
            }
          }}
          onEditProduct={handleEditProduct}
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
