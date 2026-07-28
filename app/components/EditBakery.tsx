import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { BakeryType, Bakery } from "@/lib/services/bakery.service";
import { useRegionStore } from "@/stores/regionStore";
import {
  useBakeryItemStore,
  countItemsWithStock,
} from "@/stores/bakeryItemStore";
import { bakeryCarriesStock } from "@/lib/bakeryStock";

// Zod schema for form validation
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Bakery name must be at least 2 characters!" })
    .max(255, { message: "Bakery name must not exceed 255 characters!" }),
  locationDescription: z
    .string()
    .min(5, { message: "Location description must be at least 5 characters!" })
    .max(500, {
      message: "Location description must not exceed 500 characters!",
    }),
  regionId: z.string().uuid({ message: "Invalid region selection!" }),
  capacity: z
    .number()
    .min(1, { message: "Capacity must be at least 1!" })
    .max(10000, { message: "Capacity must not exceed 10000!" }),
  bakeryTypes: z
    .array(z.enum(["small_cakes", "big_cakes", "others"]))
    .min(1, { message: "Select at least one bakery type!" }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditBakeryProps {
  bakery: Bakery;
  onSubmit: (
    data: Omit<
      Bakery,
      "id" | "averageRating" | "totalReviews" | "createdAt" | "updatedAt"
    >,
  ) => void | Promise<void>;
}

export function EditBakery({ bakery, onSubmit }: EditBakeryProps) {
  const { t } = useTranslation();
  const regions = useRegionStore((state) => state.regions);

  const getBakeryTypeLabel = (type: BakeryType): string => {
    const typeMap: Record<BakeryType, string> = {
      small_cakes: "smallCakes",
      big_cakes: "bigCakes",
      others: "othersType",
    };
    return t(`bakeriesManagement.${typeMap[type]}`);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bakery.name,
      locationDescription: bakery.locationDescription,
      regionId: bakery.regionId,
      capacity: bakery.capacity,
      bakeryTypes: bakery.types as BakeryType[],
    },
  });

  const selectedTypes = form.watch("bakeryTypes");
  const selectedRegionId = form.watch("regionId");

  // Stock lives only on "others" bakeries, so dropping that type discards it.
  // Loaded once on mount for bakeries that could have stock in the first place.
  const [stockedCount, setStockedCount] = useState(0);
  const carriedStockInitially = bakeryCarriesStock(bakery.types);

  useEffect(() => {
    if (!carriedStockInitially) return;

    let cancelled = false;
    useBakeryItemStore
      .getState()
      .fetchBakeryItems(bakery.id)
      .then(() => {
        if (cancelled) return;
        setStockedCount(
          countItemsWithStock(
            useBakeryItemStore.getState().getItemsByBakery(bakery.id),
          ),
        );
      })
      .catch((error) =>
        console.error("Failed to load bakery stock for edit warning:", error),
      );

    return () => {
      cancelled = true;
    };
  }, [bakery.id, carriedStockInitially]);

  const willLoseStock =
    carriedStockInitially &&
    !bakeryCarriesStock(selectedTypes) &&
    stockedCount > 0;

  const handleRegionSelect = (regionId: string) => {
    form.setValue("regionId", regionId, { shouldValidate: true });
  };

  const handleTypeToggle = (type: BakeryType) => {
    const current = form.getValues("bakeryTypes");
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    form.setValue("bakeryTypes", updated, { shouldValidate: true });
  };

  // Awaited so react-hook-form keeps `isSubmitting` true for the whole request,
  // which is what disables the submit button against double-clicks.
  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      name: values.name,
      locationDescription: values.locationDescription,
      regionId: values.regionId,
      capacity: values.capacity,
      types: values.bakeryTypes,
    });
  };

  return (
    <SheetContent className="py-6">
      <SheetHeader>
        <SheetTitle className="mb-4">
          {t("bakeriesManagement.editBakery")}
        </SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bakeriesManagement.bakeryName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("bakeriesManagement.enterBakeryName")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("bakeriesManagement.locationDescription")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "bakeriesManagement.enterLocationDescription",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bakeriesManagement.capacity")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter capacity"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regionId"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("bakeriesManagement.region")}</FormLabel>
                    {regions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("bakeriesManagement.noRegionsAvailable")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {regions.map((region) => (
                          <button
                            key={region.id}
                            type="button"
                            onClick={() => handleRegionSelect(region.id)}
                            className={cn(
                              "px-3 py-1 rounded-full text-sm border transition-colors",
                              selectedRegionId === region.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted",
                            )}
                          >
                            {region.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bakeryTypes"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("bakeriesManagement.bakeryTypes")}</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {(
                        Object.keys({
                          small_cakes: true,
                          big_cakes: true,
                          others: true,
                        }) as BakeryType[]
                      ).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleTypeToggle(value)}
                          className={cn(
                            "px-3 py-1 rounded-full text-sm border transition-colors",
                            selectedTypes.includes(value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          {getBakeryTypeLabel(value)}
                        </button>
                      ))}
                    </div>
                    {willLoseStock && (
                      <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {t("bakeriesManagement.editStockWarning", {
                            count: stockedCount,
                            defaultValue_one:
                              "Removing this type will discard the stock held for 1 item.",
                            defaultValue_other:
                              "Removing this type will discard the stock held for {{count}} items.",
                          })}
                        </span>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t("bakeriesManagement.updateBakery")}
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
}
