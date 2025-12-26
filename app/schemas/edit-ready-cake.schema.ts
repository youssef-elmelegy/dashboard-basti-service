import { z } from "zod";
import { addReadyCakeSchema } from "./ready-cake.schema";

export const editReadyCakeSchema = addReadyCakeSchema.extend({
  id: z.string(),
});

export type EditReadyCakeFormValues = z.infer<typeof editReadyCakeSchema>;
