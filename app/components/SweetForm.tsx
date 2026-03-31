import { useState, useEffect } from "react";
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
import { useSweetStore } from "@/stores/sweetStore";
import { useTagsStore } from "@/stores/tagsStore";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { convertToWebP } from "@/lib/image-utils";
import { X, Plus } from "lucide-react";

const sweetSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  images: z.array(z.string()).min(1, "At least one image is required"),
  sizes: z.array(z.string()).min(1, "At least one size is required"),
  tagId: z.string().optional(),
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
  const uploadSweetImage = useSweetStore((state) => state.uploadSweetImage);
  const tags = useTagsStore((s) => s.tags);
  const fetchTags = useTagsStore((s) => s.fetchTags);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<SweetFormValues>({
    resolver: zodResolver(sweetSchema),
    defaultValues: {
      name: initialSweet?.name || "",
      description: initialSweet?.description || "",
      images: initialSweet?.images || [],
      sizes: initialSweet?.sizes || [],
      tagId: initialSweet?.tagId || undefined,
      isActive: initialSweet?.isActive ?? true,
    },
  });

  // fetch tags for the select dropdown
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleImagesChange = async (images: string[]) => {
    form.setValue("images", images, { shouldValidate: true });

    if (images.length === 0) return;

    const newDataUrls = images.filter((img) => img.startsWith("data:"));
    const existingUrls = images.filter((img) => !img.startsWith("data:"));

    if (newDataUrls.length === 0) return;

    try {
      setUploadingImage(true);
      const uploaded: string[] = [];
      for (const img of newDataUrls) {
        const webpBlob = await convertToWebP(img);
        const file = new File([webpBlob], "sweet-image.webp", {
          type: "image/webp",
        });
        const result = await uploadSweetImage(file);
        uploaded.push(result.secure_url);
      }
      const finalUrls = [...existingUrls, ...uploaded];
      form.setValue("images", finalUrls, { shouldValidate: true });
    } catch (err) {
      console.error("Failed to upload sweet image:", err);
      form.setValue("images", existingUrls, { shouldValidate: true });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          // normalize empty tagId to undefined
          const payload = { ...values, tagId: values.tagId || undefined };
          return onSubmit(payload);
        })}
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
                  onImagesChange={handleImagesChange}
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
        {/* Tag */}
        <FormField
          control={form.control}
          name="tagId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.selectTag")}</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("common.selectTag") || "Select tag"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tags
                      .filter(
                        (tag) =>
                          Array.isArray(tag.types) &&
                          tag.types.includes("sweets"),
                      )
                      .map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <Button
          type="submit"
          disabled={isLoading || uploadingImage}
          className="w-full"
        >
          {isLoading || uploadingImage
            ? t("common.loading")
            : isEditMode
              ? t("sweets.updateSweet")
              : t("sweets.createSweet")}
        </Button>
      </form>
    </Form>
  );
}
