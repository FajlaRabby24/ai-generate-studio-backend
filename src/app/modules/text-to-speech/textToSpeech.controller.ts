import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { textToSpeechService } from "./textToSpeech.service";

const generateSpeech = catchAsync(async (req: Request, res: Response) => {
  const { prompt, voice } = req.body;
  const userId = req.user?.id;
  const field = req.currentGenerationField;

  if (!prompt) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Prompt is required",
      null
    );
  }

  if (!voice) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Voice option is required",
      null
    );
  }

  const result = await textToSpeechService.singleVoiceTTSService(
    userId,
    voice,
    prompt,
    field as string
  );

  if (!result) {
    return sendResponse(
      res,
      status.INTERNAL_SERVER_ERROR,
      false,
      "Failed to generate speech",
      null
    );
  }

  sendResponse(
    res,
    status.OK,
    true,
    "Speech generated successfully",
    result
  );
});

export const TextToSpeechController = {
  generateSpeech,
};
