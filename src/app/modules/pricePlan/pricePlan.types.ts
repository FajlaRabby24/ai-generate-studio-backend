import type z from "zod";
import type { PricingValidation } from "./pricePlna.validation";

export type ICreatePricePlan = z.infer<
  typeof PricingValidation.createPricingPlanSchema
>;
export type IUpdatePricePlan = z.infer<
  typeof PricingValidation.updatePricingPlanSchema
>;
