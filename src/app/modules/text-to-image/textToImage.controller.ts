import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TextToImageService } from "./textToImage.service";

const generateImage = catchAsync(async (req: Request, res: Response) => {
  const { prompt } = req.body;
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

  // return;

  const result = await TextToImageService.GenerateTextToImage(
    userId,
    prompt,
    field as string,
  );
  if (!result) {
    return sendResponse(
      res,
      status.INTERNAL_SERVER_ERROR,
      false,
      "Failed to generate image",
      null,
    );
  }

  // // console.log("result", result);
  sendResponse(res, status.OK, true, "Image generated successfully", result);
});

const getRecentGeneration = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, status.UNAUTHORIZED, false, "Unauthorized", null);
  }

  const result = await TextToImageService.getRecentGeneration(userId);

  sendResponse(
    res,
    status.OK,
    true,
    "Recent generations retrieved successfully",
    result,
  );
});

export const TextToImageController = {
  generateImage,
  getRecentGeneration,
};
