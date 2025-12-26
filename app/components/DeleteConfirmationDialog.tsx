import { type ReactNode } from "react";
import { useDeleteDialogStore } from "@/stores/deleteDialogStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

export function DeleteDialogProvider({ children }: { children: ReactNode }) {
  const { open, config, isLoading, closeDeleteDialog, confirmDelete } =
    useDeleteDialogStore();

  return (
    <>
      {children}
      <Sheet open={open} onOpenChange={closeDeleteDialog}>
        <SheetContent side="bottom" className="w-full sm:max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle>
              {config?.title || `Delete ${config?.recordType}?`}
            </SheetTitle>
            <SheetDescription>
              {config?.description || (
                <>
                  Are you sure you want to delete{" "}
                  <strong>{config?.recordName}</strong>? This action cannot be
                  undone.
                </>
              )}
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
