import type { NextFunction, Request, Response } from "express";
import status from "http-status";
import { GenerationType } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { sendResponse } from "../shared/sendResponse";

// Mapping GenerationType enum values to the corresponding User model database fields
const generationTypeFieldMap: Record<GenerationType, string> = {
  [GenerationType.TEXT_TO_IMAGE]: "textToImage",
  [GenerationType.AI_CHATBOT]: "aiChatbot",
  [GenerationType.CODE_CHECKER]: "codeChecker",
  [GenerationType.IMAGE_BACKGROUND_REMOVER]: "imageBackgroundRemover",
  [GenerationType.IMAGE_CAPTION_GENERATOR]: "imageCaptionGenerator",
  [GenerationType.RESUME_ANALYZER]: "resumeAnalyzer",
  [GenerationType.LANGUAGE_TRANSLATOR]: "languageTranslator",
  [GenerationType.GRAMMER_IMPROVER]: "grammarChecker",
  [GenerationType.TEXT_TO_SPEECH]: "textToSpeech",
  [GenerationType.SPEECH_TO_TEXT]: "speechToText",
  [GenerationType.IMAGE_TO_VIDEO]: "imageToVideo",
  [GenerationType.TEXT_TO_VIDEO]: "textToVideo",
};

/**
 * Middleware to check user's remaining generations count before allowing access to AI tools.
 *
 * @param requiredType The expected GenerationType for the specific endpoint
 */
export const checkGenerateAuth = (requiredType: GenerationType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      console.log("type", type);

      // 1. Check if the required generation type and the one in req.body match.
      if (type !== requiredType) {
        return sendResponse(
          res,
          status.BAD_REQUEST,
          false,
          `Invalid generation type. Expected: ${requiredType}, Received: ${type || "none"}`,
          null,
        );
      }

      // Ensure req.user exists (checkAuth middleware should run before this middleware)
      if (!req.user || !req.user.id) {
        return sendResponse(
          res,
          status.UNAUTHORIZED,
          false,
          "Unauthorized: User not found in request context",
          null,
        );
      }

      const dbField = generationTypeFieldMap[requiredType];
      if (!dbField) {
        return sendResponse(
          res,
          status.INTERNAL_SERVER_ERROR,
          false,
          "Internal server error: Invalid generation type mapping",
          null,
        );
      }

      // Fetch the latest count directly from the database for data accuracy
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          [dbField]: true,
        },
      });

      if (!user) {
        return sendResponse(
          res,
          status.NOT_FOUND,
          false,
          "User not found in database",
          null,
        );
      }

      const count = (user as any)[dbField];

      // 2. Check if the remaining generation count is greater than 0.
      if (count <= 0) {
        return sendResponse(
          res,
          status.FORBIDDEN,
          false,
          `You have run out of generation quota for ${requiredType.toLowerCase().replace(/_/g, " ")}. Please upgrade your plan.`,
          null,
        );
      }

      // 3. If count >= 1, proceed to the controller.
      next();
    } catch (error) {
      next(error);
    }
  };
};
