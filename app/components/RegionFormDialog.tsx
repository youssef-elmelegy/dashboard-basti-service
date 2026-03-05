import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RegionForm, type RegionFormValues } from "@/components/RegionForm";
import { useAddRegionStore } from "@/stores/addRegionStore";
import { useRegionStore } from "@/stores/regionStore";

export function RegionFormDialog() {
  const isOpen = useAddRegionStore((state) => state.isOpen);
  const config = useAddRegionStore((state) => state.config);
  const closeDialog = useAddRegionStore((state) => state.closeDialog);
  const callback = useAddRegionStore((state) => state.callback);

  const isLoading = useRegionStore((state) => state.isLoading);
  const addRegion = useRegionStore((state) => state.addRegion);
  const updateRegion = useRegionStore((state) => state.updateRegion);

  const handleSubmit = async (values: RegionFormValues): Promise<void> => {
    try {
      if (config?.mode === "edit" && config?.region) {
        await updateRegion(config.region.id, values);
      } else {
        await addRegion(values);
      }
      callback?.(values);
      closeDialog();
    } catch (error) {
      console.error("Failed to save region:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeDialog}>
      <SheetContent
        side="bottom"
        className="w-full sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {config?.mode === "edit" ? "Edit Region" : "Add Region"}
          </SheetTitle>
          <SheetDescription>
            {config?.mode === "edit"
              ? "Update region details and image"
              : "Add a new region with image and availability status"}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <RegionForm
            region={config?.region}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            mode={config?.mode || "add"}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
