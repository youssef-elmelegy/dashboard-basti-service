import { z } from "zod";

export const createSweetSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  images: z.array(z.string()).min(1, "At least one image is required"),
  sizes: z.array(z.string()).min(1, "At least one size is required"),
  tagId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateSweetSchema = createSweetSchema.partial();

export type CreateSweetFormValues = z.infer<typeof createSweetSchema>;
export type UpdateSweetFormValues = z.infer<typeof updateSweetSchema>;
