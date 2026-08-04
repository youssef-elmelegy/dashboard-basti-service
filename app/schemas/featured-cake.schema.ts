import { z } from "zod";

export const addFeaturedCakeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  flavorList: z
    .array(z.string().min(1))
    .min(1, "At least one flavor is required"),
  pipingPaletteList: z
    .array(z.string().min(1))
    .min(1, "At least one piping palette is required"),
  tagId: z.string().uuid("Valid tag ID is required"),
  isActive: z.boolean(),
});

export type AddFeaturedCakeFormValues = z.infer<typeof addFeaturedCakeSchema>;

// Edit requires the same mandatory fields as create — an existing cake must not
// be saved into a state (no flavors, no images, no tag) that create would reject.
export const editFeaturedCakeSchema = addFeaturedCakeSchema.extend({
  id: z.string().uuid(),
});

export type EditFeaturedCakeFormValues = z.infer<typeof editFeaturedCakeSchema>;
