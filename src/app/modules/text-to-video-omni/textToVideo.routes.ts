import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { TextToVideoOmniController } from "./textToVideo.controller";
import { TextToVideoOmniValidation } from "./textToVideo.zod";

const router = Router();

router.post(
  "/",
  validateRequest(TextToVideoOmniValidation.generateTextToVideoSchema),
  checkGenerateAuth(GenerationType.TEXT_TO_VIDEO),
  TextToVideoOmniController.generateVideo
);

export const TextToVideoOmniRoutes = router;
