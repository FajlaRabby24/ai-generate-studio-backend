import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { TextToVideoController } from "./textToVideo.controller";
import { TextToVideoValidation } from "./textToVideo.zod";

const router = Router();

router.post(
  "/",
  validateRequest(TextToVideoValidation.generateVideoSchema),
  TextToVideoController.generateVideo,
);

// 🎯 নতুন যোগ করা Webhook রাউট
router.post("/webhook", TextToVideoController.handleVideoWebhook);

export const TextToVideoRoutes = router;
