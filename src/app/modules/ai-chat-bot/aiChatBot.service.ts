import { GoogleGenAI } from "@google/genai";
import { envVars } from "../../config/env";

const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });

const ChatbotService = async (
  userId: string,
  userMessage: string,
  chatHistory: any[],
) => {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: chatHistory,
  });

  const response = await chat.sendMessage({ message: userMessage });
  const responseText = response.text || "";

  // Perform background DB updates to store history and decrement quota
  // setImmediate(() => {
  //   (async () => {
  //     try {
  //       await prisma.generation.create({
  //         data: {
  //           outputUrls: responseText,
  //           type: GenerationType.AI_CHATBOT,
  //           prompt: userMessage,
  //           userId,
  //           status: GenerationStatus.COMPLETED,
  //         },
  //       });

  //       await prisma.user.update({
  //         where: {
  //           id: userId,
  //         },
  //         data: {
  //           aiChatbot: {
  //             decrement: 1,
  //           },
  //         },
  //       });
  //     } catch (dbError) {
  //       console.error("[Background DB Error - AI Chatbot]:", dbError);
  //     }
  //   })();
  // });

  return responseText;
};

export const AiChatBot = {
  ChatbotService,
};
