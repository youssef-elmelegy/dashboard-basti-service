import { z } from "zod";

export const addReadyCakeSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  image: z.string().min(1, "Please upload an image"),
  basePrice: z
    .number()
    .min(1, "Price must be at least $1")
    .max(10000, "Price must be less than $10000"),
  capacity: z
    .number()
    .min(1, "Capacity must be at least 1")
    .max(1000, "Capacity must be less than 1000"),
  tags: z.array(z.string()).min(1, "Select at least one tag"),
  flavors: z
    .array(z.string().min(1, "Flavor name required"))
    .min(1, "Add at least one flavor"),
  sizes: z
    .array(
      z.object({
        name: z.string().min(1, "Size name required"),
        price: z.number().min(1, "Price must be at least $1"),
      })
    )
    .min(1, "Add at least one size"),
  isActive: z.boolean(),
});

export type AddReadyCakeFormValues = z.infer<typeof addReadyCakeSchema>;
