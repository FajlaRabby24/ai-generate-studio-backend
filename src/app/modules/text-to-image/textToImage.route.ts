import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { TextToImageController } from "./textToImage.controller";
import { TextToImageValidation } from "./textToImage.zod";

const router = Router();

router.post(
  "/",
  validateRequest(TextToImageValidation.generateTextToImageSchema),
  checkGenerateAuth(GenerationType.TEXT_TO_IMAGE),
  TextToImageController.generateImage,
);

export const TextToImageRoutes = router;
