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

export const editFeaturedCakeSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255)
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000)
    .optional(),
  images: z.array(z.string().url()).optional(),
  capacity: z.number().min(1, "Capacity must be at least 1").optional(),
  flavorList: z
    .array(z.string().min(1))
    .min(1, "At least one flavor is required")
    .optional(),
  pipingPaletteList: z
    .array(z.string().min(1))
    .min(1, "At least one piping palette is required")
    .optional(),
  tagId: z.string().uuid("Valid tag ID is required").optional(),
  isActive: z.boolean().optional(),
});

export type EditFeaturedCakeFormValues = z.infer<typeof editFeaturedCakeSchema>;
