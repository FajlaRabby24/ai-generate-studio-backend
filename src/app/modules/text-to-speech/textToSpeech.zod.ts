import { z } from "zod";
import { GenerationType } from "../../../generated/prisma/enums";

const generateTextToSpeechSchema = z.object({
  prompt: z.string({
    error: "Prompt is required",
  }),
  voice: z.enum(
    [
      "Zephyr",
      "Puck",
      "Charon",
      "Kore",
      "Fenrir",
      "Leda",
      "Orus",
      "Aoede",
      "Callirrhoe",
      "Autonoe",
      "Enceladus",
      "Iapetus",
      "Umbriel",
      "Algieba",
      "Despina",
      "Erinome",
      "Algenib",
      "Rasalgethi",
      "Laomedeia",
      "Achernar",
      "Alnilam",
      "Schedar",
      "Gacrux",
      "Pulcherrima",
      "Achird",
      "Zubenelgenubi",
      "Vindemiatrix",
      "Sadachbia",
      "Sadaltager",
      "Sulafat",
    ] as const,
    {
      message: "Invalid Voice Option",
    },
  ),
  type: z.nativeEnum(GenerationType, {
    error: "Invalid generation type",
  }),
});

const testTextToSpeechSchema = z.object({
  prompt: z.string({
    error: "Prompt is required",
  }),
  voiceId: z.string({
    error: "Voice option is required",
  }),
  type: z.nativeEnum(GenerationType, {
    message: "Invalid generation type",
  }),
});

export const getVoicesSchema = z.object({
  lang: z.string({
    error: "Language is required",
  }),
  gender: z.string({
    error: "Gender is required",
  }),
});

export const TextToSpeechValidation = {
  generateTextToSpeechSchema,
  getVoicesSchema,
  testTextToSpeechSchema,
};
