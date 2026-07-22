import type { Request, Response } from "express";
import { Router } from "express";
import status from "http-status";
import { GenerationType } from "../../generated/prisma/enums";
import { checkAuth } from "../middleware/checkAuth";
import { checkGenerateAuth } from "../middleware/checkGenerateAuth";
import { AiChatBotRoutes } from "../modules/ai-chat-bot/aiChatBot.routes";
import { AuthRoutes } from "../modules/auth/auth.route";
import { BackgroundRoutes } from "../modules/background-remover/backgroundRemover.routes";
import { ResumeAnalyzerRoutes } from "../modules/resume-analyzer/resumeAnalyzer.routes";
import { TextToImageRoutes } from "../modules/text-to-image/textToImage.route";
import { TextToVideoRoutes } from "../modules/text-to-video/textToVideo.routes";
import { sendResponse } from "../shared/sendResponse";
import { rateLimiters } from "../utils/rate-limit";

const router = Router();

router.use("/auth", AuthRoutes);
router.use(
  "/text-to-image",
  rateLimiters.generationLimiter,
  checkAuth(),
  TextToImageRoutes,
);
router.use(
  "/ai-chat-bot",
  rateLimiters.generationLimiter,
  checkAuth(),
  checkGenerateAuth(GenerationType.AI_CHATBOT),
  AiChatBotRoutes,
);

router.use(
  "/background-remove",
  rateLimiters.generationLimiter,
  checkAuth(),
  checkGenerateAuth(GenerationType.IMAGE_BACKGROUND_REMOVER),
  BackgroundRoutes,
);

router.use(
  "/resume-analyzer",
  rateLimiters.generationLimiter,
  checkAuth(),
  checkGenerateAuth(GenerationType.RESUME_ANALYZER),
  ResumeAnalyzerRoutes,
);

router.use("/text-to-video", TextToVideoRoutes);

router.post("/validate-profile-image", async (req: Request, res: Response) => {
  try {
    const { name, size, type } = req.body;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 1 * 1024 * 1024; // 1MB

    if (!name || !size || !type) {
      return sendResponse(res, status.BAD_REQUEST, false, "Missing file info");
    }

    if (!allowedTypes.includes(type)) {
      return sendResponse(
        res,
        status.BAD_REQUEST,
        false,
        "Only JPG, PNG, WEBP allowed",
      );
    }

    if (size > maxSize) {
      return sendResponse(
        res,
        status.BAD_REQUEST,
        false,
        "File size must be under 1MB",
      );
    }

    return sendResponse(res, status.OK, true, "File is valid");
  } catch (error) {
    return sendResponse(
      res,
      status.INTERNAL_SERVER_ERROR,
      false,
      "Error validating file",
    );
  }
});

export const indexRoute = router;
