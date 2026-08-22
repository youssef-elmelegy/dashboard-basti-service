import { z } from "zod";

export const createFlavorSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  flavorUrl: z.string().url("Must be a valid URL"),
});

// Edit enforces the same mandatory fields as create.
export const updateFlavorSchema = createFlavorSchema;

export type CreateFlavorFormValues = z.infer<typeof createFlavorSchema>;
export type UpdateFlavorFormValues = z.infer<typeof updateFlavorSchema>;

// Every view a shape carries must be a real image. A half-filled variant would
// render with a missing view in the customizer, so an incomplete shape is
// rejected rather than saved: fill all three views or remove the shape.
const viewUrl = z.string().url("Must be a valid URL");

export const shapeVariantImageSchema = z.object({
  shapeId: z.string().uuid("Must be a valid UUID"),
  slicedViewUrl: viewUrl,
  frontViewUrl: viewUrl,
  topViewUrl: viewUrl,
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
  minPrepHours: z.number().nonnegative().optional(),
});

// Edit enforces the same mandatory fields as create — minPrepHours stays the
// only genuinely optional field.
export const updateShapeSchema = createShapeSchema;

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
  capacity: z.number().int().positive("Capacity must be greater than 0"),
  minPrepHours: z.number().nonnegative().optional(),
});

// Edit enforces the same mandatory fields as create.
export const updateDecorationSchema = createDecorationSchema;

export type CreateDecorationFormValues = z.infer<typeof createDecorationSchema>;
export type UpdateDecorationFormValues = z.infer<typeof updateDecorationSchema>;

export const decorationVariantImageSchema = z.object({
  shapeId: z.string().uuid("Must be a valid UUID"),
  slicedViewUrl: viewUrl,
  frontViewUrl: viewUrl,
  topViewUrl: viewUrl,
});

export const createDecorationWithVariantImagesSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  decorationUrl: z.string().url("Must be a valid URL"),
  tagId: z.string().optional(),
  capacity: z.number().int().positive("Capacity must be greater than 0"),
  minPrepHours: z.number().nonnegative().optional(),
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

// Edit enforces the same mandatory fields as create — a saved cake must keep at
// least one configuration.
export const updatePredesignedCakeSchema = createPredesignedCakeSchema;

export type CreatePredesignedCakeFormValues = z.infer<
  typeof createPredesignedCakeSchema
>;
export type UpdatePredesignedCakeFormValues = z.infer<
  typeof updatePredesignedCakeSchema
>;
