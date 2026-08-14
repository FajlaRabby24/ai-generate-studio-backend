import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { rateLimiters } from "../../utils/rate-limit";
import { TextToImageController } from "./textToImage.controller";
import { TextToImageValidation } from "./textToImage.zod";

const router = Router();

router.post(
  "/",
  rateLimiters.generationLimiter,
  checkAuth(),
  validateRequest(TextToImageValidation.generateTextToImageSchema),
  checkGenerateAuth(GenerationType.TEXT_TO_IMAGE),
  TextToImageController.generateImage,
);

router.get("/recent", checkAuth(), TextToImageController.getRecentGeneration);

export const TextToImageRoutes = router;
