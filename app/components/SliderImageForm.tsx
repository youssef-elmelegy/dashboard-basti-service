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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useCakeStore } from "@/stores/imageStore";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { SliderImage } from "@/lib/services/slider-image.service";

const sliderImageSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  imageUrl: z.string().url("Invalid image URL"),
});

type SliderImageFormValues = z.infer<typeof sliderImageSchema>;

interface SliderImageFormProps {
  image?: SliderImage;
  isLoading?: boolean;
  onSubmit: (data: SliderImageFormValues) => Promise<void> | void;
}

export function SliderImageForm({
  image,
  isLoading = false,
  onSubmit,
}: SliderImageFormProps) {
  const { t } = useTranslation();
  const isEditMode = !!image;
  const uploadCakeImage = useCakeStore((state) => state.uploadCakeImage);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(
    image?.imageUrl || "",
  );

  const form = useForm<SliderImageFormValues>({
    resolver: zodResolver(sliderImageSchema),
    defaultValues: image || {
      title: "",
      imageUrl: "",
    },
  });

  const handleImagesChange = async (images: string[]) => {
    if (images.length === 0) {
      setUploadedImageUrl("");
      form.setValue("imageUrl", "", { shouldValidate: true });
      return;
    }

    const imageToUpload = images[0];

    // Check if it's already a URL (not a data URL)
    if (
      !imageToUpload.startsWith("data:") &&
      !imageToUpload.startsWith("blob:")
    ) {
      setUploadedImageUrl(imageToUpload);
      form.setValue("imageUrl", imageToUpload, { shouldValidate: true });
      return;
    }

    try {
      setUploadingImage(true);
      const response = await fetch(imageToUpload);
      const blob = await response.blob();
      const file = new File([blob], "slider-image.jpg", { type: "image/jpeg" });

      const result = await uploadCakeImage(file);
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
        className="space-y-4 p-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.title")}</FormLabel>
              <FormControl>
                <Input placeholder="Enter slider title" {...field} />
              </FormControl>
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
              label={t("common.image")}
              maxImages={1}
            />
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || uploadingImage}
          className="w-full"
        >
          {uploadingImage || isLoading
            ? "..."
            : isEditMode
              ? t("common.update")
              : t("common.add")}
        </Button>
      </form>
    </Form>
  );
}
