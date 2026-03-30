import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useState } from "react";
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
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useAddOnStore } from "@/stores/addOnStore";
import { convertToWebP } from "@/lib/image-utils";
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
  images: z.array(z.string()).min(1, "At least one image is required"),
  category: z.enum([
    "cards",
    "balloons",
    "candles",
    "decorations",
    "sweets",
    "other",
  ]),
  isActive: z.boolean(),
});

type AddOnFormValues = z.infer<typeof addOnSchema>;

interface AddOnFormProps {
  initialAddOn?: AddOn;
  onSubmit: (addOn: Omit<AddOn, "id">) => void;
  isLoading?: boolean;
}

const categoryLabels: Record<string, string> = {
  cards: "Cards",
  balloons: "Balloons",
  candles: "Candles",
  decorations: "Decorations",
  sweets: "Sweets",
  other: "Other",
};

const pluralToSingular: Record<AddOnFormValues["category"], AddOn["category"]> =
  {
    cards: "card",
    balloons: "balloon",
    candles: "candle",
    decorations: "decoration",
    sweets: "sweets",
    other: "other",
  };

const singularToPlural: Record<AddOn["category"], AddOnFormValues["category"]> =
  {
    card: "cards",
    balloon: "balloons",
    candle: "candles",
    decoration: "decorations",
    sweets: "sweets",
    other: "other",
  };

export function AddOnForm({
  initialAddOn,
  onSubmit,
  isLoading = false,
}: AddOnFormProps) {
  const { t } = useTranslation();
  const uploadAddOnImage = useAddOnStore((state) => state.uploadAddOnImage);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(
    initialAddOn?.images || [],
  );

  const form = useForm<AddOnFormValues>({
    resolver: zodResolver(addOnSchema),
    defaultValues: {
      name: initialAddOn?.name || "",
      description: initialAddOn?.description || "",
      images: initialAddOn?.images || [],
      category: initialAddOn?.category
        ? singularToPlural[initialAddOn.category]
        : "decorations",
      isActive: initialAddOn?.isActive ?? true,
    },
  });

  const handleImagesChange = async (images: string[]) => {
    console.log("handleImagesChange called with images:", images);
    form.setValue("images", images, { shouldValidate: true });

    // If images were removed
    if (images.length === 0) {
      setUploadedImageUrls([]);
      return;
    }

    // Upload images that are base64 or data URLs
    const urlsToUpload: string[] = [];
    const alreadyUploadedUrls: string[] = [];

    for (const image of images) {
      if (image.startsWith("data:") || image.startsWith("blob:")) {
        urlsToUpload.push(image);
      } else {
        // Already a Cloudinary URL
        alreadyUploadedUrls.push(image);
      }
    }

    if (urlsToUpload.length > 0) {
      try {
        setUploadingImage(true);
        const uploadedUrls: string[] = [];

        for (const imageUrl of urlsToUpload) {
          const webpBlob = await convertToWebP(imageUrl);
          const file = new File([webpBlob], "addon-image.webp", {
            type: "image/webp",
          });
          const result = await uploadAddOnImage(file);
          uploadedUrls.push(result.secure_url);
        }

        // Combine uploaded URLs with already uploaded ones
        const allUrls = [...alreadyUploadedUrls, ...uploadedUrls];
        setUploadedImageUrls(allUrls);
        form.setValue("images", allUrls, { shouldValidate: true });
      } catch (error) {
        console.error("Error uploading images:", error);
        // Keep the uploaded URLs that succeeded
        setUploadedImageUrls(alreadyUploadedUrls);
        form.setValue("images", alreadyUploadedUrls, { shouldValidate: true });
      } finally {
        setUploadingImage(false);
      }
    } else {
      // All images are already uploaded
      setUploadedImageUrls(alreadyUploadedUrls);
    }
  };

  const handleSubmit = (values: AddOnFormValues) => {
    console.log("AddOnForm.handleSubmit called with values:", values);
    console.log("uploadedImageUrls:", uploadedImageUrls);

    // Use uploaded URLs instead of data URLs
    const finalValues = {
      ...values,
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : values.images,
      // map plural UI category to singular backend category
      category: pluralToSingular[values.category],
    } as Omit<AddOn, "id">;
    console.log("finalValues to submit:", finalValues);

    onSubmit(finalValues);
    form.reset();
    setUploadedImageUrls([]);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 mt-6 px-6"
      >
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("products.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("addOns.namePlaceholder")} {...field} />
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
              <FormLabel>{t("products.description")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("addOns.descriptionPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("products.descriptionHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Images */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <MultiImageUploader
              images={field.value}
              onImagesChange={handleImagesChange}
              label={t("products.images")}
              maxImages={5}
            />
          )}
        />

        {/* Category and Price */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("addOns.category")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          t("addOns.selectCategory") || "Select category"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="balloons">
                      {categoryLabels["balloons"]}
                    </SelectItem>
                    <SelectItem value="sweets">
                      {categoryLabels["sweets"]}
                    </SelectItem>
                    <SelectItem value="cards">
                      {categoryLabels["cards"]}
                    </SelectItem>
                    <SelectItem value="candles">
                      {categoryLabels["candles"]}
                    </SelectItem>
                    <SelectItem value="decorations">
                      {categoryLabels["decorations"]}
                    </SelectItem>
                    <SelectItem value="other">
                      {categoryLabels["other"]}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base cursor-pointer">
                  {t("addOns.active")}
                </FormLabel>
                <FormDescription>
                  {t("addOns.activeDescription")}
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
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || uploadingImage}
        >
          {uploadingImage
            ? t("common.loading")
            : isLoading
              ? t("common.loading")
              : initialAddOn
                ? t("addOns.updateAddOn")
                : t("addOns.createAddOn")}
        </Button>
      </form>
    </Form>
  );
}
