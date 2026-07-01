import type { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { generateService } from "./generate.service";

const textToImage = catchAsync(async (req: Request, res: Response) => {
  const prompt = req.body;
  if (prompt === "" || prompt === null || prompt === undefined) {
    return sendResponse(res, 400, false, "Please provide a prompt");
  }

  const result = await generateService.textToImage(prompt);
  return sendResponse(res, 200, true, "Image generated successfully", result);
});

export const generateController = {
  textToImage,
};
