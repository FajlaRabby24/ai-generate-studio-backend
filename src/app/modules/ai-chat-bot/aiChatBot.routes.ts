import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { AiChatBotController } from "./aiChatBot.controller";
import { AiChatBotValidation } from "./aiChatBot.zod";

const router = Router();

router.post(
  "/",
  validateRequest(AiChatBotValidation.chatValidationSchema),
  AiChatBotController.chatResponse,
);

export const AiChatBotRoutes = router;
