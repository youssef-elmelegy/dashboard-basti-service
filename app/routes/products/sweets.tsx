import { useState } from "react";
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
import { SweetCard } from "@/components/SweetCard";
import { AddSweetForm } from "@/components/AddSweetForm";
import { EditSweetForm } from "@/components/EditSweetForm";
import { ProductFilter } from "@/components/ProductFilter";
import { useSweetStore } from "@/stores/sweetStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { Sweet } from "@/data/products";
import { Plus } from "lucide-react";

export default function SweetsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSweet, setEditingSweet] = useState<Sweet | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const sweets = useSweetStore((state) => state.sweets);
  const addSweet = useSweetStore((state) => state.addSweet);
  const updateSweet = useSweetStore((state) => state.updateSweet);
  const deleteSweet = useSweetStore((state) => state.deleteSweet);
  const toggleSweetActive = useSweetStore((state) => state.toggleSweetActive);
  const { openDeleteDialog } = useDeleteDialog();

  // Get all unique tags from sweets
  const allTags = Array.from(new Set(sweets.flatMap((s) => s.tags))).sort();

  // Filter sweets based on selected filters
  const filteredSweets = sweets.filter((sweet) => {
    // Filter by active status
    if (activeFilter === "active" && !sweet.isActive) return false;
    if (activeFilter === "inactive" && sweet.isActive) return false;

    // Filter by tags (if any selected, show products that have at least one matching tag)
    if (selectedTags.length > 0) {
      return selectedTags.some((tag) => sweet.tags.includes(tag));
    }

    return true;
  });

  const handleAddSweet = (values: Omit<Sweet, "id" | "createdAt">) => {
    addSweet({
      id: Date.now().toString(),
      ...values,
      createdAt: new Date(),
    });
    setIsAddOpen(false);
  };

  const handleUpdateSweet = (values: Omit<Sweet, "createdAt">) => {
    if (editingSweet) {
      updateSweet(editingSweet.id, {
        ...editingSweet,
        ...values,
      });
      setEditingSweet(null);
    }
  };

  const handleDeleteSweet = (sweet: Sweet) => {
    openDeleteDialog(
      {
        recordName: sweet.name,
        recordType: "sweet",
        title: "Delete Sweet",
        description: `Are you sure you want to delete "${sweet.name}"? This action cannot be undone.`,
      },
      () => deleteSweet(sweet.id)
    );
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sweets</h1>
          <p className="text-muted-foreground">Manage your sweet products</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Sweet
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-muted/50 p-4 rounded-lg border">
        <ProductFilter
          availableTags={allTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
        />
      </div>

      {filteredSweets.length === 0 ? (
        <div className="flex-1">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>
                {sweets.length === 0
                  ? "No sweets yet"
                  : "No sweets match your filters"}
              </EmptyTitle>
              <EmptyDescription>
                {sweets.length === 0
                  ? "Add your first sweet product to get started"
                  : "Try adjusting your filters to find products"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSweets.map((sweet) => (
            <SweetCard
              key={sweet.id}
              sweet={sweet}
              onEdit={(s) => setEditingSweet(s)}
              onDelete={handleDeleteSweet}
              onToggleActive={toggleSweetActive}
            />
          ))}
        </div>
      )}

      {/* Add Sweet Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Sweet</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <AddSweetForm onSubmit={handleAddSweet} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sweet Sheet */}
      {editingSweet && (
        <Sheet open={!!editingSweet} onOpenChange={() => setEditingSweet(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Sweet</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <EditSweetForm
                sweet={editingSweet}
                onSubmit={handleUpdateSweet}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
