import { z } from "zod";
import { GenerationType } from "../../../generated/prisma/enums";

const generateTextToImageSchema = z.object({
  prompt: z
    .string({
      error: "Prompt is required and must be a string",
    })
    .min(1, "Prompt cannot be empty"),
  type: z.nativeEnum(GenerationType, {
    error: "Invalid generation type",
  }),
});

export const TextToImageValidation = {
  generateTextToImageSchema,
};
