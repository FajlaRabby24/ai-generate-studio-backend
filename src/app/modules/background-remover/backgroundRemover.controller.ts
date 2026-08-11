import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { BackgroundRemoverService } from "./backgroundRemover.service";

const backgroundRemover = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "singleFile is required",
    );
  }

  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(
      res,
      status.UNAUTHORIZED,
      false,
      "Unauthorized: User not found in request context",
    );
  }

  const result = await BackgroundRemoverService.removeBackground(
    userId,
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname,
  );

  sendResponse(
    res,
    status.CREATED,
    true,
    "Background removed successfully",
    result,
  );
});

const getRecentGeneration = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, status.UNAUTHORIZED, false, "Unauthorized", null);
  }

  const result = await BackgroundRemoverService.getRecentGeneration(userId);

  sendResponse(
    res,
    status.OK,
    true,
    "Recent generations retrieved successfully",
    result[0],
  );
});


export const BackgroundRemover = {
  backgroundRemover,
  getRecentGeneration
};
