import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ImageToVideoController } from "./imageToVideo.controller";
import { ImageToVideoValidation } from "./imageToVideo.zod";
import { rateLimiters } from "../../utils/rate-limit";

const router = Router();

router.post(
  "/",
  rateLimiters.generationLimiter,
  multerUpload.single("singleFile"),
  validateRequest(ImageToVideoValidation.generateVideoSchema),
  checkAuth(),
  checkGenerateAuth(GenerationType.IMAGE_TO_VIDEO),
  ImageToVideoController.imageToVideo,
);

router.post("/webhook/callback", ImageToVideoController.handleVideoWebhook);

router.get(
  "/recent",
  checkAuth(),
  ImageToVideoController.getRecentGeneration,
);

export const ImageToVideoRoutes = router;
