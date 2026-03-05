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
import { useShapeStore } from "@/stores/shapeStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { Shape } from "@/lib/services/shape.service";
import type {
  CreateShapeFormValues,
  UpdateShapeFormValues,
} from "@/schemas/custom-cakes.schema";
import { Plus } from "lucide-react";
import { ShapeForm } from "@/components/custom-cakes/ShapeForm";
import { ShapeCard } from "@/components/custom-cakes/ShapeCard";

export default function ShapesPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShape, setEditingShape] = useState<Shape | null>(null);

  const shapes = useShapeStore((state) => state.shapes);
  const isLoading = useShapeStore((state) => state.isLoading);
  const error = useShapeStore((state) => state.error);
  const fetchShapes = useShapeStore((state) => state.fetchShapes);
  const addShape = useShapeStore((state) => state.addShape);
  const updateShape = useShapeStore((state) => state.updateShape);
  const deleteShape = useShapeStore((state) => state.deleteShape);
  const { openDeleteDialog } = useDeleteDialog();

  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);

  const handleAddShape = async (
    values: CreateShapeFormValues | UpdateShapeFormValues,
  ) => {
    try {
      await addShape(values as CreateShapeFormValues);
      setIsAddOpen(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create shape";
      console.error("Failed to create shape:", errorMsg);
    }
  };

  const handleUpdateShape = async (
    values: CreateShapeFormValues | UpdateShapeFormValues,
  ) => {
    if (editingShape) {
      try {
        await updateShape(editingShape.id, values as UpdateShapeFormValues);
        setEditingShape(null);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to update shape";
        console.error("Failed to update shape:", errorMsg);
      }
    }
  };

  const handleDeleteShape = (shape: Shape) => {
    openDeleteDialog(
      {
        recordName: shape.title,
        recordType: t("customCakes.shape"),
        title: t("customCakes.deleteShape"),
        description: `${t("messages.confirmDelete")}`,
      },
      async () => {
        try {
          await deleteShape(shape.id);
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to delete shape";
          console.error("Failed to delete shape:", errorMsg);
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
          <Button onClick={() => fetchShapes()} className="mt-4">
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
            {t("customCakes.shapes")}
          </h1>
          <p className="text-muted-foreground">
            {t("customCakes.shapesDescription")}
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          {t("customCakes.addShape")}
        </Button>
      </div>

      {shapes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("customCakes.noShapesYet")}</EmptyTitle>
            <EmptyDescription>
              {t("customCakes.addFirstShape")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shapes.map((shape) => (
            <ShapeCard
              key={shape.id}
              shape={shape}
              onEdit={() => setEditingShape(shape)}
              onDelete={() => handleDeleteShape(shape)}
            />
          ))}
        </div>
      )}

      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto max-w-2xl">
          <SheetHeader>
            <SheetTitle>{t("customCakes.addNewShape")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ShapeForm onSubmit={handleAddShape} isLoading={isLoading} />
          </div>
        </SheetContent>
      </Sheet>

      {editingShape && (
        <Sheet open={!!editingShape} onOpenChange={() => setEditingShape(null)}>
          <SheetContent className="overflow-y-auto max-w-2xl">
            <SheetHeader>
              <SheetTitle>{t("customCakes.editShape")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ShapeForm
                shape={editingShape}
                onSubmit={handleUpdateShape}
                isLoading={isLoading}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
