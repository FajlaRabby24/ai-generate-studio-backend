import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ImageToVideoService } from "./imageToVideo.service";

const imageToVideo = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "singleFile is required",
    );
  }

  const { prompt, aspectRatio, numFrames, frameRate } = req.body;
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(
      res,
      status.UNAUTHORIZED,
      false,
      "Unauthorized: User not found in request context",
    );
  }

  if (!prompt) {
    return sendResponse(res, status.BAD_REQUEST, false, "Prompt is required");
  }

  const result = await ImageToVideoService.imageToVideo(
    userId,
    req.file.buffer,
    req.file.mimetype,
    prompt,
    aspectRatio,
    numFrames ? Number(numFrames) : undefined,
    frameRate ? Number(frameRate) : undefined,
  );

  sendResponse(
    res,
    status.OK,
    true,
    "Image to video generation queued successfully",
    result,
  );
});

const handleVideoWebhook = catchAsync(async (req: Request, res: Response) => {
  // Json2Video থেকে আসা ডেটা পাস করে দেওয়া হচ্ছে সার্ভিসে
  const result = await ImageToVideoService.updateVideoStatusFromWebhook(
    req.body,
  );
  if (!result) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Webhook processed failed",
    );
  }

  // Json2Video-কে জানাতে হবে যে আমরা ডেটা পেয়েছি, তাই OK (200) রেসপন্স
  sendResponse(res, status.OK, true, "Webhook processed successfully", result);
});

const getRecentGeneration = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, status.UNAUTHORIZED, false, "Unauthorized", null);
  }

  const result = await ImageToVideoService.getRecentGeneration(userId);

  sendResponse(
    res,
    status.OK,
    true,
    "Recent generations retrieved successfully",
    result[0],
  );
});

export const ImageToVideoController = {
  imageToVideo,
  handleVideoWebhook,
  getRecentGeneration,
};
