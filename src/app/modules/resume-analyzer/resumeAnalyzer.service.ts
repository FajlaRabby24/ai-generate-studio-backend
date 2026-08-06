import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import PDFDocument from "pdfkit";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { PDFUploadToCloudinary } from "../../utils/cloudinary/pdfUpload";

const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });
const groq = new Groq({ apiKey: envVars.GROQ_API_KEY_RESUME_ANALYZER });

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
        prisma.$transaction(async (tx) => {
          const generated = await tx.generated.create({
            data: {
              userId,
              type: GenerationType.RESUME_ANALYZER,
            },
          });

          await tx.resumeAnalyzer.create({
            data: {
              generatedId: generated.id,
              atsScore: Number(result.atsScore) || 0,
              summary: result.summary || "",
              strengths: result.strengths || [],
              weaknesses: result.weaknesses || [],
              missingKeywords: result.missingKeywords || [],
              actionableSuggestions: result.actionableSuggestions || [],
              updatedResumeJson: result.updatedResume || null,
              isGenerateResume,
              status: GenerationStatus.COMPLETED,
            },
          });

          await tx.user.update({
            where: { id: userId },
            data: {
              resumeAnalyzerLastRefreshAT: new Date(),
              resumeAnalyzer: {
                decrement: 1,
              },
            },
          });
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

const buildResumePdf = (resumeData: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const p = resumeData?.personalInfo || {};

      // --- Header ---
      if (p.fullName) {
        doc
          .fontSize(22)
          .font("Helvetica-Bold")
          .text(p.fullName, { align: "center" });
      }

      const contactInfo = [
        p.email,
        p.phone,
        p.linkedin ? `LinkedIn: ${p.linkedin}` : null,
        p.github ? `GitHub: ${p.github}` : null,
      ]
        .filter(Boolean)
        .join("  |  ");

      if (contactInfo) {
        doc.moveDown(0.3);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(contactInfo, { align: "center" });
      }

      doc.moveDown(1);

      // --- Summary ---
      if (p.summary) {
        doc.fontSize(12).font("Helvetica-Bold").text("PROFESSIONAL SUMMARY");
        doc
          .strokeColor("#cccccc")
          .lineWidth(1)
          .moveTo(40, doc.y)
          .lineTo(555, doc.y)
          .stroke();
        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(p.summary, { align: "justify" });
        doc.moveDown(1.2);
      }

      // --- Skills ---
      const s = resumeData?.skills || {};
      const hasTechnical = s.technical && s.technical.length > 0;
      const hasSoft = s.soft && s.soft.length > 0;
      if (hasTechnical || hasSoft) {
        doc.fontSize(12).font("Helvetica-Bold").text("TECHNICAL & SOFT SKILLS");
        doc
          .strokeColor("#cccccc")
          .lineWidth(1)
          .moveTo(40, doc.y)
          .lineTo(555, doc.y)
          .stroke();
        doc.moveDown(0.5);

        if (hasTechnical) {
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("Technical Skills: ", { continued: true })
            .font("Helvetica")
            .text(s.technical.join(", "));
        }
        if (hasSoft) {
          doc.moveDown(0.2);
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("Soft Skills: ", { continued: true })
            .font("Helvetica")
            .text(s.soft.join(", "));
        }
        doc.moveDown(1.2);
      }

      // --- Experience ---
      const exp = resumeData?.experience || [];
      if (exp.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("PROFESSIONAL EXPERIENCE");
        doc
          .strokeColor("#cccccc")
          .lineWidth(1)
          .moveTo(40, doc.y)
          .lineTo(555, doc.y)
          .stroke();
        doc.moveDown(0.5);

        exp.forEach((job: any) => {
          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(job.title || "", { continued: true })
            .font("Helvetica")
            .text(` at ${job.company || ""}`, { align: "left" });
          if (job.duration) {
            doc
              .fontSize(9)
              .font("Helvetica-Oblique")
              .text(job.duration, { align: "right" });
          }

          doc.moveDown(0.3);
          const bulletPoints = job.bulletPoints || [];
          bulletPoints.forEach((point: string) => {
            doc
              .fontSize(10)
              .font("Helvetica")
              .text(`• ${point}`, { indent: 10, align: "justify" });
          });
          doc.moveDown(0.8);
        });
        doc.moveDown(0.4);
      }

      // --- Projects ---
      const proj = resumeData?.projects || [];
      if (proj.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("PROJECTS");
        doc
          .strokeColor("#cccccc")
          .lineWidth(1)
          .moveTo(40, doc.y)
          .lineTo(555, doc.y)
          .stroke();
        doc.moveDown(0.5);

        proj.forEach((project: any) => {
          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(project.name || "");

          const projLinks = [
            project.liveUrl ? `Live: ${project.liveUrl}` : null,
            project.githubUrl ? `GitHub: ${project.githubUrl}` : null,
          ]
            .filter(Boolean)
            .join("  |  ");

          if (projLinks) {
            doc
              .fontSize(9)
              .font("Helvetica-Oblique")
              .text(projLinks, { align: "right" });
          }

          doc.moveDown(0.2);
          if (project.description) {
            doc
              .fontSize(10)
              .font("Helvetica")
              .text(project.description, { align: "justify" });
          }

          if (project.technologies && project.technologies.length > 0) {
            doc.moveDown(0.2);
            doc
              .fontSize(9)
              .font("Helvetica-Bold")
              .text("Technologies: ", { continued: true })
              .font("Helvetica")
              .text(project.technologies.join(", "));
          }
          doc.moveDown(0.8);
        });
        doc.moveDown(0.4);
      }

      // --- Education ---
      const edu = resumeData?.education || [];
      if (edu.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("EDUCATION");
        doc
          .strokeColor("#cccccc")
          .lineWidth(1)
          .moveTo(40, doc.y)
          .lineTo(555, doc.y)
          .stroke();
        doc.moveDown(0.5);

        edu.forEach((school: any) => {
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(school.degree || "", { continued: true })
            .font("Helvetica")
            .text(` — ${school.institution || ""}`);
          if (school.year) {
            doc
              .fontSize(9)
              .font("Helvetica-Oblique")
              .text(school.year, { align: "right" });
          }
          doc.moveDown(0.5);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const generateResumePdfFromEditedJson = async (
  analyzerId: string,
  editedResumeJson: any,
) => {
  // 1. Locate the resume analyzer database record
  const analyzerRecord = await prisma.resumeAnalyzer.findUnique({
    where: { id: analyzerId },
  });

  if (!analyzerRecord) {
    throw new Error(`ResumeAnalyzer record with ID: ${analyzerId} not found.`);
  }

  // 2. Generate PDF Kit document buffer
  const pdfBuffer = await buildResumePdf(editedResumeJson);

  // 3. Upload PDF file stream to Cloudinary
  const pdfUrl = await PDFUploadToCloudinary(pdfBuffer);

  // 4. Save final edited JSON and Cloudinary URL in DB
  const updatedRecord = await prisma.resumeAnalyzer.update({
    where: { id: analyzerId },
    data: {
      updatedResumeJson: editedResumeJson,
      generatedPdfUrl: pdfUrl,
      isGenerateResume: true,
      status: GenerationStatus.COMPLETED,
    },
  });

  return {
    pdfUrl: pdfUrl,
    updatedRecord,
  };
};

export const ResumeAnalyzerService = {
  analyzeResume,
  analyzeResumeWithGroq,
  generateResumePdfFromEditedJson,
};
