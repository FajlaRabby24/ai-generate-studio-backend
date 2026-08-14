import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AiChatBotController } from "./aiChatBot.controller";
import { AiChatBotValidation } from "./aiChatBot.zod";
import { rateLimiters } from "../../utils/rate-limit";

const router = Router();

// router.post(
//   "/",
//   validateRequest(AiChatBotValidation.chatValidationSchema),
//   checkGenerateAuth(GenerationType.AI_CHATBOT),
//   AiChatBotController.chatResponse,
// );

router.post(
  "/stream",
   rateLimiters.generationLimiter,
  validateRequest(AiChatBotValidation.streamChatValidationSchema),
  checkAuth(),
  checkGenerateAuth(GenerationType.AI_CHATBOT),
  AiChatBotController.streamChatResponse,
);

router.get(
  "/conversations",
  checkAuth(),
  AiChatBotController.getUserConversationsTitle,
);

router.get(
  "/conversations/:conversationId",
  checkAuth(),
  AiChatBotController.getConversationChatsById,
);

export const AiChatBotRoutes = router;
