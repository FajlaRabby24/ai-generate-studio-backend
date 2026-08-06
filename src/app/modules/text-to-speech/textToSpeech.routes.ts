import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { TextToSpeechController } from "./textToSpeech.controller";
import { TextToSpeechValidation } from "./textToSpeech.zod";

const router = Router();

// router.post(
//   "/",
//   validateRequest(TextToSpeechValidation.generateTextToSpeechSchema),
//   checkGenerateAuth(GenerationType.TEXT_TO_SPEECH),
//   TextToSpeechController.generateSpeech,
// );

router.post(
  "/",
  validateRequest(TextToSpeechValidation.testTextToSpeechSchema),
  checkAuth(),
  checkGenerateAuth(GenerationType.TEXT_TO_SPEECH),
  TextToSpeechController.testTextToSpeech,
);

router.get(
  "/voices",
  validateRequest(TextToSpeechValidation.getVoicesSchema),
  TextToSpeechController.getAllVoices,
);

export const TextToSpeechRoutes = router;
