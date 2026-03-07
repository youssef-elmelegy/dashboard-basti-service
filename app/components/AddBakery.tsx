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
import { useRegionStore } from "@/stores/regionStore";
import type { BakeryType } from "@/lib/services/bakery.service";

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
  regionId: z
    .string()
    .uuid({ message: "Please select a valid region!" })
    .min(1, { message: "Region is required!" }),
  capacity: z
    .number({ message: "Capacity must be a number!" })
    .min(1, { message: "Capacity must be at least 1!" })
    .max(10000, { message: "Capacity must not exceed 10000!" }),
  bakeryTypes: z
    .array(
      z.enum([
        "small_cakes",
        "large_cakes",
        "others",
        "basket_cakes",
        "midume",
        "custom",
      ]),
    )
    .min(1, { message: "Select at least one bakery type!" }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddBakeryProps {
  onSubmit: (data: FormValues) => void;
}

export function AddBakery({ onSubmit }: AddBakeryProps) {
  const { t } = useTranslation();
  const regions = useRegionStore((state) => state.regions);

  const getBakeryTypeLabel = (type: BakeryType): string => {
    const typeMap: Record<BakeryType, string> = {
      small_cakes: "smallCakes",
      large_cakes: "largeCakes",
      others: "othersType",
      basket_cakes: "basketCakes",
      midume: "midume",
      custom: "customType",
    };
    return t(`bakeriesManagement.${typeMap[type]}`);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      locationDescription: "",
      regionId: "",
      capacity: undefined,
      bakeryTypes: [],
    },
  });

  const selectedTypes = form.watch("bakeryTypes");

  const handleTypeToggle = (type: BakeryType) => {
    const current = form.getValues("bakeryTypes");
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    form.setValue("bakeryTypes", updated, { shouldValidate: true });
  };

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <SheetContent className="py-6">
      <SheetHeader>
        <SheetTitle className="mb-4">
          {t("bakeriesManagement.addBakery")}
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
                name="regionId"
                render={({ field }) => (
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
                            onClick={() => {
                              field.onChange(region.id);
                            }}
                            className={cn(
                              "px-3 py-1 rounded-full text-sm border transition-colors",
                              field.value === region.id
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
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bakeriesManagement.capacity")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter capacity (orders per day)"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
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
                          large_cakes: true,
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                {t("bakeriesManagement.addBakery")}
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
}
