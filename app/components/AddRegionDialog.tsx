import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useAddRegionStore } from "@/stores/addRegionStore";

export function AddRegionDialog() {
  const isOpen = useAddRegionStore((state) => state.isOpen);
  const config = useAddRegionStore((state) => state.config);
  const inputValue = useAddRegionStore((state) => state.inputValue);
  const setInputValue = useAddRegionStore((state) => state.setInputValue);
  const closeDialog = useAddRegionStore((state) => state.closeDialog);
  const confirm = useAddRegionStore((state) => state.confirm);

  return (
    <Sheet open={isOpen} onOpenChange={closeDialog}>
      <SheetContent side="bottom" className="w-full sm:max-w-md mx-auto">
        <SheetHeader>
          <SheetTitle>
            {config?.mode === "edit" ? "Edit Region" : "Add Region"}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="pt-4">
              <Input
                type="text"
                placeholder="Region name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    confirm();
                  }
                }}
                autoFocus
                className="mb-4"
              />
              <div className="flex gap-3">
                <SheetClose asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </SheetClose>
                <Button className="flex-1" onClick={confirm}>
                  {config?.mode === "edit" ? "Save" : "Add"}
                </Button>
              </div>
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
