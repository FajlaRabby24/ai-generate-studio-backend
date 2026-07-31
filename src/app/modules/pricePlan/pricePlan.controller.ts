import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PricePlanService } from "./pricePlan.service";

const createPricePlan = catchAsync(async (req: Request, res: Response) => {
  const result = await PricePlanService.createPricePlanInDB(req.body);

  sendResponse(
    res,
    status.CREATED,
    true,
    "Pricing plan created successfully",
    result,
  );
});

const getAllPricePlans = catchAsync(async (req: Request, res: Response) => {
  const result = await PricePlanService.getAllPricePlansFromDB();

  sendResponse(
    res,
    status.OK,
    true,
    "Pricing plans fetched successfully",
    result,
  );
});

const getPricePlanById = catchAsync(async (req: Request, res: Response) => {
  const { id: pricingId } = req.params;
  if (!pricingId) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Pricing plan id is required",
      null,
    );
  }
  const result = await PricePlanService.getPricePlanByIdFromDB(
    pricingId as string,
  );

  sendResponse(
    res,
    status.OK,
    true,
    "Pricing plan fetched successfully",
    result,
  );
});

const updatePricePlan = catchAsync(async (req: Request, res: Response) => {
  const { pricingId } = req.params;
  if (!pricingId) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Pricing plan id is required",
      null,
    );
  }
  const result = await PricePlanService.updatePricePlanInDB(
    pricingId as string,
    req.body,
  );

  sendResponse(
    res,
    status.OK,
    true,
    "Pricing plan updated successfully",
    result,
  );
});

const deletePricePlan = catchAsync(async (req: Request, res: Response) => {
  const { pricingId } = req.params;
  if (!pricingId) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Pricing plan id is required",
      null,
    );
  }
  const result = await PricePlanService.deletePricePlanFromDB(
    pricingId as string,
  );

  sendResponse(
    res,
    status.OK,
    true,
    "Pricing plan deleted successfully",
    result,
  );
});

export const PricePlanController = {
  createPricePlan,
  getAllPricePlans,
  getPricePlanById,
  updatePricePlan,
  deletePricePlan,
};
