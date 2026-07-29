import status from "http-status";
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const createCheckoutSession = async (
  userId: string,
  plan: SubscriptionPlan,
) => {
  // 3. Check if plan === Free.
  if (plan === SubscriptionPlan.FREE) {
    throw new AppError(status.BAD_REQUEST, "Cannot checkout for FREE plan");
  }

  // 4. Find pricingPlan in prisma.pricingPlan by plan
  const pricingPlan = await prisma.pricingPlan.findUnique({
    where: { plan },
  });

  // 5. Throw if pricingPlan doesn't exist
  if (!pricingPlan) {
    throw new AppError(status.NOT_FOUND, "Pricing plan not found");
  }

  // Find subscription by userId to check for active plans
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  // 6. Check if user already has an active non-free plan
  if (subscription && subscription.plan !== SubscriptionPlan.FREE) {
    throw new AppError(
      status.BAD_REQUEST,
      `You already have an active ${subscription.plan} plan. Use Manage Subscription to change it.`,
    );
  }

  // 7. Get stripe customer ID
  let customerId: string | null | undefined = subscription?.stripeCustomerId;

  // 8. Verify customer in Stripe
  if (customerId) {
    try {
      // Verify if the customer actually exists in the current Stripe account
      await stripe.customers.retrieve(customerId);
    } catch (error: any) {
      if (error.code === "resource_missing") {
        // Customer was likely deleted from Stripe or we switched Stripe accounts
        customerId = undefined;
        await prisma.subscription.update({
          where: { userId },
          data: { stripeCustomerId: null },
        });
      } else {
        throw error;
      }
    }
  }

  // 9. Create Stripe customer if one doesn't exist
  if (!customerId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) {
      throw new AppError(status.BAD_REQUEST, "User email not found");
    }

    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });
    customerId = customer.id;

    if (subscription) {
      await prisma.subscription.update({
        where: { userId },
        data: { stripeCustomerId: customerId },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId: customerId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(), // overwritten by webhook later
        },
      });
    }
  }

  // 10. Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: pricingPlan.stripePriceId as string,
        quantity: 1,
      },
    ],
    success_url: `${envVars.FRONTEND_URL}/dashboard/payments/success`,
    cancel_url: `${envVars.FRONTEND_URL}/dashboard/payments/cancel`,
    metadata: { userId, plan },
    subscription_data: {
      metadata: { userId, plan },
    },
  });

  return { sessionId: session.id, paymentUrl: session.url };
};

const cancelSubscription = async (userId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new AppError(status.NOT_FOUND, "Subscription not found");
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
  );

  if (stripeSubscription.status === "canceled") {
    throw new AppError(status.BAD_REQUEST, "Subscription already cancelled");
  }

  if (stripeSubscription.cancel_at_period_end) {
    throw new AppError(
      status.BAD_REQUEST,
      "Subscription is already set to cancel at period end",
    );
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  const updated = await prisma.subscription.update({
    where: { userId },
    data: {
      status: SubscriptionStatus.CANCELLED,
      cancelAtPeriodEnd: true,
      cancelledAt: new Date(),
    },
  });

  return updated;
};

const createCustomerPortalSession = async (userId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.stripeCustomerId) {
    throw new AppError(
      status.NOT_FOUND,
      "Stripe customer not found for this user",
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${envVars.FRONTEND_URL}/dashboard/payments/success`,
  });

  return { url: session.url };
};

export const SubscriptionService = {
  createCheckoutSession,
  cancelSubscription,
  createCustomerPortalSession,
};
