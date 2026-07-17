import { Router } from "express";
import { GenerationType } from "../../generated/prisma/enums";
import { checkAuth } from "../middleware/checkAuth";
import { checkGenerateAuth } from "../middleware/checkGenerateAuth";
import { AuthRoutes } from "../modules/auth/auth.route";
import { TextToImageRoutes } from "../modules/text-to-image/textToImage.route";
import { AiChatBotRoutes } from "../modules/ai-chat-bot/aiChatBot.routes";

const router = Router();

router.use("/auth", AuthRoutes);
router.use(
  "/text-to-image",
  checkAuth(),
  checkGenerateAuth(GenerationType.TEXT_TO_IMAGE),
  TextToImageRoutes,
);
router.use(
  "/ai-chat-bot",
  checkAuth(),
  checkGenerateAuth(GenerationType.AI_CHATBOT),
  AiChatBotRoutes,
);

export const indexRoute = router;
