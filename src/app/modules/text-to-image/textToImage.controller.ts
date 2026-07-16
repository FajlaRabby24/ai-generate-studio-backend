import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TextToImageService } from "./textToImage.service";

const generateImage = catchAsync(async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Prompt is required",
      null,
    );
  }

  const resultBlob = await TextToImageService.GenerateTextToImage(prompt);

  const arrayBuffer = await (resultBlob as any).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;

  sendResponse(res, status.OK, true, "Image generated successfully", {
    image: base64Image,
  });
});

export const TextToImageController = {
  generateImage,
};
