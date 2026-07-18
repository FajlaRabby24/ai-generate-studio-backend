import { z } from "zod";
import { GenerationType } from "../../../generated/prisma/enums";

const generateVideoSchema = z.object({
  prompt: z
    .string({
      error: "Prompt is required and must be a string",
    })
    .min(1, "Prompt cannot be empty"),
  width: z.number().optional(),
  height: z.number().optional(),
  fps: z.number().optional(),
  duration: z.number().optional(),
  style: z.string().optional(),
  background: z.string().optional(),
  type: z.nativeEnum(GenerationType, {
    error: "Invalid generation type",
  }),
});

export const TextToVideoValidation = {
  generateVideoSchema,
};
