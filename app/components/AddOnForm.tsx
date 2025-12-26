import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TagSelector } from "@/components/TagSelector";
import { ImageUploadField } from "@/components/ImageUploadField";
import type { AddOn } from "@/data/products";

const addOnSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  image: z.string().min(1, "Image is required"),
  category: z.enum(["card", "balloon", "candle", "decoration", "other"]),
  price: z
    .number()
    .min(0.01, "Price must be at least $0.01")
    .max(10000, "Price must be less than $10000"),
  tags: z.array(z.string()).min(0, "Tags are optional"),
  isActive: z.boolean(),
});

type AddOnFormValues = z.infer<typeof addOnSchema>;

interface AddOnFormProps {
  initialAddOn?: AddOn;
  onSubmit: (addOn: Omit<AddOn, "id">) => void;
  isLoading?: boolean;
}

export function AddOnForm({
  initialAddOn,
  onSubmit,
  isLoading = false,
}: AddOnFormProps) {
  const form = useForm<AddOnFormValues>({
    resolver: zodResolver(addOnSchema),
    defaultValues: {
      name: initialAddOn?.name || "",
      description: initialAddOn?.description || "",
      image: initialAddOn?.image || "",
      category: initialAddOn?.category || "card",
      price: initialAddOn?.price || 0,
      tags: initialAddOn?.tags || [],
      isActive: initialAddOn?.isActive ?? true,
    },
  });

  const handleImageUpload = (base64: string) => {
    form.setValue("image", base64);
  };

  const handleSubmit = (values: AddOnFormValues) => {
    onSubmit({
      name: values.name,
      description: values.description,
      image: values.image,
      category: values.category,
      price: values.price,
      tags: values.tags,
      isActive: values.isActive,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 px-4"
      >
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Add-on Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Birthday Card" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Describe your add-on..." {...field} />
              </FormControl>
              <FormDescription>
                Minimum 10 characters, maximum 500
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image */}
        <FormField
          control={form.control}
          name="image"
          render={() => (
            <ImageUploadField label="Image" onImageChange={handleImageUpload} />
          )}
        />

        {/* Category and Price */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="balloon">Balloon</SelectItem>
                    <SelectItem value="candle">Candle</SelectItem>
                    <SelectItem value="decoration">Decoration</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <TagSelector
                  selectedTags={field.value}
                  onTagToggle={(tag) => {
                    const current = field.value;
                    if (current.includes(tag)) {
                      field.onChange(current.filter((t) => t !== tag));
                    } else {
                      field.onChange([...current, tag]);
                    }
                  }}
                  label=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base cursor-pointer">
                  Active
                </FormLabel>
                <FormDescription>
                  Make this add-on available for selection
                </FormDescription>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : initialAddOn
            ? "Update Add-on"
            : "Add Add-on"}
        </Button>
      </form>
    </Form>
  );
}
