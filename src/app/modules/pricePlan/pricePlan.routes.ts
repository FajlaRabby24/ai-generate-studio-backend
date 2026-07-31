import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { PricePlanController } from "./pricePlan.controller";

const router = Router();

router.post(
  "/",
  checkAuth(UserRole.ADMIN),
  PricePlanController.createPricePlan,
);

router.get("/", PricePlanController.getAllPricePlans);

router.get(
  "/:pricingId",
  checkAuth(UserRole.ADMIN),
  PricePlanController.getPricePlanById,
);

router.patch(
  "/:pricingId",
  checkAuth(UserRole.ADMIN),
  PricePlanController.updatePricePlan,
);

router.delete(
  "/:pricingId",
  checkAuth(UserRole.ADMIN),
  PricePlanController.deletePricePlan,
);

export const PricePlanRoutes = router;
