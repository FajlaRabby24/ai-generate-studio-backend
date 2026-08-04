import { z } from "zod";
import { GenerationType } from "../../../generated/prisma/enums";
import { AspectRatio } from "../../constant/constant";

const generateVideoSchema = z.object({
  prompt: z
    .string({
      error: "Prompt is required and must be a string",
    })
    .min(1, "Prompt cannot be empty"),
  aspectRatio: z.enum(AspectRatio, {
    error: "Invalid aspect ratio",
  }),
  numFrames: z.number().optional(),
  frameRate: z.number().optional(),
  type: z.nativeEnum(GenerationType, {
    error: "Invalid generation type",
  }),
});

export const TextToVideoValidation = {
  generateVideoSchema,
};
