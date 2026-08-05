import { GoogleGenAI } from "@google/genai";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";

const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });

const ChatbotService = async (
  userId: string,
  userMessage: string,
  chatHistory: any[],
) => {
  const chat = ai.chats.create({
    model: "gemini-3.6-flash",
    history: chatHistory,
  });

  const response = await chat.sendMessage({ message: userMessage });
  const responseText = response.text || "";

  // Perform background DB updates to store history and decrement quota
  setImmediate(() => {
    (async () => {
      try {
        const generated = await prisma.generated.create({
          data: {
            userId,
            type: GenerationType.AI_CHATBOT,
          },
        });

        await prisma.aIChat.create({
          data: {
            generatedId: generated.id,
            status: GenerationStatus.COMPLETED,
            input: userMessage,
            output: responseText,
            chatHistory: chatHistory.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)),
          },
        });

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            aiChatbotLastRefreshAT: new Date(),
            aiChatbot: {
              decrement: 1,
            },
          },
        });
      } catch (dbError) {
        console.error("[Background DB Error - AI Chatbot]:", dbError);
      }
    })();
  });

  return {
    response: responseText,
  };
};

export const AiChatBot = {
  ChatbotService,
};
