import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Chef } from "@/lib/services/chef.service";
import { useBakeryStore } from "@/stores/bakeryStore";

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Chef name must be at least 2 characters!" })
    .max(255, { message: "Chef name must not exceed 255 characters!" }),
  specialization: z
    .string()
    .min(2, { message: "Specialization must be at least 2 characters!" })
    .max(255, { message: "Specialization must not exceed 255 characters!" }),
  image: z
    .string()
    .url({ message: "Image must be a valid URL!" })
    .optional()
    .or(z.literal("")),
  bakeryId: z
    .string()
    .uuid({ message: "Please select a valid bakery!" })
    .min(1, { message: "Bakery is required!" }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditChefProps {
  chef: Chef;
  onSubmit: (data: Omit<Chef, "id" | "createdAt" | "updatedAt">) => void;
}

const EditChef = ({ chef, onSubmit }: EditChefProps) => {
  const bakeries = useBakeryStore((state) => state.bakeries);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: chef.name,
      specialization: chef.specialization,
      image: chef.image || "",
      bakeryId: chef.bakeryId,
    },
  });

  useEffect(() => {
    form.reset({
      name: chef.name,
      specialization: chef.specialization,
      image: chef.image || "",
      bakeryId: chef.bakeryId,
    });
  }, [chef.id, form]);

  const selectedBakeryId = form.watch("bakeryId");

  const handleBakerySelect = (bakeryId: string) => {
    form.setValue("bakeryId", bakeryId, { shouldValidate: true });
  };

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      name: data.name,
      specialization: data.specialization,
      image: data.image || null,
      bakeryId: data.bakeryId,
    } as any);
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Edit Chef</SheetTitle>
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
                    <FormLabel>Chef Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter chef name" {...field} />
                    </FormControl>
                    <FormDescription>The chef's full name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pastry Chef, Head Chef" {...field} />
                    </FormControl>
                    <FormDescription>Chef's area of expertise.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/chef-image.jpg" 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Chef's profile image URL.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bakeryId"
                render={() => (
                  <FormItem>
                    <FormLabel>Bakery</FormLabel>
                    {bakeries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No bakeries available. Create bakeries first.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {bakeries.map((bakery) => (
                          <button
                            key={bakery.id}
                            type="button"
                            onClick={() => handleBakerySelect(bakery.id)}
                            className={cn(
                              "px-3 py-1 rounded-full text-sm border transition-colors",
                              selectedBakeryId === bakery.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted"
                            )}
                          >
                            {bakery.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={bakeries.length === 0}
              >
                Update Chef
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default EditChef;
