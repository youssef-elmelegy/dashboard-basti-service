import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { AddOnStock } from "@/data/stock";
import { useStockStore } from "@/stores/stockStore";

const restockSchema = z.object({
  currentStock: z
    .number()
    .min(0, "Stock cannot be negative")
    .max(1000000, "Stock cannot exceed 1,000,000"),
});

type RestockFormValues = z.infer<typeof restockSchema>;

interface RestockDialogProps {
  stock: AddOnStock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestockDialog({
  stock,
  open,
  onOpenChange,
}: RestockDialogProps) {
  const updateStock = useStockStore((state) => state.updateStock);
  const [displayStock, setDisplayStock] = useState(0);

  const form = useForm<RestockFormValues>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      currentStock: 0,
    },
  });

  // Reset form and display stock when stock changes or sheet opens
  useEffect(() => {
    if (stock && open) {
      const stockValue = stock.currentStock;
      form.reset({
        currentStock: stockValue,
      });
      // Use setTimeout to avoid cascading renders
      const timer = setTimeout(() => {
        setDisplayStock(stockValue);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [stock, open, form]);

  // Update display stock when form value changes
  const handleStockChange = (value: number) => {
    setDisplayStock(value);
  };

  const onSubmit = (values: RestockFormValues) => {
    if (stock) {
      updateStock(stock.id, values.currentStock);
      onOpenChange(false);
      form.reset();
    }
  };

  if (!stock) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96">
        <SheetHeader>
          <SheetTitle>Restock Add-on</SheetTitle>
          <SheetDescription>
            Update stock level for{" "}
            <span className="font-semibold">{stock.addOnName}</span> in{" "}
            <span className="font-semibold">{stock.regionName}</span>
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6 px-4"
          >
            {/* Current Stock Info */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-2">
                    Current Stock Level
                  </p>
                  <p className="text-3xl font-bold">{displayStock}</p>
                  <p className="text-xs text-muted-foreground mt-2">pieces</p>
                </div>
              </CardContent>
            </Card>

            {/* Stock Input */}
            <FormField
              control={form.control}
              name="currentStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    Update Stock Level
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter stock quantity"
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        field.onChange(value);
                        handleStockChange(value);
                      }}
                      min="0"
                      max="1000000"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the new stock amount in pieces
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Button */}
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="w-full">
                Update Stock
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
