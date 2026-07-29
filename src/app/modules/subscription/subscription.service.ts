import status from "http-status";
import Stripe from "stripe";
import {
  PaymentGateway,
  PaymentStatus,
  Plan,
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

const calculatePeriodEnd = (plan: SubscriptionPlan): Date => {
  const now = new Date();
  if (plan === SubscriptionPlan.YEARLY) {
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  }
  if (plan === SubscriptionPlan.MONTHLY) {
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
  return now;
};

const handleWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      try {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as SubscriptionPlan;

        if (!userId || !plan) break;

        const subscriptionId = session.subscription as string;
        if (!subscriptionId) break;

        const stripeSubRaw =
          await stripe.subscriptions.retrieve(subscriptionId);

        const periodStart = new Date((stripeSubRaw as any).current_period_start * 1000);
        const periodEnd = new Date((stripeSubRaw as any).current_period_end * 1000);

        const updatedSub = await prisma.subscription.update({
          where: { userId },
          data: {
            plan,
            status: SubscriptionStatus.ACTIVE,
            stripeSubscriptionId: stripeSubRaw.id,
            stripePriceId:
              (stripeSubRaw as any).items?.data?.[0]?.price?.id ?? null,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            cancelledAt: null,
          },
          include: { user: true },
        });

        // Sync user table plan and stripe details
        const userPlan = plan === SubscriptionPlan.FREE ? Plan.FREE : Plan.PRO;
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: userPlan,
            stripeSubId: stripeSubRaw.id,
          },
        });

        const invoiceId = session.invoice as string;
        if (invoiceId) {
          const alreadyProcessed = await prisma.payment.findFirst({
            where: { transactionId: invoiceId },
          });

          if (!alreadyProcessed) {
            await prisma.payment.create({
              data: {
                userId,
                subscriptionId: updatedSub.id,
                transactionId: invoiceId,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency ?? "USD",
                status: PaymentStatus.SUCCESS,
                gateway: PaymentGateway.STRIPE,
                planActivated: userPlan,
                metadata: session as any,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error handling checkout.session.completed:", error);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        let stripeSubscriptionId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id;

        // Fallback: Check invoice lines if root subscription is missing
        if (!stripeSubscriptionId && invoice.lines?.data?.[0]) {
          stripeSubscriptionId = (invoice.lines.data[0] as any).subscription;
        }

        const stripeCustomerId =
          typeof (invoice as any).customer === "string"
            ? (invoice as any).customer
            : (invoice as any).customer?.id;

        const alreadyProcessed = await prisma.payment.findFirst({
          where: { transactionId: invoice.id },
        });
        if (alreadyProcessed) {
          break;
        }

        let subscription = await prisma.subscription.findFirst({
          where: stripeSubscriptionId
            ? { stripeSubscriptionId }
            : { id: "none" },
        });

        // Fallback: If subscription ID isn't found or missing, find by customer ID
        if (!subscription && stripeCustomerId) {
          subscription = await prisma.subscription.findFirst({
            where: { stripeCustomerId },
          });
        }

        if (!subscription) {
          break;
        }

        // If we found it via customer but had no ID from invoice, use the one from DB
        const finalSubscriptionId =
          stripeSubscriptionId || subscription.stripeSubscriptionId;

        if (!finalSubscriptionId) {
          break;
        }

        const stripeSubRaw = await stripe.subscriptions.retrieve(finalSubscriptionId);
        const periodStart = new Date((stripeSubRaw as any).current_period_start * 1000);
        const periodEnd = new Date((stripeSubRaw as any).current_period_end * 1000);
        const userPlan =
          subscription.plan === SubscriptionPlan.FREE ? Plan.FREE : Plan.PRO;

        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              stripeSubscriptionId: finalSubscriptionId,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: false,
            },
          });

          await tx.user.update({
            where: { id: subscription.userId },
            data: {
              plan: userPlan,
              stripeSubId: finalSubscriptionId,
            },
          });

          await tx.payment.create({
            data: {
              userId: subscription.userId,
              subscriptionId: subscription.id,
              transactionId: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency ?? "usd",
              status: PaymentStatus.SUCCESS,
              gateway: PaymentGateway.STRIPE,
              planActivated: userPlan,
              metadata: invoice as any,
            },
          });
        });
      } catch (error) {
        console.error("Error handling invoice.payment_succeeded:", error);
      }
      break;
    }

    case "invoice.payment_failed": {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id;

        if (!stripeSubscriptionId) {
          break;
        }

        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId },
        });
        if (!subscription) break;

        const userPlan =
          subscription.plan === SubscriptionPlan.FREE ? Plan.FREE : Plan.PRO;

        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: SubscriptionStatus.PAST_DUE },
          });

          await tx.payment.create({
            data: {
              userId: subscription.userId,
              subscriptionId: subscription.id,
              transactionId: invoice.id,
              amount: invoice.amount_due / 100,
              currency: invoice.currency ?? "usd",
              status: PaymentStatus.FAILED,
              gateway: PaymentGateway.STRIPE,
              planActivated: userPlan,
              metadata: invoice as any,
            },
          });
        });
      } catch (error) {
        console.error("Error handling invoice.payment_failed:", error);
      }
      break;
    }

    case "customer.subscription.updated": {
      try {
        const subEvent = event.data.object as any;

        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subEvent.id },
        });
        if (!subscription) break;

        const subCanceledAt = subEvent.canceled_at || subEvent.canceledAt;

        let newStatus: SubscriptionStatus;
        switch (subEvent.status) {
          case "active":
            newStatus = SubscriptionStatus.ACTIVE;
            break;
          case "past_due":
            newStatus = SubscriptionStatus.PAST_DUE;
            break;
          case "canceled":
            newStatus = SubscriptionStatus.CANCELLED;
            break;
          default:
            newStatus = SubscriptionStatus.ACTIVE;
        }

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: newStatus,
            cancelAtPeriodEnd: subEvent.cancel_at_period_end ?? false,
            cancelledAt: subCanceledAt ? new Date(subCanceledAt * 1000) : null,
          },
        });
      } catch (error) {
        console.error("Error handling customer.subscription.updated:", error);
      }
      break;
    }

    case "customer.subscription.deleted": {
      try {
        const stripeSub = event.data.object as unknown as { id: string };

        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        });

        if (subscription) {
          await prisma.$transaction(async (tx) => {
            await tx.subscription.update({
              where: { id: subscription.id },
              data: {
                status: SubscriptionStatus.CANCELLED,
                cancelAtPeriodEnd: false,
                cancelledAt: new Date(),
                plan: SubscriptionPlan.FREE,
              },
            });

            await tx.user.update({
              where: { id: subscription.userId },
              data: {
                plan: Plan.FREE,
                stripeSubId: null,
              },
            });
          });
        }
      } catch (error) {
        console.error("Error handling customer.subscription.deleted:", error);
      }
      break;
    }

    default:
      break;
  }
};

export const SubscriptionService = {
  createCheckoutSession,
  cancelSubscription,
  createCustomerPortalSession,
  handleWebhookEvent,
};
