import status from "http-status";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import type { ICreatePricePlan, IUpdatePricePlan } from "./pricePlan.types";

const createPricePlanInDB = async (payload: ICreatePricePlan) => {
  const result = await prisma.pricingPlan.create({
    data: payload,
  });
  return result;
};

const getAllPricePlansFromDB = async () => {
  const result = await prisma.pricingPlan.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      isActive: true,
    },
  });
  return result;
};

const getPricePlanByIdFromDB = async (pricingId: string) => {
  const result = await prisma.pricingPlan.findUnique({
    where: { id: pricingId },
  });
  if (!result) {
    throw new AppError(status.NOT_FOUND, "Pricing plan not found");
  }
  return result;
};

const updatePricePlanInDB = async (
  pricingId: string,
  payload: IUpdatePricePlan,
) => {
  const plan = await prisma.pricingPlan.findUnique({
    where: { id: pricingId },
  });
  if (!plan) {
    throw new AppError(status.NOT_FOUND, "Pricing plan not found");
  }

  const result = await prisma.pricingPlan.update({
    where: { id: pricingId },
    data: payload,
  });
  return result;
};

const deletePricePlanFromDB = async (pricingId: string) => {
  const plan = await prisma.pricingPlan.findUnique({
    where: { id: pricingId },
  });
  if (!plan) {
    throw new AppError(status.NOT_FOUND, "Pricing plan not found");
  }

  const result = await prisma.pricingPlan.update({
    where: { id: pricingId },
    data: {
      isActive: false,
      isPopular: false,
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });
  return result;
};

export const PricePlanService = {
  createPricePlanInDB,
  getAllPricePlansFromDB,
  getPricePlanByIdFromDB,
  updatePricePlanInDB,
  deletePricePlanFromDB,
};
