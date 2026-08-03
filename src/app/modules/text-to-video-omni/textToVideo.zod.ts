import { z } from "zod";

const generateTextToVideoSchema = z.object({
  body: z.object({
    prompt: z.string({
      error: "Prompt is required",
    }),
    ratio: z.enum(["9:16", "16:9"], {
      error: "Aspect ratio must be '9:16' or '16:9'",
    }),
  }),
});

export const TextToVideoOmniValidation = {
  generateTextToVideoSchema,
};
