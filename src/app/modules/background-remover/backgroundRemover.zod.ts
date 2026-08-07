import z from "zod";
import { GenerationType } from "../../../generated/prisma/enums";

const backgroundRemover = z.object({
  type: z.nativeEnum(GenerationType, {
    error: "Invalid generation type",
  }),
});

export const BackgroundRemoverValidation = {
  backgroundRemover,
};
