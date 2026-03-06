import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useFlavorStore } from "@/stores/flavorStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { Flavor } from "@/lib/services/flavor.service";
import type {
  UpdateFlavorFormValues,
  CreateFlavorWithVariantImagesFormValues,
} from "@/schemas/custom-cakes.schema";
import { Plus, Loader2 } from "lucide-react";
import { FlavorForm } from "@/components/custom-cakes/FlavorForm";
import { FlavorCard } from "@/components/custom-cakes/FlavorCard";

export default function FlavorsPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const flavors = useFlavorStore((state) => state.flavors);
  const isLoading = useFlavorStore((state) => state.isLoading);
  const isLoadingMore = useFlavorStore((state) => state.isLoadingMore);
  const error = useFlavorStore((state) => state.error);
  const pagination = useFlavorStore((state) => state.pagination);
  const fetchFlavors = useFlavorStore((state) => state.fetchFlavors);
  const loadMoreFlavors = useFlavorStore((state) => state.loadMoreFlavors);
  const addFlavorWithVariantImages = useFlavorStore(
    (state) => state.addFlavorWithVariantImages,
  );
  const updateFlavor = useFlavorStore((state) => state.updateFlavor);
  const deleteFlavor = useFlavorStore((state) => state.deleteFlavor);
  const { openDeleteDialog } = useDeleteDialog();

  useEffect(() => {
    fetchFlavors();
  }, [fetchFlavors]);

  // Handle infinite scroll
  useEffect(() => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current || isLoadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoadingMore &&
          pagination.page < pagination.totalPages
        ) {
          isLoadingRef.current = true;
          loadMoreFlavors().finally(() => {
            isLoadingRef.current = false;
          });
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [isLoadingMore, pagination.page, pagination.totalPages, loadMoreFlavors]);

  const handleAddFlavor = async (
    values: CreateFlavorWithVariantImagesFormValues,
  ) => {
    try {
      await addFlavorWithVariantImages(values);
      setIsAddOpen(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create flavor";
      console.error("Failed to create flavor:", errorMsg);
    }
  };

  const handleUpdateFlavor = async (values: UpdateFlavorFormValues) => {
    if (editingFlavor) {
      try {
        await updateFlavor(editingFlavor.id, values);
        setEditingFlavor(null);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to update flavor";
        console.error("Failed to update flavor:", errorMsg);
      }
    }
  };

  const handleDeleteFlavor = (flavor: Flavor) => {
    openDeleteDialog(
      {
        recordName: flavor.title,
        recordType: t("customCakes.flavor"),
        title: t("customCakes.deleteFlavor"),
        description: `${t("messages.confirmDelete")}`,
      },
      async () => {
        try {
          await deleteFlavor(flavor.id);
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to delete flavor";
          console.error("Failed to delete flavor:", errorMsg);
        }
      },
    );
  };

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600">
            {t("common.error")}
          </h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button onClick={() => fetchFlavors()} className="mt-4">
            {t("common.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("customCakes.flavors")}
          </h1>
          <p className="text-muted-foreground">
            {t("customCakes.flavorsDescription")}
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          {t("customCakes.addFlavor")}
        </Button>
      </div>

      {flavors.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("customCakes.noFlavorsYet")}</EmptyTitle>
            <EmptyDescription>
              {t("customCakes.addFirstFlavor")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flavors.map((flavor) => (
              <FlavorCard
                key={flavor.id}
                flavor={flavor}
                onEdit={() => setEditingFlavor(flavor)}
                onDelete={() => handleDeleteFlavor(flavor)}
              />
            ))}
          </div>

          {/* Infinite scroll trigger element */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {isLoadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            )}
            {!isLoadingMore &&
              pagination.page >= pagination.totalPages &&
              flavors.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("common.endOfList") || "No more items to load"}
                </p>
              )}
          </div>
        </div>
      )}

      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto max-w-2xl py-6">
          <SheetHeader>
            <SheetTitle>{t("customCakes.addNewFlavor")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FlavorForm onSubmit={handleAddFlavor} isLoading={isLoading} />
          </div>
        </SheetContent>
      </Sheet>

      {editingFlavor && (
        <Sheet
          open={!!editingFlavor}
          onOpenChange={() => setEditingFlavor(null)}
        >
          <SheetContent className="overflow-y-auto max-w-2xl py-6">
            <SheetHeader>
              <SheetTitle>{t("customCakes.editFlavor")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FlavorForm
                flavor={editingFlavor}
                onSubmit={handleUpdateFlavor}
                isLoading={isLoading}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
