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
      null,
    );
  }

  if (!voice) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Voice option is required",
      null,
    );
  }

  const result = await textToSpeechService.singleVoiceTTSService(
    userId,
    voice,
    prompt,
    field as string,
  );

  if (!result) {
    return sendResponse(
      res,
      status.INTERNAL_SERVER_ERROR,
      false,
      "Failed to generate speech",
      null,
    );
  }

  sendResponse(res, status.OK, true, "Speech generated successfully", result);
});

const testTextToSpeech = catchAsync(async (req: Request, res: Response) => {
  const { prompt, voiceId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(
      res,
      status.UNAUTHORIZED,
      false,
      "Authorization token is required.",
      null,
    );
  }

  if (!prompt) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Prompt is required",
      null,
    );
  }

  if (!voiceId) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Voice option is required",
      null,
    );
  }

  const result = await textToSpeechService.textToSpeech(
    userId,
    prompt,
    voiceId,
  );

  sendResponse(res, status.OK, true, "Speech generated successfully", result);
});

// * get voices
const getAllVoices = catchAsync(async (req: Request, res: Response) => {
  const { lang, gender } = req.body;

  if (!lang || !gender) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "Language and Gender are required",
      null,
    );
  }

  const result = await textToSpeechService.getVoices(
    lang as string,
    gender as string,
  );

  sendResponse(res, status.OK, true, "Voices fetched successfully", result);
});

export const TextToSpeechController = {
  generateSpeech,
  testTextToSpeech,
  getAllVoices,
};
