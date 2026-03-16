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
import { useDecorationStore } from "@/stores/decorationStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { Decoration } from "@/lib/services/decoration.service";
import type {
  CreateDecorationFormValues,
  UpdateDecorationFormValues,
  CreateDecorationWithVariantImagesFormValues,
} from "@/schemas/custom-cakes.schema";
import { Plus, Loader2 } from "lucide-react";
import { DecorationForm } from "@/components/custom-cakes/DecorationForm";
import { DecorationCard } from "@/components/custom-cakes/DecorationCard";

export default function DecorationsPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDecoration, setEditingDecoration] = useState<Decoration | null>(
    null,
  );
  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const decorations = useDecorationStore((state) => state.decorations);
  const isLoading = useDecorationStore((state) => state.isLoading);
  const isLoadingMore = useDecorationStore((state) => state.isLoadingMore);
  const error = useDecorationStore((state) => state.error);
  const pagination = useDecorationStore((state) => state.pagination);
  const fetchDecorations = useDecorationStore(
    (state) => state.fetchDecorations,
  );
  const loadMoreDecorations = useDecorationStore(
    (state) => state.loadMoreDecorations,
  );
  const addDecoration = useDecorationStore((state) => state.addDecoration);
  const addDecorationWithVariantImages = useDecorationStore(
    (state) => state.addDecorationWithVariantImages,
  );
  const updateDecoration = useDecorationStore(
    (state) => state.updateDecoration,
  );
  const deleteDecoration = useDecorationStore(
    (state) => state.deleteDecoration,
  );
  const decorationConflict = useDecorationStore(
    (state) => state.decorationConflict,
  );
  const forceDeleteDecoration = useDecorationStore(
    (state) => state.forceDeleteDecoration,
  );
  const clearConflict = useDecorationStore((state) => state.clearConflict);
  const { openDeleteDialog } = useDeleteDialog();

  useEffect(() => {
    fetchDecorations();
  }, [fetchDecorations]);

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
          loadMoreDecorations().finally(() => {
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
  }, [
    isLoadingMore,
    pagination.page,
    pagination.totalPages,
    loadMoreDecorations,
  ]);

  const handleAddDecoration = async (
    values:
      | CreateDecorationFormValues
      | UpdateDecorationFormValues
      | CreateDecorationWithVariantImagesFormValues,
  ) => {
    try {
      // Check if it has variantImages (meaning it's using the new endpoint)
      if (
        "variantImages" in values &&
        Array.isArray(values.variantImages) &&
        values.variantImages.length > 0
      ) {
        await addDecorationWithVariantImages(
          values as CreateDecorationWithVariantImagesFormValues,
        );
      } else {
        await addDecoration(values as CreateDecorationFormValues);
      }
      setIsAddOpen(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create decoration";
      console.error("Failed to create decoration:", errorMsg);
    }
  };

  const handleUpdateDecoration = async (
    values: CreateDecorationFormValues | UpdateDecorationFormValues,
  ) => {
    if (editingDecoration) {
      try {
        await updateDecoration(
          editingDecoration.id,
          values as UpdateDecorationFormValues,
        );
        setEditingDecoration(null);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to update decoration";
        console.error("Failed to update decoration:", errorMsg);
      }
    }
  };

  const handleDeleteDecoration = (decoration: Decoration) => {
    openDeleteDialog(
      {
        recordName: decoration.title,
        recordType: t("customCakes.decoration"),
        title: t("customCakes.deleteDecoration"),
        description: `${t("messages.confirmDelete")}`,
      },
      async () => {
        try {
          await deleteDecoration(decoration.id);
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to delete decoration";
          console.error("Failed to delete decoration:", errorMsg);
        }
      },
    );
  };

  const handleForceDelete = async () => {
    if (!decorationConflict) return;
    try {
      await forceDeleteDecoration(decorationConflict.decorationId);
    } catch (err) {
      console.error("Failed to force-delete decoration:", err);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600">
            {t("common.error")}
          </h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button onClick={() => fetchDecorations()} className="mt-4">
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
            {t("customCakes.decorations")}
          </h1>
          <p className="text-muted-foreground">
            {t("customCakes.decorationsDescription")}
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          {t("customCakes.addDecoration")}
        </Button>
      </div>

      {decorations.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("customCakes.noDecorationsYet")}</EmptyTitle>
            <EmptyDescription>
              {t("customCakes.addFirstDecoration")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decorations.map((decoration) => (
              <DecorationCard
                key={decoration.id}
                decoration={decoration}
                onEdit={() => setEditingDecoration(decoration)}
                onDelete={() => handleDeleteDecoration(decoration)}
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
              decorations.length > 0 && (
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
            <SheetTitle>{t("customCakes.addNewDecoration")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <DecorationForm
              onSubmit={handleAddDecoration}
              isLoading={isLoading}
              withVariantImages={true}
            />
          </div>
        </SheetContent>
      </Sheet>

      {editingDecoration && (
        <Sheet
          open={!!editingDecoration}
          onOpenChange={() => setEditingDecoration(null)}
        >
          <SheetContent className="overflow-y-auto max-w-2xl py-6">
            <SheetHeader>
              <SheetTitle>{t("customCakes.editDecoration")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <DecorationForm
                decoration={editingDecoration}
                onSubmit={handleUpdateDecoration}
                isLoading={isLoading}
                withVariantImages={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Conflict dialog — shown when the decoration has linked predesigned cake configs */}
      <AlertDialog
        open={!!decorationConflict}
        onOpenChange={(open) => !open && clearConflict()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("customCakes.decorationInUseTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("customCakes.decorationInUseDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            {decorationConflict && (
              <ul className="list-disc list-inside space-y-1">
                <li>
                  {decorationConflict.relatedConfigsCount}{" "}
                  {t("customCakes.cakeConfigsAffected")}
                </li>
                <li>
                  {decorationConflict.affectedPredesignedCakesCount}{" "}
                  {t("customCakes.predesignedCakesAffected")}
                </li>
              </ul>
            )}
            <p className="font-medium text-destructive">
              {t("customCakes.decorationForceDeleteWarning")}
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
                t("customCakes.deleteDecorationAndRecords")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
