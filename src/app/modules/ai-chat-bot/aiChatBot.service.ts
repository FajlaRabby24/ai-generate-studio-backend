import { GoogleGenAI } from "@google/genai";
import type { Response } from "express";
import Groq from "groq-sdk";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";

const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });

// const ChatbotService = async (
//   userId: string,
//   userMessage: string,
//   chatHistory: any[],
// ) => {
//   const chat = ai.chats.create({
//     model: "gemini-3.6-flash",
//     history: chatHistory,
//   });

//   const response = await chat.sendMessage({ message: userMessage});
//   const responseText = response.text || "";

//   // Perform background DB updates to store history and decrement quota
//   setImmediate(() => {
//     (async () => {
//       try {
//         const generated = await prisma.generated.create({
//           data: {
//             userId,
//             type: GenerationType.AI_CHATBOT,
//           },
//         });

//         await prisma.aIChat.create({
//           data: {
//             generatedId: generated.id,
//             status: GenerationStatus.COMPLETED,
//             chatHistory: chatHistory.map((item) =>
//               typeof item === "object" ? JSON.stringify(item) : String(item),
//             ),
//           },
//         });

//         await prisma.user.update({
//           where: {
//             id: userId,
//           },
//           data: {
//             aiChatbotLastRefreshAT: new Date(),
//             aiChatbot: {
//               decrement: 1,
//             },
//           },
//         });
//       } catch (dbError) {
//         console.error("[Background DB Error - AI Chatbot]:", dbError);
//       }
//     })();
//   });

//   return {
//     response: responseText,
//   };
// };

const ChatbotService = async (
  userId: string,
  userMessage: string,
  conversationId: string | undefined, // * undefined means new conversation
) => {
  let aiChat = conversationId
    ? await prisma.aIChat.findUnique({
        where: {
          id: conversationId,
        },
        select: {
          id: true,
          chatHistory: true,
        },
      })
    : null;

  const previousHistory = (aiChat?.chatHistory as any[]) || [];

  const chat = ai.chats.create({
    model: "gemini-3.6-flash",
    history: previousHistory,
  });

  const response = await chat.sendMessage({ message: userMessage });
  const responseText = response.text || "";

  const newEntries = [
    { role: "user", parts: [{ text: userMessage }] },
    { role: "model", parts: [{ text: responseText }] },
  ];

  // Background DB updates
  setImmediate(() => {
    (async () => {
      try {
        if (aiChat) {
          // existing conversation — শুধু push করুন
          await prisma.aIChat.update({
            where: { id: aiChat.id },
            data: {
              chatHistory: { push: newEntries },
            },
          });
        } else {
          // নতুন conversation — একবারই create করুন
          const generated = await prisma.generated.create({
            data: {
              userId,
              type: GenerationType.AI_CHATBOT,
            },
          });

          aiChat = await prisma.aIChat.create({
            data: {
              generatedId: generated.id,
              status: GenerationStatus.COMPLETED,
              chatHistory: newEntries,
            },
          });
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            aiChatbotLastRefreshAT: new Date(),
            aiChatbot: { decrement: 1 },
          },
        });
      } catch (dbError) {
        console.error("[Background DB Error - AI Chatbot]:", dbError);
      }
    })();
  });

  return {
    response: responseText,
    conversationId: aiChat?.id, // client পরের রিকোয়েস্টে এটা পাঠাবে
  };
};

const groq = new Groq({ apiKey: envVars.GROQ_API_KEY });

export const StreamChatbotService = async (
  res: Response,
  userId: string,
  userMessage: string,
  conversationId?: string | undefined,
) => {
  let aiChat = conversationId
    ? await prisma.aIChat.findUnique({
        where: { id: conversationId },
        select: { id: true, chatHistory: true },
      })
    : null;

  const previousHistory = (aiChat?.chatHistory as any[]) || [];

  // ১. Groq-এর মেসেজ ফরম্যাটে ফিল্টারিং
  const formattedHistory = previousHistory.map((item) => ({
    role: item.role === "model" ? "assistant" : item.role,
    content: item.parts?.[0]?.text || item.content || "",
  }));

  const messages = [
    {
      role: "system",
      content: "You are an intelligent, helpful AI Chatbot.",
    },
    ...formattedHistory,
    { role: "user", content: userMessage },
  ];

  // 🎯 ২. SSE (Server-Sent Events) Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 🎯 ৩. Groq Streaming Call
  const completionStream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages as any,
    stream: true,
  });

  let fullAiResponse = "";

  // 🎯 ৪. ফ্রন্টএন্ডে প্রতিটি টোকেন/চাংক রিয়েল-টাইমে পাঠানো
  for await (const chunk of completionStream) {
    const chunkText = chunk.choices[0]?.delta?.content || "";
    if (chunkText) {
      fullAiResponse += chunkText;
      res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
    }
  }

  // 🎯 ৫. নতুন কনভার্সেশন হলে ডাটাবেজে ক্রিয়েট করে আসল conversationId বের করা
  let activeConversationId = aiChat?.id;

  if (!activeConversationId) {
    // নতুন কনভার্সেশনের জন্য 'Generated' এন্ট্রি তৈরি
    const generated = await prisma.generated.create({
      data: {
        userId,
        type: GenerationType.AI_CHATBOT,
      },
    });

    // ইউজারের প্রথম মেসেজের ১০-১৫ ক্যারেক্টার দিয়ে অটো টাইটেল সেট করা (Optional)
    const chatTitle =
      userMessage.slice(0, 30) + (userMessage.length > 30 ? "..." : "");

    // নতুন 'AIChat' ক্রিয়েট
    const newChat = await prisma.aIChat.create({
      data: {
        title: chatTitle,
        generatedId: generated.id,
        status: GenerationStatus.COMPLETED,
        chatHistory: [],
      },
    });

    activeConversationId = newChat.id;
  }

  // 🎯 ৬. ক্লায়েন্টকে স্ট্রিম শেষ হওয়ার সিগন্যাল ও conversationId পাঠানো
  res.write(
    `data: ${JSON.stringify({
      done: true,
      conversationId: activeConversationId,
    })}\n\n`,
  );
  res.end();

  // 🎯 ৭. ব্যাকগ্রাউন্ডে ডাটাবেজ আপডেট এবং ইউজার ক্রেডিট ডিডাকশন
  setImmediate(async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const newEntries = [
          { role: "user", parts: [{ text: userMessage }] },
          { role: "model", parts: [{ text: fullAiResponse }] },
        ];

        // ডাটাবেজের 'chatHistory' ফিল্ডে নতুন মেসেজ পুশ করা
        await tx.aIChat.update({
          where: { id: activeConversationId },
          data: {
            chatHistory: {
              push: newEntries,
            },
          },
        });

        // ইউজারের চ্যাটবট ব্যবহারের ক্রেডিট ১ কমিয়ে দেওয়া
        await tx.user.update({
          where: { id: userId },
          data: {
            aiChatbotLastRefreshAT: new Date(),
            aiChatbot: { decrement: 1 },
          },
        });
      });
    } catch (dbError) {
      throw new Error(`[Background DB Error - AI Chatbot Groq]: ${dbError}`);
    }
  });
};

export const AiChatBot = {
  ChatbotService,
  StreamChatbotService,
};
