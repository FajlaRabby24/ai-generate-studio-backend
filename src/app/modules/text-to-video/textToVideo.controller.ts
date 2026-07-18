import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TextToVideoService } from "./textToVideo.service";

const generateVideo = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(
      res,
      status.UNAUTHORIZED,
      false,
      "Unauthorized: User not found in request context",
    );
  }

  const result = await TextToVideoService.generateTextToVideo(req.body, userId);

  sendResponse(
    res,
    status.OK,
    true,
    "Video generation initiated successfully. Rendering is processing in the background.",
    result,
  );
});

// 🎯 নতুন যোগ করা Webhook কন্ট্রোলার
const handleVideoWebhook = catchAsync(async (req: Request, res: Response) => {
  // Json2Video থেকে আসা ডেটা পাস করে দেওয়া হচ্ছে সার্ভিসে
  const result = await TextToVideoService.updateVideoStatusFromWebhook(
    req.body,
  );

  // Json2Video-কে জানাতে হবে যে আমরা ডেটা পেয়েছি, তাই OK (200) রেসপন্স
  sendResponse(res, status.OK, true, "Webhook processed successfully", result);
});

export const TextToVideoController = {
  generateVideo,
  handleVideoWebhook, // এক্সপোর্ট অবজেক্টে যোগ করা হলো
};
