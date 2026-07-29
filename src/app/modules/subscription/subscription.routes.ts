import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionValidation } from "./subscription.validation";

const router = Router();

router.post(
  "/create-checkout-session",
  checkAuth(),
  validateRequest(SubscriptionValidation.checkoutSchema),
  SubscriptionController.createCheckoutSession
);

export const SubscriptionRoutes = router;
