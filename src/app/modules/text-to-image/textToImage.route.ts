import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { TextToImageController } from "./textToImage.controller";
import { TextToImageValidation } from "./textToImage.schema";

const router = Router();

router.post(
  "/",
  validateRequest(TextToImageValidation.generateTextToImageSchema),
  TextToImageController.generateImage,
);

export const TextToImageRoutes = router;
