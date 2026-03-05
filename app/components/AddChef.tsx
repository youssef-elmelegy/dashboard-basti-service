import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useChefStore } from "@/stores/chefStore";
import { cn } from "@/lib/utils";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Chef name must be at least 2 characters!" })
    .max(255, { message: "Chef name must not exceed 255 characters!" }),
  specialization: z
    .string()
    .min(2, { message: "Specialization must be at least 2 characters!" })
    .max(255, { message: "Specialization must not exceed 255 characters!" }),
  bio: z
    .string()
    .min(10, { message: "Bio must be at least 10 characters!" })
    .max(1000, { message: "Bio must not exceed 1000 characters!" })
    .optional()
    .nullable(),
  images: z.array(z.string()).max(1, { message: "Upload only one image" }),
  bakeryId: z
    .string()
    .min(1, { message: "Bakery is required!" })
    .refine((id) => UUID_REGEX.test(id), {
      message: "Invalid bakery ID format",
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddChefProps {
  onSubmit: (data: {
    name: string;
    specialization: string;
    bio?: string;
    image?: string;
    bakeryId: string;
  }) => void;
}

const AddChef = ({ onSubmit }: AddChefProps) => {
  const { t } = useTranslation();
  const bakeries = useBakeryStore((state) => state.bakeries);
  const { uploadChefImage } = useChefStore();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      specialization: "",
      bio: "",
      images: [],
      bakeryId: "",
    },
  });

  const selectedBakeryId = form.watch("bakeryId");

  const handleBakerySelect = (bakeryId: string) => {
    form.setValue("bakeryId", bakeryId, { shouldValidate: true });
  };

  const handleSubmit = (data: FormValues) => {
    console.log("Form submission:", data);
    console.log("BakeryId value:", data.bakeryId);
    console.log("Images array:", data.images);

    // Use the uploaded image URL from Cloudinary
    const cleanData: {
      name: string;
      specialization: string;
      bio?: string;
      image?: string;
      bakeryId: string;
    } = {
      name: data.name,
      specialization: data.specialization,
      bio: data.bio || undefined,
      image: uploadedImageUrl || undefined,
      bakeryId: data.bakeryId,
    };
    console.log("Clean data to submit:", cleanData);
    onSubmit(cleanData);
    form.reset();
    setUploadedImageUrl(null);
  };

  const handleImagesChange = async (images: string[]) => {
    console.log("handleImagesChange called with images:", images);
    form.setValue("images", images, { shouldValidate: true });

    // If image was removed
    if (images.length === 0) {
      setUploadedImageUrl(null);
      return;
    }

    // If image is base64 or data URL, upload it to Cloudinary
    const imageUrl = images[0];
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
      try {
        setUploadingImage(true);
        console.log("Uploading image to Cloudinary...");
        console.log("Image data URL length:", imageUrl.length);

        // Convert data URL to File
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        console.log("Blob created - size:", blob.size, "type:", blob.type);

        const file = new File([blob], "chef-image.jpg", { type: "image/jpeg" });
        console.log(
          "File object created - size:",
          file.size,
          "type:",
          file.type,
          "name:",
          file.name,
        );

        // Upload to Cloudinary using store
        console.log("Calling uploadChefImage with file:", file);
        const result = await uploadChefImage(file);
        console.log("Upload result:", result);

        setUploadedImageUrl(result.secure_url);
        console.log("Image uploaded successfully:", result.secure_url);
      } catch (error) {
        console.error("Error uploading image:", error);
        // Keep the form state but show error
      } finally {
        setUploadingImage(false);
      }
    } else {
      // Already a URL from Cloudinary
      setUploadedImageUrl(imageUrl);
    }
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Chef</SheetTitle>
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
                    <FormLabel>Chef Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter chef name" {...field} />
                    </FormControl>
                    <FormDescription>The chef's full name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Pastry Chef, Head Chef"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Chef's area of expertise.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Enter chef biography (10-1000 characters)"
                        rows={4}
                        {...field}
                        value={field.value ?? ""}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormDescription>
                      Chef's biography or experience.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <MultiImageUploader
                    images={field.value}
                    onImagesChange={handleImagesChange}
                    label={t("products.images")}
                    maxImages={1}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="bakeryId"
                render={() => (
                  <FormItem>
                    <FormLabel>Bakery</FormLabel>
                    {bakeries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No bakeries available. Create bakeries first.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {bakeries.map((bakery) => (
                          <button
                            key={bakery.id}
                            type="button"
                            onClick={() => handleBakerySelect(bakery.id)}
                            className={cn(
                              "px-3 py-1 rounded-full text-sm border transition-colors",
                              selectedBakeryId === bakery.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted",
                            )}
                          >
                            {bakery.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={bakeries.length === 0 || uploadingImage}
              >
                {uploadingImage ? "Uploading image..." : "Add Chef"}
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default AddChef;
