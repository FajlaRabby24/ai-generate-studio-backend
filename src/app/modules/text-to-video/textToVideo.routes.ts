import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { rateLimiters } from "../../utils/rate-limit";
import { TextToVideoController } from "./textToVideo.controller";
import { TextToVideoValidation } from "./textToVideo.zod";

const router = Router();

router.post(
  "/",
  rateLimiters.generationLimiter,
  checkAuth(),
  checkGenerateAuth(GenerationType.TEXT_TO_VIDEO),
  validateRequest(TextToVideoValidation.generateVideoSchema),
  TextToVideoController.generateVideo,
);

// 🎯 নতুন যোগ করা Webhook রাউট
router.post("/webhook", TextToVideoController.handleVideoWebhook);

export const TextToVideoRoutes = router;
