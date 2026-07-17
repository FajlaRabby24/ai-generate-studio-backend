import { GoogleGenAI } from "@google/genai";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";

const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });

const analyzeResume = async (
  userId: string,
  resumeText: string,
  prompt?: string,
) => {
  const systemInstruction =
    "You are an expert ATS (Applicant Tracking System) and resume analyzer and career coach. Review the provided resume text thoroughly. Focus on formatting, experience clarity, spelling/grammar, impact of key phrases, and suggest improvements. If specific instructions or prompt are provided by the user, prioritize addressing them.";

  const finalPrompt = `${systemInstruction}\n\nResume Content:\n${resumeText}\n\n${
    prompt ? `User Specific Instructions: ${prompt}` : ""
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: finalPrompt,
    config: { responseMimeType: "application/json" },
  });

  const analysisResult = response.text || "";

  // Perform background DB updates to store history and decrement quota
  setImmediate(() => {
    (async () => {
      try {
        await prisma.generation.create({
          data: {
            outputUrls: analysisResult,
            type: GenerationType.RESUME_ANALYZER,
            prompt: prompt || "Resume analysis",
            userId,
            status: GenerationStatus.COMPLETED,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            resumeAnalyzer: {
              decrement: 1,
            },
          },
        });
      } catch (dbError) {
        console.error("[Background DB Error - Resume Analyzer]:", dbError);
      }
    })();
  });

  return analysisResult;
};

export const ResumeAnalyzerService = {
  analyzeResume,
};
