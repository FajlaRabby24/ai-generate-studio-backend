import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TextToVideoService } from "./textToVideo.service";

const generateVideo = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { prompt, aspectRatio, numFrames, frameRate } = req.body;
  if (!prompt) {
    return sendResponse(res, status.BAD_REQUEST, false, "prompt is required");
  }

  if (!userId) {
    return sendResponse(
      res,
      status.UNAUTHORIZED,
      false,
      "Unauthorized: User not found in request context",
    );
  }

  const result = await TextToVideoService.textToVideoGeneratePixazo(
    userId,
    prompt,
    aspectRatio,
    numFrames,
    frameRate,
  );

  sendResponse(
    res,
    status.OK,
    true,
    "Video generation initiated successfully. Rendering is processing in the background.",
    result,
  );
});

const getRecentGeneration = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, status.UNAUTHORIZED, false, "Unauthorized", null);
  }

  const result = await TextToVideoService.getRecentGeneration(userId);

  sendResponse(
    res,
    status.OK,
    true,
    "Recent generations retrieved successfully",
    result,
  );
});

const handleVideoWebhook = catchAsync(async (req: Request, res: Response) => {
  const result = await TextToVideoService.updateVideoStatusFromWebhook(
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

export const TextToVideoController = {
  generateVideo,
  getRecentGeneration,
  handleVideoWebhook, // এক্সপোর্ট অবজেক্টে যোগ করা হলো
};
