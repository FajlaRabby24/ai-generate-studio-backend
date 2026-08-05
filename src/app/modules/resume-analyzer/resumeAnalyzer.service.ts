import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";

const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });
const groq = new Groq({ apiKey: envVars.GROQ_API_KEY });

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
        const generated = await prisma.generated.create({
          data: {
            userId,
            type: GenerationType.RESUME_ANALYZER,
          },
        });

        await prisma.aIChat.create({
          data: {
            generatedId: generated.id,
            status: GenerationStatus.COMPLETED,
            input: prompt || "Resume analysis",
            output: analysisResult,
            chatHistory: [],
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

export const analyzeResumeWithGroq = async (
  userId: string,
  resumeText: string,
  prompt?: string,
  isGenerateResume: boolean = false,
) => {
  // ১. isGenerateResume-এর মান অনুযায়ী ডাইনামিক সিস্টেম ইনস্ট্রাকশন সেট করা
  const analysisInstruction = `
    You are an expert ATS reviewer. Analyze the resume text and return a STRICT JSON response:
    {
      "atsScore": number (strictly between 0 and 100),
      "summary": "Short professional summary",
      "strengths": ["array of strong points"],
      "weaknesses": ["array of areas that need improvement"],
      "missingKeywords": ["array of missing industry keywords"],
      "actionableSuggestions": ["array of step-by-step suggestions"]
    }
  `;

  const generationInstruction = `
    You are a professional CV writer and ATS reviewer. 
    Analyze the resume, provide evaluation metrics AND generate a fully improved and restructured resume dataset.
    
    Return a STRICT JSON response matching this exact structure:
    {
      "atsScore": number (strictly between 0 and 100),
      "summary": "Short evaluation summary",
      "strengths": ["array of strong points"],
      "weaknesses": ["array of weak points"],
      "missingKeywords": ["array of missing keywords"],
      "actionableSuggestions": ["array of suggestions"],
      "updatedResume": {
        "personalInfo": {
          "fullName": "Name",
          "email": "Email",
          "phone": "Phone",
          "linkedin": "LinkedIn URL",
          "github": "GitHub URL",
          "summary": "Improved professional summary"
        },
        "skills": {
          "technical": ["Skill 1", "Skill 2"],
          "soft": ["Skill 1"]
        },
        "experience": [
          {
            "title": "Role Title",
            "company": "Company Name",
            "duration": "Duration",
            "bulletPoints": ["Quantified action-driven point 1", "Point 2"]
          }
        ],
        "projects": [
          {
            "name": "Project Name",
            "description": "Project summary",
            "technologies": ["Tech 1", "Tech 2"],
            "liveUrl": "URL",
            "githubUrl": "URL"
          }
        ],
        "education": [
          {
            "degree": "Degree",
            "institution": "University/College",
            "year": "Passing Year"
          }
        ]
      }
    }
  `;

  // ২. ফ্ল্যাগ অনুযায়ী ইনস্ট্রাকশন নির্বাচন
  const selectedInstruction = isGenerateResume
    ? generationInstruction
    : analysisInstruction;

  const finalSystemMessage = `${selectedInstruction}\n\n${
    prompt ? `Additional User Instructions: ${prompt}` : ""
  }`;

  // ৩. Groq API কল করা
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: finalSystemMessage },
      { role: "user", content: `Resume Text:\n${resumeText}` },
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
  });

  const content = chatCompletion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to process resume response from Groq API.");
  }

  const result = JSON.parse(content);

  // ৪. ডাটাবেজ আপডেট বা সেভ লজিক (প্রয়োজন অনুযায়ী)
  setImmediate(() => {
    (async () => {
      try {
        const generated = await prisma.generated.create({
          data: {
            userId,
            type: GenerationType.RESUME_ANALYZER,
          },
        });

        await prisma.aIChat.create({
          data: {
            generatedId: generated.id,
            status: GenerationStatus.COMPLETED,
            input: prompt || "Resume analysis with Groq",
            output: content,
            chatHistory: [],
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            resumeAnalyzerLastRefreshAT: new Date(),
            resumeAnalyzer: {
              decrement: 1,
            },
          },
        });
      } catch (dbError) {
        throw new Error(
          `[Background DB Error - Resume Analyzer Groq]: ${dbError}`,
        );
      }
    })();
  });

  return result;
};

export const ResumeAnalyzerService = {
  analyzeResume,
  analyzeResumeWithGroq,
};
