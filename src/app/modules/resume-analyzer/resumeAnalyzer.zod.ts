import { z } from "zod";
import { GenerationType } from "../../../generated/prisma/enums";

const analyzeValidationSchema = z.object({
  prompt: z
    .string({
      error: "Prompt must be a string",
    })
    .optional(),
  type: z.nativeEnum(GenerationType, {
    error: "Invalid generation type",
  }),
});

export const ResumeAnalyzerValidation = {
  analyzeValidationSchema,
};
