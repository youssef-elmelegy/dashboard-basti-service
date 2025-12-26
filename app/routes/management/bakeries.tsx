import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BakeryCard } from "@/components/BakeryCard";
import { AddBakery } from "@/components/AddBakery";
import { EditBakery } from "@/components/EditBakery";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useState } from "react";
import type { Bakery } from "@/data/bakeries";

export default function BakeriesPage() {
  const bakeries = useBakeryStore((state) => state.bakeries);
  const addBakery = useBakeryStore((state) => state.addBakery);
  const updateBakery = useBakeryStore((state) => state.updateBakery);
  const deleteBakery = useBakeryStore((state) => state.deleteBakery);

  const { openDeleteDialog } = useDeleteDialog();

  const [selectedBakery, setSelectedBakery] = useState<Bakery | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleAddBakery = (data: Omit<Bakery, "id">) => {
    const newBakery: Bakery = {
      ...data,
      id: `bakery${Date.now()}`,
    };
    addBakery(newBakery);
    setIsAddOpen(false);
  };

  const handleEditBakery = (data: Bakery) => {
    if (selectedBakery) {
      updateBakery(selectedBakery.id, data);
      setIsEditOpen(false);
      setSelectedBakery(null);
    }
  };

  const handleDeleteBakery = (bakery: Bakery) => {
    openDeleteDialog(
      {
        recordName: bakery.name,
        recordType: "Bakery",
      },
      () => {
        deleteBakery(bakery.id);
      }
    );
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/management/regions">
                Regions
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Bakeries</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bakeries</h1>
          <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Bakery
              </Button>
            </SheetTrigger>
            <AddBakery
              onSubmit={(data) => handleAddBakery(data as Omit<Bakery, "id">)}
            />
          </Sheet>
        </div>
      </div>

      {/* Bakeries Grid */}
      {bakeries.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-2xl">📦</span>
            </EmptyMedia>
            <EmptyTitle>No Bakeries Yet</EmptyTitle>
            <EmptyDescription>
              Start by adding your first bakery to get started
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Bakery
                </Button>
              </SheetTrigger>
              <AddBakery
                onSubmit={(data) => handleAddBakery(data as Omit<Bakery, "id">)}
              />
            </Sheet>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bakeries.map((bakery) => (
            <Sheet
              key={bakery.id}
              open={isEditOpen && selectedBakery?.id === bakery.id}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedBakery(null);
                  setIsEditOpen(false);
                }
              }}
            >
              <BakeryCard
                bakery={bakery}
                onEdit={(b) => {
                  setSelectedBakery(b);
                  setIsEditOpen(true);
                }}
                onDelete={handleDeleteBakery}
              />
              {selectedBakery?.id === bakery.id && (
                <EditBakery
                  bakery={selectedBakery}
                  onSubmit={handleEditBakery}
                />
              )}
            </Sheet>
          ))}
        </div>
      )}
    </div>
  );
}
