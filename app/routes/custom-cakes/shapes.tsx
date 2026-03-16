import { useState, useEffect, useMemo } from "react";
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
import { useShapeStore } from "@/stores/shapeStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { Shape } from "@/lib/services/shape.service";
import type {
  CreateShapeFormValues,
  UpdateShapeFormValues,
} from "@/schemas/custom-cakes.schema";
import { Plus, Loader2 } from "lucide-react";
import { ShapeForm } from "@/components/custom-cakes/ShapeForm";
import { ShapeCard } from "@/components/custom-cakes/ShapeCard";

export default function ShapesPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShape, setEditingShape] = useState<Shape | null>(null);
  const [draggedShape, setDraggedShape] = useState<Shape | null>(null);

  const shapes = useShapeStore((state) => state.shapes) || [];
  const isLoading = useShapeStore((state) => state.isLoading);
  const error = useShapeStore((state) => state.error);
  const fetchShapes = useShapeStore((state) => state.fetchShapes);
  const addShape = useShapeStore((state) => state.addShape);
  const updateShape = useShapeStore((state) => state.updateShape);
  const deleteShape = useShapeStore((state) => state.deleteShape);
  const changeShapeOrder = useShapeStore((state) => state.changeShapeOrder);
  const shapeConflict = useShapeStore((state) => state.shapeConflict);
  const forceDeleteShape = useShapeStore((state) => state.forceDeleteShape);
  const clearConflict = useShapeStore((state) => state.clearConflict);
  const { openDeleteDialog } = useDeleteDialog();

  // Compute displayed shapes sorted by order
  const displayedShapes = useMemo(
    () => [...shapes].sort((a, b) => a.order - b.order),
    [shapes],
  );

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

  const handleForceDelete = async () => {
    if (!shapeConflict) return;
    try {
      await forceDeleteShape(shapeConflict.shapeId);
    } catch (err) {
      console.error("Failed to force-delete shape:", err);
    }
  };

  const handleDragStart = (shape: Shape) => {
    setDraggedShape(shape);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    setDraggedShape(null);
  };

  const handleDrop = async (targetShape: Shape) => {
    if (!draggedShape || draggedShape.id === targetShape.id) {
      setDraggedShape(null);
      return;
    }

    // Find positions
    const draggedIndex = displayedShapes.findIndex(
      (s) => s.id === draggedShape.id,
    );
    const targetIndex = displayedShapes.findIndex(
      (s) => s.id === targetShape.id,
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedShape(null);
      return;
    }

    // Calculate new order (1-indexed)
    const newOrder = targetIndex + 1;

    // Send request to update backend
    try {
      // changeShapeOrder now returns the full sorted shapes array
      await changeShapeOrder(draggedShape.id, newOrder);

      // The store is now updated with the new shapes array from backend
      // The useMemo hook will automatically recompute displayedShapes
    } catch (error) {
      console.error("Failed to change shape order:", error);
    }

    setDraggedShape(null);
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
          {displayedShapes.map((shape) => (
            <div
              key={shape.id}
              draggable
              onDragStart={() => handleDragStart(shape)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={() => handleDrop(shape)}
              className={`relative transition-opacity ${
                draggedShape?.id === shape.id ? "opacity-50" : ""
              }`}
            >
              <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold z-10">
                {shape.order}
              </div>
              <ShapeCard
                shape={shape}
                onEdit={() => setEditingShape(shape)}
                onDelete={() => handleDeleteShape(shape)}
              />
            </div>
          ))}
        </div>
      )}

      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto max-w-2xl py-6">
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
          <SheetContent className="overflow-y-auto max-w-2xl py-6">
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

      {/* Conflict dialog — shown when the shape has linked predesigned cake configs */}
      <AlertDialog
        open={!!shapeConflict}
        onOpenChange={(open) => !open && clearConflict()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("customCakes.shapeInUseTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("customCakes.shapeInUseDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            {shapeConflict && (
              <ul className="list-disc list-inside space-y-1">
                <li>
                  {shapeConflict.relatedConfigsCount}{" "}
                  {t("customCakes.cakeConfigsAffected")}
                </li>
                <li>
                  {shapeConflict.affectedPredesignedCakesCount}{" "}
                  {t("customCakes.predesignedCakesAffected")}
                </li>
              </ul>
            )}
            <p className="font-medium text-destructive">
              {t("customCakes.shapeForceDeleteWarning")}
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
                t("customCakes.deleteShapeAndRecords")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
