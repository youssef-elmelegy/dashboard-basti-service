import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TagSelector } from "@/components/TagSelector";
import { ImageUploadField } from "@/components/ImageUploadField";
import { FlavorsSection } from "@/components/FlavorsSection";
import { SizesSection } from "@/components/SizesSection";
import {
  addReadyCakeSchema,
  type AddReadyCakeFormValues,
} from "@/schemas/ready-cake.schema";

interface AddReadyCakeFormProps {
  onSubmit: (values: AddReadyCakeFormValues) => void;
  isLoading?: boolean;
}

export function AddReadyCakeForm({
  onSubmit,
  isLoading = false,
}: AddReadyCakeFormProps) {
  const form = useForm<AddReadyCakeFormValues>({
    resolver: zodResolver(addReadyCakeSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      basePrice: 0,
      capacity: 0,
      tags: [],
      flavors: [""],
      sizes: [{ name: "", price: 0 }],
      isActive: true,
    },
  });

  const {
    fields: flavorFields,
    append: appendFlavor,
    remove: removeFlavor,
  } = useFieldArray({
    control: form.control,
    name: "flavors" as never,
  });

  const {
    fields: sizeFields,
    append: appendSize,
    remove: removeSize,
  } = useFieldArray({
    control: form.control,
    name: "sizes",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cake Name</FormLabel>
              <Input placeholder="e.g., Vanilla Dream" {...field} />
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
              <Input placeholder="Describe your cake..." {...field} />
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
            <ImageUploadField
              label="Image"
              onImageChange={(base64) => field.onChange(base64)}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price ($)</FormLabel>
                <Input
                  type="number"
                  placeholder="45"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Servings</FormLabel>
                <Input
                  type="number"
                  placeholder="10"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
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

        <Separator />

        <FlavorsSection<AddReadyCakeFormValues>
          control={form.control}
          fields={flavorFields}
          fieldName="flavors"
          onAppend={() => appendFlavor("" as never)}
          onRemove={removeFlavor}
        />

        <Separator />

        <SizesSection<AddReadyCakeFormValues>
          control={form.control}
          fields={sizeFields}
          fieldName="sizes"
          onAppend={() => appendSize({ name: "", price: 0 })}
          onRemove={removeSize}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Cake"}
        </Button>
      </form>
    </Form>
  );
}
