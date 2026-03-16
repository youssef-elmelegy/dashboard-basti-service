import { z } from "zod";

export const createFlavorSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  flavorUrl: z.string().url("Must be a valid URL"),
});

export const updateFlavorSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255)
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000)
    .optional(),
  flavorUrl: z.string().url("Must be a valid URL").optional(),
});

export type CreateFlavorFormValues = z.infer<typeof createFlavorSchema>;
export type UpdateFlavorFormValues = z.infer<typeof updateFlavorSchema>;

export const shapeVariantImageSchema = z.object({
  shapeId: z.string().uuid("Must be a valid UUID"),
  slicedViewUrl: z.string().url("Must be a valid URL"),
  frontViewUrl: z.string().url("Must be a valid URL"),
  topViewUrl: z.string().url("Must be a valid URL"),
});

export const createFlavorWithVariantImagesSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  flavorUrl: z.string().url("Must be a valid URL"),
  variantImages: z
    .array(shapeVariantImageSchema)
    .min(1, "At least one shape variant is required"),
});

export type ShapeVariantImageFormValues = z.infer<
  typeof shapeVariantImageSchema
>;
export type CreateFlavorWithVariantImagesFormValues = z.infer<
  typeof createFlavorWithVariantImagesSchema
>;

export const createShapeSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  shapeUrl: z.string().url("Must be a valid URL"),
  size: z.enum(["small", "medium", "large"], {
    message: "Size must be small, medium, or large",
  }),
  capacity: z.number().int().positive("Capacity must be greater than 0"),
});

export const updateShapeSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255)
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000)
    .optional(),
  shapeUrl: z.string().url("Must be a valid URL").optional(),
  size: z
    .enum(["small", "medium", "large"], {
      message: "Size must be small, medium, or large",
    })
    .optional(),
  capacity: z
    .number()
    .int()
    .positive("Capacity must be greater than 0")
    .optional(),
});

export type CreateShapeFormValues = z.infer<typeof createShapeSchema>;
export type UpdateShapeFormValues = z.infer<typeof updateShapeSchema>;

export const createDecorationSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  decorationUrl: z.string().url("Must be a valid URL"),
  tagId: z.string().optional(),
});

export const updateDecorationSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255)
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000)
    .optional(),
  decorationUrl: z.string().url("Must be a valid URL").optional(),
  tagId: z.string().optional(),
});

export type CreateDecorationFormValues = z.infer<typeof createDecorationSchema>;
export type UpdateDecorationFormValues = z.infer<typeof updateDecorationSchema>;

export const decorationVariantImageSchema = z.object({
  shapeId: z.string().uuid("Must be a valid UUID"),
  slicedViewUrl: z.string().url("Must be a valid URL"),
  frontViewUrl: z.string().url("Must be a valid URL"),
  topViewUrl: z.string().url("Must be a valid URL"),
});

export const createDecorationWithVariantImagesSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  decorationUrl: z.string().url("Must be a valid URL"),
  tagId: z.string().optional(),
  variantImages: z
    .array(decorationVariantImageSchema)
    .min(1, "At least one shape variant is required"),
});

export type DecorationVariantImageFormValues = z.infer<
  typeof decorationVariantImageSchema
>;
export type CreateDecorationWithVariantImagesFormValues = z.infer<
  typeof createDecorationWithVariantImagesSchema
>;

export const designedCakeConfigSchema = z.object({
  flavorId: z.string().min(1, "Flavor is required"),
  decorationId: z.string().min(1, "Decoration is required"),
  shapeId: z.string().min(1, "Shape is required"),
  frostColorValue: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
});

export const createPredesignedCakeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  tagId: z.string().optional(),
  configs: z
    .array(designedCakeConfigSchema)
    .min(1, "At least one cake configuration is required"),
});

export const updatePredesignedCakeSchema = z.object({
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
  tagId: z.string().optional(),
  configs: z.array(designedCakeConfigSchema).optional(),
});

export type CreatePredesignedCakeFormValues = z.infer<
  typeof createPredesignedCakeSchema
>;
export type UpdatePredesignedCakeFormValues = z.infer<
  typeof updatePredesignedCakeSchema
>;
