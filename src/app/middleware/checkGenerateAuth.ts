import type { NextFunction, Request, Response } from "express";
import status from "http-status";
import {
  GenerationType,
  SubscriptionStatus,
} from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { sendResponse } from "../shared/sendResponse";

// Mapping GenerationType enum values to the corresponding User model database fields
const generationFieldMap: Record<
  GenerationType,
  { countField: string; refreshField: string }
> = {
  [GenerationType.TEXT_TO_IMAGE]: {
    countField: "textToImage",
    refreshField: "textToImageLastRefreshAT",
  },
  [GenerationType.AI_CHATBOT]: {
    countField: "aiChatbot",
    refreshField: "aiChatbotLastRefreshAT",
  },
  [GenerationType.CODE_CHECKER]: {
    countField: "codeChecker",
    refreshField: "codeCheckerLastRefreshAT",
  },
  [GenerationType.IMAGE_BACKGROUND_REMOVER]: {
    countField: "imageBackgroundRemover",
    refreshField: "imageBackgroundRemoverLastRefreshAT",
  },
  [GenerationType.IMAGE_CAPTION_GENERATOR]: {
    countField: "imageCaptionGenerator",
    refreshField: "imageCaptionGeneratorLastRefreshAT",
  },
  [GenerationType.RESUME_ANALYZER]: {
    countField: "resumeAnalyzer",
    refreshField: "resumeAnalyzerLastRefreshAT",
  },
  [GenerationType.LANGUAGE_TRANSLATOR]: {
    countField: "languageTranslator",
    refreshField: "languageTranslatorLastRefreshAT",
  },
  [GenerationType.GRAMMER_IMPROVER]: {
    countField: "grammarChecker",
    refreshField: "grammarCheckerLastRefreshAT",
  },
  [GenerationType.TEXT_TO_SPEECH]: {
    countField: "textToSpeech",
    refreshField: "textToSpeechLastRefreshAT",
  },
  [GenerationType.SPEECH_TO_TEXT]: {
    countField: "speechToText",
    refreshField: "speechToTextLastRefreshAT",
  },
  [GenerationType.IMAGE_TO_VIDEO]: {
    countField: "imageToVideo",
    refreshField: "imageToVideoLastRefreshAT",
  },
  [GenerationType.TEXT_TO_VIDEO]: {
    countField: "textToVideo",
    refreshField: "textToVideoLastRefreshAT",
  },
};

export const checkGenerateAuth = (requiredType: GenerationType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      if (type !== requiredType) {
        return sendResponse(
          res,
          status.BAD_REQUEST,
          false,
          `Invalid generation type. Expected: ${requiredType}, Received: ${type || "none"}`,
          null,
        );
      }

      if (!req.user || !req.user.id) {
        return sendResponse(
          res,
          status.UNAUTHORIZED,
          false,
          "Unauthorized: User not found in request context",
          null,
        );
      }

      const fieldConfig = generationFieldMap[requiredType];
      if (!fieldConfig) {
        return sendResponse(
          res,
          status.INTERNAL_SERVER_ERROR,
          false,
          "Internal server error: Invalid generation type mapping",
          null,
        );
      }

      const { countField, refreshField } = fieldConfig;

      const user = (await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          subscription: {
            select: {
              id: true,
              status: true,
            },
          },
          id: true,
          [countField]: true,
          [refreshField]: true,
        },
      })) as any;

      if (!user) {
        return sendResponse(
          res,
          status.NOT_FOUND,
          false,
          "User not found in database",
          null,
        );
      }

      let count = (user as any)[countField];

      const lastRefreshAt = (user as any)[refreshField] as Date;
      const now = new Date();
      const timeSinceLastRefresh =
        now.getTime() - new Date(lastRefreshAt).getTime();

      const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      const quotaResetLimits: Record<string, { active: number; free: number }> =
        {
          textToImage: { active: 5, free: 3 },
          aiChatbot: { active: 5, free: 3 },
          codeChecker: { active: 5, free: 3 },
          imageBackgroundRemover: { active: 5, free: 3 },
          imageCaptionGenerator: { active: 5, free: 3 },
          resumeAnalyzer: { active: 5, free: 3 },
          languageTranslator: { active: 5, free: 3 },
          grammarChecker: { active: 5, free: 3 },
          textToSpeech: { active: 25, free: 10 },
          speechToText: { active: 5, free: 3 },
          imageToVideo: { active: 3, free: 1 },
          textToVideo: { active: 3, free: 1 },
        };

      if (timeSinceLastRefresh >= ONE_DAY_MS) {
        // reset count + refresh field for this feature
        const updatedUser = await prisma.user.update({
          where: { id: req.user.id },
          data: {
            [countField]:
              user?.subscription?.status === SubscriptionStatus.ACTIVE
                ? (quotaResetLimits[countField]?.active ?? 5)
                : (quotaResetLimits[countField]?.free ?? 3),
            [refreshField]: now,
          },
          select: {
            id: true,
            [countField]: true,
          },
        });
        count = (updatedUser as any)[countField];
      }

      if (count <= 0) {
        // // console.log("hello, no credit");
        return sendResponse(
          res,
          status.FORBIDDEN,
          false,
          `You have run out of generation quota for ${requiredType.toLowerCase().replace(/_/g, " ")}. Please upgrade your plan.`,
          null,
        );
      }

      // pass field name to next middleware/controller, use it when decrementing
      req.currentGenerationField = countField;

      next();
    } catch (error) {
      // // console.error("Error in checkGenerateAuth middleware:", error);
      next(error);
    }
  };
};
