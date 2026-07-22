import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TextToImageService } from "./textToImage.service";

const generateImage = catchAsync(async (req: Request, res: Response) => {
  const { prompt } = req.body;
  const userId = req.user?.id;
  console.log("controller", userId, req.body);

  if (!prompt) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Prompt is required",
      null,
    );
  }

  const result = await TextToImageService.GenerateTextToImage(userId, prompt);
  if (!result) {
    return sendResponse(
      res,
      status.INTERNAL_SERVER_ERROR,
      false,
      "Failed to generate image",
      null,
    );
  }

  console.log("result", result);

  sendResponse(res, status.OK, true, "Image generated successfully", result);
  sendResponse(res, status.OK, true, "Image generated successfully");
});

export const TextToImageController = {
  generateImage,
};
