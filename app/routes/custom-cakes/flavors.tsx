import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Plus, Loader2, X } from "lucide-react";
import { FlavorForm } from "@/components/custom-cakes/FlavorForm";
import { FlavorCard } from "@/components/custom-cakes/FlavorCard";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem, useDragSensors } from "@/components/SortableItem";

export default function FlavorsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const flavors = useFlavorStore((state) => state.flavors);
  const isLoading = useFlavorStore((state) => state.isLoading);
  const isLoadingMore = useFlavorStore((state) => state.isLoadingMore);
  const error = useFlavorStore((state) => state.error);
  const clearError = useFlavorStore((state) => state.clearError);
  const pagination = useFlavorStore((state) => state.pagination);
  const fetchFlavors = useFlavorStore((state) => state.fetchFlavors);
  const loadMoreFlavors = useFlavorStore((state) => state.loadMoreFlavors);
  const addFlavorWithVariantImages = useFlavorStore(
    (state) => state.addFlavorWithVariantImages,
  );
  const updateFlavor = useFlavorStore((state) => state.updateFlavor);
  const deleteFlavor = useFlavorStore((state) => state.deleteFlavor);
  const changeFlavorOrder = useFlavorStore((state) => state.changeFlavorOrder);
  const toggleFlavorFeatured = useFlavorStore(
    (state) => state.toggleFlavorFeatured,
  );
  const flavorConflict = useFlavorStore((state) => state.flavorConflict);
  const forceDeleteFlavor = useFlavorStore((state) => state.forceDeleteFlavor);
  const clearConflict = useFlavorStore((state) => state.clearConflict);
  const { openDeleteDialog } = useDeleteDialog();

  // Compute displayed flavors sorted by order
  const displayedFlavors = useMemo(
    () => [...flavors].sort((a, b) => a.order - b.order),
    [flavors],
  );

  useEffect(() => {
    fetchFlavors();
  }, [fetchFlavors]);

  // Handle infinite scroll — store's isLoadingMore guard prevents concurrent
  // fetches. Effect re-runs on flavors.length so the sentinel picks up its
  // observer once the div actually mounts (on refresh, isLoading gates the
  // list render so the ref is null on first effect run).
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreFlavors();
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [pagination.page, flavors.length, loadMoreFlavors]);

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

  const handleForceDelete = async () => {
    if (!flavorConflict) return;
    try {
      await forceDeleteFlavor(flavorConflict.flavorId);
    } catch (err) {
      console.error("Failed to force-delete flavor:", err);
    }
  };

  const sensors = useDragSensors();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const targetIndex = displayedFlavors.findIndex((f) => f.id === over.id);
    if (targetIndex === -1) return;

    // Order is 1-indexed. Fire-and-forget: the store applies an optimistic
    // update immediately and rolls back on error.
    changeFlavorOrder(active.id as string, targetIndex + 1).catch((error) => {
      console.error("Failed to change flavor order:", error);
    });
  };

  // Only a failed *list load* justifies replacing the page. Mutation errors
  // surface inline so the list stays usable.
  if (error && flavors.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600">
            {t("common.error")}
          </h2>
          <p className="text-muted-foreground mt-2">{t(error)}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              {t("common.back")}
            </Button>
            {/* Force a refresh: bypasses the cache guard so the retry actually
                clears the error and re-fetches, instead of returning early. */}
            <Button
              onClick={() =>
                fetchFlavors(undefined, undefined, undefined, true)
              }
            >
              {t("common.tryAgain")}
            </Button>
          </div>
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

      {/* Mutation errors: shown inline so the list below stays usable. */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-600/40 bg-red-600/10 p-4">
          <p className="text-sm text-red-500">{t(error)}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            aria-label={t("common.dismiss")}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayedFlavors.map((f) => f.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedFlavors.map((flavor) => (
                  <SortableItem
                    key={flavor.id}
                    id={flavor.id}
                    className={({ isDragging }) =>
                      `relative transition-opacity ${isDragging ? "opacity-50" : ""}`
                    }
                  >
                    <div className="absolute bottom-2 end-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold z-10">
                      {flavor.order}
                    </div>
                    <FlavorCard
                      flavor={flavor}
                      onEdit={() => setEditingFlavor(flavor)}
                      onDelete={() => handleDeleteFlavor(flavor)}
                      onToggleFeatured={(id) =>
                        toggleFlavorFeatured(id).catch((err) =>
                          console.error("Failed to toggle best seller:", err),
                        )
                      }
                    />
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Infinite scroll trigger element */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {isLoadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            )}
            {!isLoadingMore &&
              pagination.page >= pagination.totalPages &&
              displayedFlavors.length > 0 && (
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

      {/* Conflict dialog — shown when the flavor has linked predesigned cake configs */}
      <AlertDialog
        open={!!flavorConflict}
        onOpenChange={(open) => !open && clearConflict()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("customCakes.flavorInUseTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("customCakes.flavorInUseDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            {flavorConflict && (
              <ul className="list-disc list-inside space-y-1">
                <li>
                  {flavorConflict.relatedConfigsCount}{" "}
                  {t("customCakes.cakeConfigsAffected")}
                </li>
                <li>
                  {flavorConflict.affectedPredesignedCakesCount}{" "}
                  {t("customCakes.predesignedCakesAffected")}
                </li>
              </ul>
            )}
            <p className="font-medium text-destructive">
              {t("customCakes.flavorForceDeleteWarning")}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={clearConflict}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("customCakes.deleteFlavorAndRecords")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
