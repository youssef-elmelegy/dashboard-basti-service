import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useFeaturedCakeStore } from "@/stores/featuredCakeStore";
import { convertToWebP } from "@/lib/image-utils";
import { useTagsStore } from "@/stores/tagsStore";
import { useState, useEffect } from "react";
import {
  addFeaturedCakeSchema,
  type AddFeaturedCakeFormValues,
} from "@/schemas/featured-cake.schema";
import { X, Plus } from "lucide-react";

interface TagSelectFieldProps {
  value: string;
  onChange: (value: string) => void;
}

function TagSelectField({ value, onChange }: TagSelectFieldProps) {
  const tags = useTagsStore((state) => state.tags);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a tag" />
      </SelectTrigger>
      <SelectContent>
        {tags
          .filter(
            (tag) =>
              Array.isArray(tag.types) &&
              tag.types.includes("predesigned-cakes"),
          )
          .map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

interface AddFeaturedCakeFormProps {
  onSubmit: (values: AddFeaturedCakeFormValues) => void;
  isLoading?: boolean;
}

export function AddFeaturedCakeForm({
  onSubmit,
  isLoading = false,
}: AddFeaturedCakeFormProps) {
  const { t } = useTranslation();
  const uploadFeaturedCakeImage = useFeaturedCakeStore(
    (state) => state.uploadFeaturedCakeImage,
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const tags = useTagsStore((state) => state.tags);
  const fetchTags = useTagsStore((state) => state.fetchTags);

  // Fetch tags on component mount
  useEffect(() => {
    if (tags.length === 0) {
      fetchTags();
    }
  }, []);

  const form = useForm<AddFeaturedCakeFormValues>({
    resolver: zodResolver(addFeaturedCakeSchema),
    defaultValues: {
      name: "",
      description: "",
      images: [],
      capacity: 0,
      flavorList: [],
      pipingPaletteList: [],
      tagId: "",
      isActive: true,
    },
  });

  const {
    fields: flavorFields,
    append: appendFlavor,
    remove: removeFlavor,
  } = useFieldArray({
    control: form.control,
    name: "flavorList" as never,
    keyName: "key",
  });

  const {
    fields: paletteFields,
    append: appendPalette,
    remove: removePalette,
  } = useFieldArray({
    control: form.control,
    name: "pipingPaletteList" as never,
    keyName: "key",
  });

  const handleImagesChange = async (images: string[]) => {
    console.log("handleImagesChange called with images:", images);
    form.setValue("images", images, { shouldValidate: true });

    // If images were removed
    if (images.length === 0) {
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

        for (const imageData of urlsToUpload) {
          const webpBlob = await convertToWebP(imageData);
          const file = new File([webpBlob], "featured-cake.webp", {
            type: "image/webp",
          });
          const uploadResult = await uploadFeaturedCakeImage(file);
          if (uploadResult.url) {
            uploadedUrls.push(uploadResult.url);
          }
        }

        const finalUrls = [...alreadyUploadedUrls, ...uploadedUrls];
        form.setValue("images", finalUrls, { shouldValidate: true });
      } catch (error) {
        console.error("Error uploading images:", error);
        form.setError("images", {
          message: "Failed to upload images",
        });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleFormSubmit = form.handleSubmit((data) => {
    console.log("Form data:", data);
    onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6 mt-6 px-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {t("featuredCakes.basicInfo")}
          </h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.name")}</FormLabel>
                <Input placeholder="Enter cake name" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.description")}</FormLabel>
                <Input placeholder="Enter cake description" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.capacity")}</FormLabel>
                <Input
                  type="number"
                  placeholder="Enter capacity"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Images */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("common.images")}</h3>
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.uploadImages")}</FormLabel>
                <MultiImageUploader
                  images={field.value}
                  onImagesChange={handleImagesChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Flavors */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("common.flavors")}</h3>
          <div className="space-y-3">
            {flavorFields.map((field, index) => (
              <div key={field.key} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`flavorList.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Input placeholder={`Flavor ${index + 1}`} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFlavor(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendFlavor("")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("featuredCakes.addFlavor")}
          </Button>
          <FormMessage>{form.formState.errors.flavorList?.message}</FormMessage>
        </div>

        <Separator />

        {/* Piping Palettes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {t("common.pipingPalettes")}
          </h3>
          <div className="space-y-3">
            {paletteFields.map((field, index) => (
              <div key={field.key} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`pipingPaletteList.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Input
                        placeholder={`Piping Palette ${index + 1}`}
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePalette(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendPalette("")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("featuredCakes.addPalette")}
          </Button>
          <FormMessage>
            {form.formState.errors.pipingPaletteList?.message}
          </FormMessage>
        </div>

        <Separator />

        {/* Tag */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("common.tag")}</h3>
          <FormField
            control={form.control}
            name="tagId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.selectTag")}</FormLabel>
                <TagSelectField value={field.value} onChange={field.onChange} />
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
            <FormItem className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="rounded"
              />
              <FormLabel className="mb-0">{t("common.active")}</FormLabel>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || uploadingImage}
          className="w-full"
        >
          {isLoading ? t("common.loading") : t("featuredCakes.createCake")}
        </Button>
      </form>
    </Form>
  );
}
