import { z } from "zod";

export const chefFormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Chef name must be at least 2 characters!" })
      .max(50, { message: "Chef name must not exceed 50 characters!" }),
    bakery: z.string().min(1, { message: "Please select a bakery!" }),
    image: z.string().min(1, { message: "Please upload an image!" }),
  })
  .superRefine((data, ctx) => {
    // Additional validation: check if name contains only valid characters
    if (!/^[a-zA-Z\s'-]+$/.test(data.name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message:
          "Chef name can only contain letters, spaces, hyphens, and apostrophes!",
      });
    }
  });
