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
  numFrames: z.string().optional(),
  frameRate: z.string().optional(),
  type: z.nativeEnum(GenerationType, {
    error: "Invalid generation type",
  }),
});

export const ImageToVideoValidation = {
  generateVideoSchema,
};
// https://9cd5v0zv-5000.asse.devtunnels.ms/