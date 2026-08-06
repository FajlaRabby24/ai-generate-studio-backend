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
  isGenerateResume: z.preprocess((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
  }, z.boolean().optional()),
});

const generatePdfValidationSchema = z.object({
  name: z.string({
    error: "Name is required and must be a string",
  }),
  analyzerId: z.string({
    error: "analyzerId is required and must be a string",
  }),
  editedResumeJson: z.any(),
});

export const ResumeAnalyzerValidation = {
  analyzeValidationSchema,
  generatePdfValidationSchema,
};
