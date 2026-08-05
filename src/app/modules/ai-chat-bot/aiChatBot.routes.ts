import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
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

router.post(
  "/stream",
  validateRequest(AiChatBotValidation.streamChatValidationSchema),
  checkAuth(),
  checkGenerateAuth(GenerationType.AI_CHATBOT),
  AiChatBotController.streamChatResponse,
);

router.get(
  "/conversations/:conversationId",
  checkAuth(),
  AiChatBotController.getConversationChatsController,
);

export const AiChatBotRoutes = router;
