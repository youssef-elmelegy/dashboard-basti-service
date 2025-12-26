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
import { TagSelector } from "@/components/TagSelector";
import { useState } from "react";
import { Upload, RotateCw } from "lucide-react";

const addSweetSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  image: z.string().min(1, "Please upload an image"),
  price: z
    .number()
    .min(1, "Price must be at least $1")
    .max(10000, "Price must be less than $10000"),
  capacity: z
    .number()
    .min(1, "Capacity must be at least 1")
    .max(1000, "Capacity must be less than 1000"),
  tags: z.array(z.string()).min(1, "Select at least one tag"),
  isActive: z.boolean(),
});

type AddSweetFormValues = z.infer<typeof addSweetSchema>;

interface AddSweetFormProps {
  onSubmit: (values: AddSweetFormValues) => void;
  isLoading?: boolean;
}

export function AddSweetForm({
  onSubmit,
  isLoading = false,
}: AddSweetFormProps) {
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm<AddSweetFormValues>({
    resolver: zodResolver(addSweetSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      price: 0,
      capacity: 0,
      tags: [],
      isActive: true,
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        form.setValue("image", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Chocolate Truffles" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Describe your sweet..." {...field} />
              </FormControl>
              <FormDescription>
                Minimum 10 characters, maximum 500
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-3">
                  {!imagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  ) : (
                    <label className="relative w-full h-48 rounded-lg overflow-hidden border border-border cursor-pointer group">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <RotateCw className="w-4 h-4 text-white" />
                        <span className="text-white font-medium text-sm">
                          Replace Image
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                  <input type="hidden" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="25"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                <FormLabel>Capacity (servings)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="12"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
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
                label="Tags"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Sweet"}
        </Button>
      </form>
    </Form>
  );
}
