import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { textToVideoOmniService } from "./textToVideo.service";

const generateVideo = catchAsync(async (req: Request, res: Response) => {
  // console.log("controller hit", req.body);
  const { prompt, ratio } = req.body;
  const userId = req.user?.id;
  const field = req.currentGenerationField;

  if (!prompt) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Prompt is required",
      null,
    );
  }

  if (!ratio) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Aspect ratio (ratio) is required",
      null,
    );
  }

  const result = await textToVideoOmniService.textToVideoOmni(
    userId,
    prompt,
    ratio,
    field as string,
  );

  if (!result) {
    return sendResponse(
      res,
      status.INTERNAL_SERVER_ERROR,
      false,
      "Failed to generate video",
      null,
    );
  }

  sendResponse(
    res,
    status.OK,
    true,
    "Video generated successfully using Gemini Omni",
    result,
  );
});

export const TextToVideoOmniController = {
  generateVideo,
};
