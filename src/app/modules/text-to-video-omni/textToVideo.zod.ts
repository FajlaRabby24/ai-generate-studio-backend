import { z } from "zod";
import { GenerationType } from "../../../generated/prisma/enums";

const generateTextToVideoSchema = z.object({
  prompt: z.string({
    error: "Prompt is required",
  }),
  ratio: z.enum(["9:16", "16:9"], {
    error: "Aspect ratio must be '9:16' or '16:9'",
  }),
  type: z.nativeEnum(GenerationType, {
    error: "Invalid generation type",
  }),
});

export const TextToVideoOmniValidation = {
  generateTextToVideoSchema,
};
