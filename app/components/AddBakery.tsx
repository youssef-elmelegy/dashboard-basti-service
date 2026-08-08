import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRegionStore } from "@/stores/regionStore";
import {
  BAKERY_GALLERY_MAX_IMAGES,
  BAKERY_NOTES_MAX_LENGTH,
  type BakeryType,
} from "@/lib/services/bakery.service";
import { bakeryTypeLabel } from "@/lib/bakeryTypes";
import { useBakeryMedia } from "@/lib/useBakeryMedia";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { SingleImageUploader } from "@/components/SingleImageUploader";

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Bakery name must be at least 2 characters!" })
    .max(255, { message: "Bakery name must not exceed 255 characters!" }),
  locationDescription: z
    .string()
    .min(5, { message: "Location description must be at least 5 characters!" })
    .max(500, {
      message: "Location description must not exceed 500 characters!",
    }),
  regionId: z
    .string()
    .uuid({ message: "Please select a valid region!" })
    .min(1, { message: "Region is required!" }),
  capacity: z
    .number({ message: "Capacity must be a number!" })
    .min(1, { message: "Capacity must be at least 1!" })
    .max(10000, { message: "Capacity must not exceed 10000!" }),
  bakeryTypes: z
    .array(z.enum(["small_cakes", "big_cakes", "others"]))
    .min(1, { message: "Select at least one bakery type!" }),
  // Optional: an empty textarea submits "" and is normalised away on submit.
  notes: z
    .string()
    .max(BAKERY_NOTES_MAX_LENGTH, {
      message: `Notes must not exceed ${BAKERY_NOTES_MAX_LENGTH} characters!`,
    })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

/** What the parent receives — form fields plus the resolved image URLs. */
export interface AddBakeryValues extends FormValues {
  logoUrl?: string;
  galleryImages?: string[];
}

interface AddBakeryProps {
  onSubmit: (data: AddBakeryValues) => void | Promise<void>;
}

export function AddBakery({ onSubmit }: AddBakeryProps) {
  const { t } = useTranslation();
  const regions = useRegionStore((state) => state.regions);

  const getBakeryTypeLabel = (type: BakeryType): string =>
    bakeryTypeLabel(type, t);

  const media = useBakeryMedia();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      locationDescription: "",
      regionId: "",
      capacity: undefined,
      bakeryTypes: [],
      notes: "",
    },
  });

  const selectedTypes = form.watch("bakeryTypes");

  const handleTypeToggle = (type: BakeryType) => {
    const current = form.getValues("bakeryTypes");
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    form.setValue("bakeryTypes", updated, { shouldValidate: true });
  };

  // Awaited so react-hook-form keeps `isSubmitting` true for the whole request,
  // which is what disables the submit button against double-clicks.
  const handleSubmit = async (values: FormValues) => {
    try {
      // Images are uploaded first so the create request carries stored URLs; a
      // failed upload aborts before the bakery is created rather than leaving
      // one saved without its images.
      const { logoUrl, galleryImages } = await media.resolveMedia();

      await onSubmit({
        ...values,
        // Trim so a textarea holding only whitespace is treated as unset.
        notes: values.notes?.trim() ? values.notes.trim() : undefined,
        logoUrl,
        galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
      });
      // Only clear the form once the bakery is actually created — on failure
      // the user keeps what they typed and can retry.
      form.reset();
      media.setLogo(undefined);
      media.setGallery([]);
    } catch {
      // The parent logs and surfaces the error; swallowing it here just keeps
      // react-hook-form from treating the rejection as unhandled.
    }
  };

  return (
    <SheetContent className="overflow-y-auto py-6">
      <SheetHeader>
        <SheetTitle className="mb-4">
          {t("bakeriesManagement.addBakery")}
        </SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bakeriesManagement.bakeryName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("bakeriesManagement.enterBakeryName")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("bakeriesManagement.locationDescription")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "bakeriesManagement.enterLocationDescription",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bakeriesManagement.region")}</FormLabel>
                    {regions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("bakeriesManagement.noRegionsAvailable")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {regions.map((region) => (
                          <button
                            key={region.id}
                            type="button"
                            onClick={() => {
                              field.onChange(region.id);
                            }}
                            className={cn(
                              "px-3 py-1 rounded-full text-sm border transition-colors",
                              field.value === region.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted",
                            )}
                          >
                            {region.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bakeriesManagement.capacity")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter capacity (orders per day)"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bakeryTypes"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("bakeriesManagement.bakeryTypes")}</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {(
                        Object.keys({
                          small_cakes: true,
                          big_cakes: true,
                          others: true,
                        }) as BakeryType[]
                      ).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleTypeToggle(value)}
                          className={cn(
                            "px-3 py-1 rounded-full text-sm border transition-colors",
                            selectedTypes.includes(value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          {getBakeryTypeLabel(value)}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("bakeriesManagement.notes", {
                        defaultValue: "Notes (optional)",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        maxLength={BAKERY_NOTES_MAX_LENGTH}
                        placeholder={t("bakeriesManagement.enterNotes", {
                          defaultValue:
                            "Internal notes about this bakery, visible to management only",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SingleImageUploader
                label={t("bakeriesManagement.logo", {
                  defaultValue: "Logo (optional)",
                })}
                imageUrl={media.logo}
                onImageChange={media.setLogo}
                isLoading={media.isUploading}
              />

              <MultiImageUploader
                label={t("bakeriesManagement.gallery", {
                  defaultValue: "Photo gallery (optional)",
                })}
                description={t("bakeriesManagement.galleryDescription", {
                  count: BAKERY_GALLERY_MAX_IMAGES,
                  defaultValue: `Up to ${BAKERY_GALLERY_MAX_IMAGES} photos of the bakery`,
                })}
                images={media.gallery}
                onImagesChange={media.setGallery}
                maxImages={BAKERY_GALLERY_MAX_IMAGES}
                required={false}
              />

              {media.uploadError && (
                <p className="text-sm text-destructive">{media.uploadError}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  form.formState.isSubmitting ||
                  media.isUploading ||
                  !form.formState.isValid
                }
              >
                {(form.formState.isSubmitting || media.isUploading) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t("bakeriesManagement.addBakery")}
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
}
