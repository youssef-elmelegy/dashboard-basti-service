import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { BakeryType, Bakery } from "@/lib/services/bakery.service";
import { useRegionStore } from "@/stores/regionStore";

const bakeryTypes: { label: string; value: BakeryType }[] = [
  { label: "Basket Cakes", value: "basket_cakes" },
  { label: "Midume", value: "midume" },
  { label: "Small Cakes", value: "small_cakes" },
  { label: "Large Cakes", value: "large_cakes" },
  { label: "Custom", value: "custom" },
];

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
    .array(
      z.enum([
        "basket_cakes",
        "midume",
        "small_cakes",
        "large_cakes",
        "custom",
      ]),
    )
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
  ) => void;
}

export function EditBakery({ bakery, onSubmit }: EditBakeryProps) {
  const regions = useRegionStore((state) => state.regions);

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

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      name: values.name,
      locationDescription: values.locationDescription,
      regionId: values.regionId,
      capacity: values.capacity,
      types: values.bakeryTypes,
    });
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Edit Bakery</SheetTitle>
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
                    <FormLabel>Bakery Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bakery name" {...field} />
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
                    <FormLabel>Location Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter location description"
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
                    <FormLabel>Capacity</FormLabel>
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
                    <FormLabel>Region</FormLabel>
                    {regions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No regions available. Create regions first.
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
                    <FormLabel>Bakery Types</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {bakeryTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleTypeToggle(type.value)}
                          className={cn(
                            "px-3 py-1 rounded-full text-sm border transition-colors",
                            selectedTypes.includes(type.value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Update Bakery
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
}
