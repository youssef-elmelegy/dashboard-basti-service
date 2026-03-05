import { useState, useEffect } from "react";
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
import { useDecorationStore } from "@/stores/decorationStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { Decoration } from "@/lib/services/decoration.service";
import type {
  CreateDecorationFormValues,
  UpdateDecorationFormValues,
  CreateDecorationWithVariantImagesFormValues,
} from "@/schemas/custom-cakes.schema";
import { Plus } from "lucide-react";
import { DecorationForm } from "@/components/custom-cakes/DecorationForm";
import { DecorationCard } from "@/components/custom-cakes/DecorationCard";

export default function DecorationsPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDecoration, setEditingDecoration] = useState<Decoration | null>(
    null,
  );

  const decorations = useDecorationStore((state) => state.decorations);
  const isLoading = useDecorationStore((state) => state.isLoading);
  const error = useDecorationStore((state) => state.error);
  const fetchDecorations = useDecorationStore(
    (state) => state.fetchDecorations,
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
  const { openDeleteDialog } = useDeleteDialog();

  useEffect(() => {
    fetchDecorations();
  }, [fetchDecorations]);

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
      )}

      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto max-w-2xl">
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
          <SheetContent className="overflow-y-auto max-w-2xl">
            <SheetHeader>
              <SheetTitle>{t("customCakes.editDecoration")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <DecorationForm
                decoration={editingDecoration}
                onSubmit={handleUpdateDecoration}
                isLoading={isLoading}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
