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
import type { Bakery, BakeryType } from "@/data/bakeries";
import { useRegionStore } from "@/stores/regionStore";

const bakeryTypes: { label: string; value: BakeryType }[] = [
  { label: "Basket Cakes", value: "basket_cakes" },
  { label: "Midume", value: "midume" },
  { label: "Small Cakes", value: "small_cakes" },
  { label: "Large Cakes", value: "large_cakes" },
  { label: "Custom", value: "custom" },
];

// Zod schema for form validation
const formSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Bakery name must be at least 2 characters!" })
      .max(50, { message: "Bakery name must not exceed 50 characters!" }),
    location: z
      .string()
      .min(2, { message: "Location must be at least 2 characters!" })
      .max(100, { message: "Location must not exceed 100 characters!" }),
    capacity: z.string().min(1, { message: "Capacity is required!" }),
    employees: z.string().min(1, { message: "Employees is required!" }),
    regions: z
      .array(z.string())
      .min(1, { message: "Select at least one region!" }),
    types: z
      .array(
        z.enum([
          "basket_cakes",
          "midume",
          "small_cakes",
          "large_cakes",
          "custom",
        ])
      )
      .min(1, { message: "Select at least one bakery type!" }),
  })
  .superRefine((data, ctx) => {
    // Validate capacity as number
    const capacity = parseInt(data.capacity);
    if (isNaN(capacity) || capacity < 1 || capacity > 10000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["capacity"],
        message: "Capacity must be a number between 1 and 10000!",
      });
    }

    // Validate employees as number
    const employees = parseInt(data.employees);
    if (isNaN(employees) || employees < 1 || employees > 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["employees"],
        message: "Employees must be a number between 1 and 1000!",
      });
    }
  });

type FormValues = {
  name: string;
  location: string;
  capacity: string;
  employees: string;
  regions: string[];
  types: BakeryType[];
};

interface EditBakeryProps {
  bakery: Bakery;
  onSubmit: (data: Bakery) => void;
}

export function EditBakery({ bakery, onSubmit }: EditBakeryProps) {
  const regions = useRegionStore((state) => state.regions);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bakery.name,
      location: bakery.location,
      capacity: bakery.capacity.toString(),
      employees: bakery.employees.toString(),
      regions: bakery.regions,
      types: bakery.types,
    },
  });

  const selectedRegions = form.watch("regions");
  const selectedTypes = form.watch("types");

  const handleRegionToggle = (region: string) => {
    const current = form.getValues("regions");
    const updated = current.includes(region)
      ? current.filter((r) => r !== region)
      : [...current, region];
    form.setValue("regions", updated, { shouldValidate: true });
  };

  const handleTypeToggle = (type: BakeryType) => {
    const current = form.getValues("types");
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    form.setValue("types", updated, { shouldValidate: true });
  };

  const handleSubmit = (values: FormValues) => {
    const capacity = parseInt(values.capacity);
    const employees = parseInt(values.employees);

    const updatedBakery: Bakery = {
      id: bakery.id,
      name: values.name,
      location: values.location,
      capacity,
      employees,
      regions: values.regions,
      types: values.types as BakeryType[],
    };
    onSubmit(updatedBakery);
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employees</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter number of employees"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regions"
                render={() => (
                  <FormItem>
                    <FormLabel>Regions</FormLabel>
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
                            onClick={() => handleRegionToggle(region.name)}
                            className={cn(
                              "px-3 py-1 rounded-full text-sm border transition-colors",
                              selectedRegions.includes(region.name)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted"
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
                name="types"
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
                              : "border-border hover:bg-muted"
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
