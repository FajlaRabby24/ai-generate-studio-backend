import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SubscriptionService } from "./subscription.service";

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const { plan } = req.body;
    const userId = req.user.id;

    const result = await SubscriptionService.createCheckoutSession(
      userId,
      plan,
    );

    sendResponse(
      res,
      status.OK,
      true,
      "Checkout session created successfully",
      result,
    );
  },
);

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await SubscriptionService.cancelSubscription(userId);

  sendResponse(
    res,
    status.OK,
    true,
    "Subscription cancelled successfully",
    result,
  );
});

const createCustomerPortal = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await SubscriptionService.createCustomerPortalSession(userId);

  sendResponse(res, status.OK, true, "Portal session created", result);
});

const getUserBillingDetails = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    if (!userId) {
      return sendResponse(res, status.BAD_REQUEST, false, "User id required!");
    }
    const result = await SubscriptionService.getUserBillingDetails(userId);

    sendResponse(
      res,
      status.OK,
      true,
      "User billing details retrieved successfully",
      result,
    );
  },
);

export const SubscriptionController = {
  createCheckoutSession,
  cancelSubscription,
  createCustomerPortal,
  getUserBillingDetails,
};
