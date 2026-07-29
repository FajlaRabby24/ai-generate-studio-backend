import status from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SubscriptionService } from "./subscription.service";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const { plan } = req.body;
  const userId = req.user.id;

  const result = await SubscriptionService.createCheckoutSession(userId, plan);

  sendResponse(
    res,
    status.OK,
    true,
    "Checkout session created successfully",
    result
  );
});

export const SubscriptionController = {
  createCheckoutSession,
};
