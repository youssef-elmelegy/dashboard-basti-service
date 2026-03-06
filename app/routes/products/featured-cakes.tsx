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
import { FeaturedCakeCard } from "@/components/FeaturedCakeCard";
import { AddFeaturedCakeForm } from "@/components/AddFeaturedCakeForm";
import { EditFeaturedCakeForm } from "@/components/EditFeaturedCakeForm";
import { useFeaturedCakeStore } from "@/stores/featuredCakeStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { FeaturedCake } from "@/lib/services/featured-cake.service";
import type {
  AddFeaturedCakeFormValues,
  EditFeaturedCakeFormValues,
} from "@/schemas/featured-cake.schema";
import { Plus } from "lucide-react";

export default function FeaturedCakesPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCake, setEditingCake] = useState<FeaturedCake | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const featuredCakes = useFeaturedCakeStore((state) => state.featuredCakes);
  const isLoading = useFeaturedCakeStore((state) => state.isLoading);
  const error = useFeaturedCakeStore((state) => state.error);
  const fetchFeaturedCakes = useFeaturedCakeStore(
    (state) => state.fetchFeaturedCakes,
  );
  const addFeaturedCake = useFeaturedCakeStore(
    (state) => state.addFeaturedCake,
  );
  const updateFeaturedCake = useFeaturedCakeStore(
    (state) => state.updateFeaturedCake,
  );
  const deleteFeaturedCake = useFeaturedCakeStore(
    (state) => state.deleteFeaturedCake,
  );
  const toggleFeaturedCakeStatus = useFeaturedCakeStore(
    (state) => state.toggleFeaturedCakeStatus,
  );
  const { openDeleteDialog } = useDeleteDialog();

  // Fetch featured cakes on mount
  useEffect(() => {
    fetchFeaturedCakes();
  }, [fetchFeaturedCakes]);

  // Filter featured cakes based on active status
  const filteredCakes = featuredCakes.filter((cake) => {
    if (activeFilter === "active" && !cake.isActive) return false;
    if (activeFilter === "inactive" && cake.isActive) return false;
    return true;
  });

  const handleAddCake = async (values: AddFeaturedCakeFormValues) => {
    console.log("handleAddCake called with values:", values);
    try {
      console.log("Calling addFeaturedCake...");
      await addFeaturedCake(values);
      console.log("addFeaturedCake completed successfully");
      setIsAddOpen(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create featured cake";
      console.error("Failed to create featured cake:", errorMsg, err);
    }
  };

  const handleUpdateCake = async (values: EditFeaturedCakeFormValues) => {
    if (editingCake) {
      try {
        const { id, ...updateData } = values;
        await updateFeaturedCake(id, updateData);
        setEditingCake(null);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to update featured cake";
        console.error("Failed to update featured cake:", errorMsg);
      }
    }
  };

  const handleDeleteCake = (cake: FeaturedCake) => {
    openDeleteDialog(
      {
        recordName: cake.name,
        recordType: t("featuredCakes.recordType"),
        title: t("featuredCakes.deleteCake"),
        description: `${t("featuredCakes.deleteMessage")} ${cake.name}? ${t("common.cannotBeUndone")}`,
      },
      async () => {
        try {
          await deleteFeaturedCake(cake.id);
        } catch (err) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : "Failed to delete featured cake";
          console.error("Failed to delete featured cake:", errorMsg);
        }
      },
    );
  };

  const handleToggleCake = async (cakeId: string) => {
    try {
      await toggleFeaturedCakeStatus(cakeId);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to toggle featured cake status";
      console.error("Failed to toggle featured cake:", errorMsg);
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
          <Button onClick={() => fetchFeaturedCakes()} className="mt-4">
            Try Again
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
            {t("featuredCakes.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("featuredCakes.description")}
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          {isLoading ? t("common.loading") : t("featuredCakes.addCake")}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{t("common.status")}:</span>
          <div className="flex gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              {t("common.all")}
            </Button>
            <Button
              variant={activeFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("active")}
            >
              {t("featuredCakes.active")}
            </Button>
            <Button
              variant={activeFilter === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("inactive")}
            >
              {t("featuredCakes.inactive")}
            </Button>
          </div>
        </div>
      </div>

      {filteredCakes.length === 0 ? (
        <div className="flex-1">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>
                {featuredCakes.length === 0
                  ? t("featuredCakes.noCakesYet")
                  : t("featuredCakes.noCakesMatch")}
              </EmptyTitle>
              <EmptyDescription>
                {featuredCakes.length === 0
                  ? t("featuredCakes.addFirstCake")
                  : t("featuredCakes.tryAdjusting")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCakes.map((cake) => (
            <FeaturedCakeCard
              key={cake.id}
              cake={cake}
              onEdit={(c) => setEditingCake(c)}
              onDelete={handleDeleteCake}
              onToggleActive={() => handleToggleCake(cake.id)}
            />
          ))}
        </div>
      )}

      {/* Add Featured Cake Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto max-w-2xl py-6">
          <SheetHeader>
            <SheetTitle>{t("featuredCakes.addNewCake")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <AddFeaturedCakeForm
              onSubmit={handleAddCake}
              isLoading={isLoading}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Featured Cake Sheet */}
      {editingCake && (
        <Sheet open={!!editingCake} onOpenChange={() => setEditingCake(null)}>
          <SheetContent className="overflow-y-auto max-w-2xl py-6">
            <SheetHeader>
              <SheetTitle>{t("featuredCakes.editCake")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <EditFeaturedCakeForm
                cake={editingCake}
                onSubmit={handleUpdateCake}
                isLoading={isLoading}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
