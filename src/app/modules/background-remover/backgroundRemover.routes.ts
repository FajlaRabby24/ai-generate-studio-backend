import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { BackgroundRemover } from "./backgroundRemover.controller";
import { BackgroundRemoverValidation } from "./backgroundRemover.zod";
import { rateLimiters } from "../../utils/rate-limit";

const router = Router();

router.post(
  "/",
  rateLimiters.generationLimiter,
  multerUpload.single("singleFile"),
  validateRequest(BackgroundRemoverValidation.backgroundRemover),
  checkAuth(),
  checkGenerateAuth(GenerationType.IMAGE_BACKGROUND_REMOVER),
  BackgroundRemover.backgroundRemover,
);

router.get("/recent", checkAuth(), BackgroundRemover.getRecentGeneration);

export const BackgroundRoutes = router;
