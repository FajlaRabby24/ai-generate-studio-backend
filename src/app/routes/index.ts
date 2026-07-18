import { Router } from "express";
import { GenerationType } from "../../generated/prisma/enums";
import { checkAuth } from "../middleware/checkAuth";
import { checkGenerateAuth } from "../middleware/checkGenerateAuth";
import { rateLimiters } from "../utils/rate-limit";
import { AiChatBotRoutes } from "../modules/ai-chat-bot/aiChatBot.routes";
import { AuthRoutes } from "../modules/auth/auth.route";
import { BackgroundRoutes } from "../modules/background-remover/backgroundRemover.routes";
import { ResumeAnalyzerRoutes } from "../modules/resume-analyzer/resumeAnalyzer.routes";
import { TextToImageRoutes } from "../modules/text-to-image/textToImage.route";
import { TextToVideoRoutes } from "../modules/text-to-video/textToVideo.routes";

const router = Router();

router.use("/auth", AuthRoutes);
router.use(
  "/text-to-image",
  rateLimiters.generationLimiter,
  checkAuth(),
  checkGenerateAuth(GenerationType.TEXT_TO_IMAGE),
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

export const indexRoute = router;

