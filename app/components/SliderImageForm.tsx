import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useRegionStore } from "@/stores/regionStore";
import { convertToWebP } from "@/lib/image-utils";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { SliderImage } from "@/lib/services/slider-image.service";
import type { Tag } from "@/lib/services/tags.service";

const sliderImageSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  imageUrl: z.string().url("Invalid image URL"),
  tagId: z.string().optional(),
});

type SliderImageFormValues = z.infer<typeof sliderImageSchema>;

interface SliderImageFormProps {
  image?: SliderImage;
  isLoading?: boolean;
  tags?: Tag[];
  usedTagIds?: string[];
  onSubmit: (data: SliderImageFormValues) => Promise<void> | void;
}

export function SliderImageForm({
  image,
  isLoading = false,
  tags = [],
  usedTagIds = [],
  onSubmit,
}: SliderImageFormProps) {
  const { t } = useTranslation();
  const isEditMode = !!image;
  const uploadRegionImage = useRegionStore((state) => state.uploadRegionImage);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(
    image?.imageUrl || "",
  );

  // Find tag with matching displayOrder when in edit mode
  const matchingTag = image
    ? tags.find((tag) => tag.displayOrder === image.displayOrder)
    : undefined;

  const form = useForm<SliderImageFormValues>({
    resolver: zodResolver(sliderImageSchema),
    defaultValues: {
      title: image?.title || "",
      imageUrl: image?.imageUrl || "",
      tagId: matchingTag?.id,
    },
  });

  const handleImagesChange = async (images: string[]) => {
    if (images.length === 0) {
      setUploadedImageUrl("");
      form.setValue("imageUrl", "", { shouldValidate: true });
      return;
    }

    const imageToUpload = images[0];

    if (
      imageToUpload.startsWith("http://") ||
      imageToUpload.startsWith("https://")
    ) {
      setUploadedImageUrl(imageToUpload);
      form.setValue("imageUrl", imageToUpload, { shouldValidate: true });
      return;
    }

    try {
      setUploadingImage(true);

      // Convert to WebP and compress before uploading
      const webpBlob = await convertToWebP(imageToUpload);
      const file = new File([webpBlob], "slider-image.webp", {
        type: "image/webp",
      });

      const result = await uploadRegionImage(file);
      setUploadedImageUrl(result.secure_url);
      form.setValue("imageUrl", result.secure_url, { shouldValidate: true });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (data: SliderImageFormValues) => {
    const finalData = {
      ...data,
      imageUrl: uploadedImageUrl || data.imageUrl,
    };
    await onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 mt-6 px-6"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sliderImages.sliderTitle")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("sliderImages.sliderTitlePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("sliderImages.sliderTitleDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={() => (
            <MultiImageUploader
              images={uploadedImageUrl ? [uploadedImageUrl] : []}
              onImagesChange={handleImagesChange}
              label={t("sliderImages.sliderImage")}
              maxImages={1}
            />
          )}
        />

        <FormField
          control={form.control}
          name="tagId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sliderImages.selectTag")}</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("sliderImages.selectTagPlaceholder")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem
                      key={tag.id}
                      value={tag.id}
                      disabled={
                        usedTagIds.includes(tag.id) && tag.id !== field.value
                      }
                    >
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {t("sliderImages.selectTagDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || uploadingImage}
          className="w-full"
        >
          {uploadingImage || isLoading
            ? t("sliderImages.uploadingImage")
            : isEditMode
              ? t("common.update")
              : t("common.add")}
        </Button>
      </form>
    </Form>
  );
}
