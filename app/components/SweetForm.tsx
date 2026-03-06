import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useTranslation } from "react-i18next";
import type { Sweet } from "@/lib/services/sweet.service";
import { X, Plus } from "lucide-react";

const sweetSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  images: z.array(z.string()).min(1, "At least one image is required"),
  sizes: z.array(z.string()).min(1, "At least one size is required"),
  isActive: z.boolean(),
});

export type SweetFormValues = z.infer<typeof sweetSchema>;

interface SweetFormProps {
  initialSweet?: Sweet;
  onSubmit: (data: SweetFormValues) => Promise<void> | void;
  isLoading?: boolean;
}

export function SweetForm({
  initialSweet,
  onSubmit,
  isLoading = false,
}: SweetFormProps) {
  const { t } = useTranslation();
  const isEditMode = !!initialSweet;

  const form = useForm<SweetFormValues>({
    resolver: zodResolver(sweetSchema),
    defaultValues: initialSweet || {
      name: "",
      description: "",
      images: [],
      sizes: [],
      isActive: true,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 mt-6 px-6"
      >
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sweets.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    t("sweets.namePlaceholder") || "e.g., Chocolate Donut"
                  }
                  {...field}
                />
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
              <FormLabel>{t("sweets.description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    t("sweets.descriptionPlaceholder") ||
                    "Describe the sweet..."
                  }
                  {...field}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Images */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.images")}</FormLabel>
              <FormControl>
                <MultiImageUploader
                  images={field.value}
                  onImagesChange={field.onChange}
                  label={t("common.uploadImage")}
                  error={form.formState.errors.images?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sizes */}
        <FormField
          control={form.control}
          name="sizes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sweets.sizes")}</FormLabel>
              <div className="space-y-2">
                {field.value.map((size, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={size}
                      onChange={(e) => {
                        const newSizes = [...field.value];
                        newSizes[index] = e.target.value;
                        field.onChange(newSizes);
                      }}
                      placeholder="e.g., Small"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const newSizes = field.value.filter(
                          (_, i) => i !== index,
                        );
                        field.onChange(newSizes);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    field.onChange([...field.value, ""]);
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Size
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="w-4 h-4"
              />
              <FormLabel className="!mt-0">{t("sweets.isActive")}</FormLabel>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? t("common.loading")
            : isEditMode
              ? t("sweets.updateSweet")
              : t("sweets.createSweet")}
        </Button>
      </form>
    </Form>
  );
}
