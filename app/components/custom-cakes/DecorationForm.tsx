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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useTagsStore } from "@/stores/tagsStore";
import { TagSelectField } from "@/components/TagSelectField";
import { uploadImage } from "@/lib/api/cake.api";
import { UPLOAD_FOLDERS } from "@/lib/upload-folders";
import { convertToWebP } from "@/lib/image-utils";
import type {
  CreateDecorationFormValues,
  UpdateDecorationFormValues,
  CreateDecorationWithVariantImagesFormValues,
} from "@/schemas/custom-cakes.schema";
import {
  createDecorationSchema,
  updateDecorationSchema,
  createDecorationWithVariantImagesSchema,
} from "@/schemas/custom-cakes.schema";
import type { Decoration } from "@/lib/services/decoration.service";
import { decorationApi } from "@/lib/services/decoration.service";
import { DecorationVariantImagesInput } from "./DecorationVariantImagesInput";

interface DecorationVariantImageData {
  shapeId: string;
  slicedViewUrl: string;
  frontViewUrl: string;
  topViewUrl: string;
}

interface DecorationFormProps {
  decoration?: Decoration;
  isLoading?: boolean;
  onSubmit: (
    data:
      | CreateDecorationFormValues
      | UpdateDecorationFormValues
      | CreateDecorationWithVariantImagesFormValues,
  ) => Promise<void> | void;
  withVariantImages?: boolean;
}

export function DecorationForm({
  decoration,
  isLoading = false,
  onSubmit,
  withVariantImages = false,
}: DecorationFormProps) {
  const { t } = useTranslation();
  const isEditMode = !!decoration;
  // Main decoration images upload to basti/decorations.
  const tags = useTagsStore((state) => state.tags);
  const fetchTags = useTagsStore((state) => state.fetchTags);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(
    decoration?.decorationUrl || "",
  );
  const [variantImages, setVariantImages] = useState<
    DecorationVariantImageData[]
  >([]);

  // Fetch existing variant images when editing
  useEffect(() => {
    if (decoration?.id) {
      decorationApi
        .getVariantImages(decoration.id)
        .then((res) => {
          if (res.success && res.data) {
            const loaded: DecorationVariantImageData[] = res.data.map((v) => ({
              shapeId: v.shapeId,
              slicedViewUrl: v.slicedViewUrl,
              frontViewUrl: v.frontViewUrl,
              topViewUrl: v.topViewUrl,
            }));
            setVariantImages(loaded);
            if (withVariantImages) {
              // Must validate: submit button is gated on formState.isValid.
              form.setValue("variantImages", loaded, { shouldValidate: true });
            }
          }
        })
        .catch(() => {
          // silently ignore — form is still usable without pre-loaded images
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoration?.id]);

  useEffect(() => {
    if (!tags || tags.length === 0) {
      fetchTags();
    }
  }, [tags, fetchTags]);

  const schema = withVariantImages
    ? createDecorationWithVariantImagesSchema
    : isEditMode
      ? updateDecorationSchema
      : createDecorationSchema;

  const form = useForm<
    | CreateDecorationFormValues
    | UpdateDecorationFormValues
    | CreateDecorationWithVariantImagesFormValues
  >({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: withVariantImages
      ? {
          title: decoration?.title || "",
          description: decoration?.description || "",
          decorationUrl: decoration?.decorationUrl || "",
          // Must mirror the record in edit mode — hardcoding undefined here
          // dropped the existing tag, so the picker opened on the placeholder
          // and a save silently cleared it.
          tagId: decoration?.tagId,
          capacity: decoration?.capacity || 0,
          minPrepHours: decoration?.minPrepHours,
          variantImages: [],
        }
      : decoration || {
          title: "",
          description: "",
          decorationUrl: "",
          tagId: undefined,
          capacity: 0,
          minPrepHours: undefined,
        },
  });

  const handleVariantImagesChange = (images: DecorationVariantImageData[]) => {
    setVariantImages(images);
    if (withVariantImages) {
      form.setValue("variantImages", images, { shouldValidate: true });
    }
  };

  const handleImagesChange = async (images: string[]) => {
    if (images.length === 0) {
      setUploadedImageUrl("");
      form.setValue("decorationUrl", "", { shouldValidate: true });
      return;
    }

    const imageToUpload = images[0];

    if (
      imageToUpload.startsWith("http://") ||
      imageToUpload.startsWith("https://")
    ) {
      setUploadedImageUrl(imageToUpload);
      form.setValue("decorationUrl", imageToUpload, { shouldValidate: true });
      return;
    }

    try {
      setUploadingImage(true);
      const webpBlob = await convertToWebP(imageToUpload);
      const file = new File([webpBlob], "decoration-image.webp", {
        type: "image/webp",
      });

      const response = await uploadImage(file, UPLOAD_FOLDERS.decorations);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Image upload failed");
      }
      setUploadedImageUrl(response.data.secure_url);
      form.setValue("decorationUrl", response.data.secure_url, {
        shouldValidate: true,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (
    data:
      | CreateDecorationFormValues
      | UpdateDecorationFormValues
      | CreateDecorationWithVariantImagesFormValues,
  ) => {
    if (withVariantImages) {
      const variantData = data as CreateDecorationWithVariantImagesFormValues;
      const filteredVariants = variantImages.filter(
        // Only fully-filled shapes are sent: a variant missing a view would
        // show a broken image in the customizer.
        (v) => v.slicedViewUrl && v.frontViewUrl && v.topViewUrl,
      );

      const finalData: CreateDecorationWithVariantImagesFormValues = {
        title: variantData.title,
        description: variantData.description,
        decorationUrl: uploadedImageUrl || variantData.decorationUrl,
        tagId: variantData.tagId,
        capacity: variantData.capacity,
        minPrepHours: variantData.minPrepHours,
        variantImages: filteredVariants,
      };

      await onSubmit(finalData);
    } else {
      const finalData = {
        ...data,
        decorationUrl: uploadedImageUrl || data.decorationUrl,
      };
      await onSubmit(finalData);
    }
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
              <FormLabel>{t("customCakes.decorationTitle")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("customCakes.enterDecorationTitle")}
                  {...field}
                />
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
              <FormLabel>{t("customCakes.decorationDescription")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("customCakes.enterDecorationDescription")}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="decorationUrl"
          render={() => (
            <MultiImageUploader
              images={uploadedImageUrl ? [uploadedImageUrl] : []}
              onImagesChange={handleImagesChange}
              label={t("common.image")}
              maxImages={1}
            />
          )}
        />

        <FormField
          control={form.control}
          name="tagId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customCakes.tag")}</FormLabel>
              <FormControl>
                <TagSelectField
                  value={field.value}
                  onChange={field.onChange}
                  tagType="decorations"
                  tagMissing={
                    decoration?.tagMissing && field.value === decoration?.tagId
                  }
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
              <FormLabel>{t("customCakes.capacity")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder={t("customCakes.enterCapacity")}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minPrepHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customCakes.minPrepHours")}</FormLabel>
              <Select
                value={
                  field.value !== undefined && field.value !== null
                    ? field.value.toString()
                    : ""
                }
                onValueChange={(value) =>
                  field.onChange(value !== "" ? parseFloat(value) : undefined)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("customCakes.enterMinPrepHours")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">0 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {withVariantImages && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">
              {t("customCakes.shapeVariants")}
            </h3>
            <DecorationVariantImagesInput
              variantImages={variantImages}
              onVariantImagesChange={handleVariantImagesChange}
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || uploadingImage || !form.formState.isValid}
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
