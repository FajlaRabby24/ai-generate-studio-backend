import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AiChatBotController } from "./aiChatBot.controller";
import { AiChatBotValidation } from "./aiChatBot.zod";

const router = Router();

router.post(
  "/",
  validateRequest(AiChatBotValidation.chatValidationSchema),
  checkGenerateAuth(GenerationType.AI_CHATBOT),
  AiChatBotController.chatResponse,
);

export const AiChatBotRoutes = router;
