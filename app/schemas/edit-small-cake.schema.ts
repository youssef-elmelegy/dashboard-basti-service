import { z } from "zod";
import { addSmallCakeSchema } from "./small-cake.schema";

export const editSmallCakeSchema = addSmallCakeSchema.extend({
  id: z.string(),
});

export type EditSmallCakeFormValues = z.infer<typeof editSmallCakeSchema>;
