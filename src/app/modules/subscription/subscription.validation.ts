import { z } from "zod";
import { SubscriptionPlan } from "../../../generated/prisma/enums";

const checkoutSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
});

export const SubscriptionValidation = {
  checkoutSchema,
};
