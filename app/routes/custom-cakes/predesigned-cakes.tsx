"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, CheckCircle2 } from "lucide-react";
import { usePredesignedCakeStore } from "@/stores/predesignedCakeStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import { PredesignedCakeForm } from "@/components/custom-cakes/PredesignedCakeForm";
import { PredesignedCakeCard } from "@/components/custom-cakes/PredesignedCakeCard";
import type { PredesignedCake } from "@/lib/services/predesigned-cake.service";
import type { UpdatePredesignedCakeFormValues } from "@/schemas/custom-cakes.schema";

export default function PredesignedCakesPage() {
  const { t } = useTranslation();
  const {
    predesignedCakes,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    fetchPredesignedCakes,
    loadMorePredesignedCakes,
    updatePredesignedCake,
    deletePredesignedCake,
    togglePredesignedCakeActive,
    clearError,
  } = usePredesignedCakeStore();
  const { openDeleteDialog } = useDeleteDialog();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCake, setEditingCake] = useState<PredesignedCake | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Fetch initial data (use cached data if available)
  useEffect(() => {
    fetchPredesignedCakes();
  }, [fetchPredesignedCakes]);

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
          loadMorePredesignedCakes().finally(() => {
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
    loadMorePredesignedCakes,
  ]);

  const handleEditSubmit = async (data: UpdatePredesignedCakeFormValues) => {
    if (!editingCake) return;
    setFormLoading(true);
    const result = await updatePredesignedCake(editingCake.id, data);
    setFormLoading(false);
    if (result) {
      setIsEditOpen(false);
      setEditingCake(null);
    }
  };

  const handleDelete = (cake: PredesignedCake) => {
    openDeleteDialog(
      {
        title: t("customCakes.predesignedCakes.deleteConfirm"),
        description: `${t("messages.confirmDelete")}`,
        recordType: t("customCakes.predesignedCakes.recordType"),
        recordName: cake.name,
      },
      async () => {
        try {
          await deletePredesignedCake(cake.id);
        } catch (err) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : "Failed to delete predesigned cake";
          console.error("Failed to delete predesigned cake:", errorMsg, err);
        }
      },
    );
  };

  const handleToggleActive = async (id: string) => {
    await togglePredesignedCakeActive(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-card-foreground">
          {t("customCakes.predesignedCakes.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("customCakes.predesignedCakes.subtitle")}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-destructive">
                {t("common.error")}
              </h3>
              <p className="mt-1 text-sm text-destructive/80">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={clearError}>
              {t("common.dismiss")}
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && predesignedCakes.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : predesignedCakes.length === 0 ? (
        // Empty State
        <div className="rounded-lg border-2 border-dashed border-border py-12 text-center">
          <div className="mb-4 inline-block rounded-lg bg-muted p-3">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {t("customCakes.predesignedCakes.noData")}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {t("customCakes.predesignedCakes.createFirst")}
          </p>
        </div>
      ) : (
        // Grid of Cakes
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {predesignedCakes.map((cake) => (
              <PredesignedCakeCard
                key={cake.id}
                cake={cake}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
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
              predesignedCakes.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("common.endOfList") || "No more items to load"}
                </p>
              )}
          </div>
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="max-h-screen overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {t("common.edit")} {editingCake?.name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {editingCake && (
              <PredesignedCakeForm
                initialData={editingCake}
                onSubmit={handleEditSubmit}
                isLoading={formLoading}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
