import { z } from "zod";
import { VoiceOptions } from "../../constant/constant";

const generateTextToSpeechSchema = z.object({
  body: z.object({
    prompt: z.string({
      error: "Prompt is required",
    }),
    voice: z.nativeEnum(VoiceOptions, {
      message: "Invalid Voice Option",
    }),
  }),
});

export const TextToSpeechValidation = {
  generateTextToSpeechSchema,
};
