import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import status from "http-status";
import PDFDocument from "pdfkit";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { AppError } from "../../errors/AppError";
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
        await prisma.$transaction(async (tx) => {
          const generated = await tx.generated.create({
            data: {
              userId,
              type: GenerationType.RESUME_ANALYZER,
            },
          });

          await tx.aIChat.create({
            data: {
              generatedId: generated.id,
              status: GenerationStatus.COMPLETED,
              chatHistory: [],
            },
          });

          await tx.user.update({
            where: { id: userId },
            data: {
              resumeAnalyzer: {
                decrement: 1,
              },
            },
          });
        });
      } catch (dbError) {
        console.error("[Background DB Error - Resume Analyzer]:", dbError);
        throw new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to process resume analysis database update.",
        );
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
    You are a professional Resume writer and ATS reviewer. 
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
  let analyzerId = "";

  try {
    await prisma.$transaction(async (tx) => {
      const generated = await tx.generated.create({
        data: {
          userId,
          type: GenerationType.RESUME_ANALYZER,
        },
      });

      const resumeRecord = await tx.resumeAnalyzer.create({
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

      analyzerId = resumeRecord.id;

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
    throw new Error(`[Database Error - Resume Analyzer Groq]: ${dbError}`);
  }

  return {
    analyzerId,
    ...result,
  };
};

export const buildResumePdf = (resumeData: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      // Modern Clean Margins & Modern Page Boundaries
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const p = resumeData?.personalInfo || {};

      // 🎨 Modern Color Palette
      const PRIMARY_COLOR = "#0F172A"; // Dark Slate
      const SECONDARY_COLOR = "#334155"; // Muted Slate
      const TEXT_COLOR = "#1E293B"; // Dark Neutral Text
      const LINK_COLOR = "#2563EB"; // Accent Blue
      const LINE_COLOR = "#E2E8F0"; // Subtle Divider Gray

      const PAGE_WIDTH = 515; // 595.28 (A4 Width) - 80 (Margins)
      const LEFT_MARGIN = 40;

      // -------------------------------------------------------------
      // 1. HEADER SECTION
      // -------------------------------------------------------------
      if (p.fullName) {
        doc
          .fillColor(PRIMARY_COLOR)
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(p.fullName, LEFT_MARGIN, 40, { align: "left" });
      }

      // Job Title / Subheading
      if (p.title || p.jobTitle) {
        doc.moveDown(0.15);
        doc
          .fillColor(SECONDARY_COLOR)
          .fontSize(13)
          .font("Helvetica-Bold")
          .text(p.title || p.jobTitle);
      }

      // Contact & Links (Single Line with Inline Hyperlinks)
      const contactItems = [];
      if (p.location) contactItems.push(p.location);
      if (p.email) contactItems.push(p.email);
      if (p.phone) contactItems.push(p.phone);

      doc.moveDown(0.3);
      doc.fontSize(9.5).font("Helvetica").fillColor(TEXT_COLOR);

      if (contactItems.length > 0) {
        doc.text(contactItems.join("  |  "));
      }

      // Social Links (Clickable)
      const links = [];
      if (p.portfolio) links.push({ label: "Portfolio", url: p.portfolio });
      if (p.github) links.push({ label: "GitHub", url: p.github });
      if (p.linkedin) links.push({ label: "LinkedIn", url: p.linkedin });

      if (links.length > 0) {
        doc.moveDown(0.15);
        let currentX = LEFT_MARGIN;

        links.forEach((link, idx) => {
          doc.fillColor(LINK_COLOR).text(link.label, currentX, doc.y, {
            link: link.url,
            underline: true,
            continued: idx < links.length - 1,
          });

          if (idx < links.length - 1) {
            currentX = doc.x;
            doc.fillColor(TEXT_COLOR).text("  |  ", { continued: true });
          }
        });
      }

      doc.moveDown(1.2);

      // Helper: Modern Section Header Generator
      const createSectionHeader = (title: string) => {
        doc.moveDown(0.4);
        doc
          .fillColor(PRIMARY_COLOR)
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(title.toUpperCase());

        doc
          .strokeColor(LINE_COLOR)
          .lineWidth(1)
          .moveTo(LEFT_MARGIN, doc.y + 2)
          .lineTo(LEFT_MARGIN + PAGE_WIDTH, doc.y + 2)
          .stroke();

        doc.moveDown(0.5);
      };

      // -------------------------------------------------------------
      // 2. PROFESSIONAL SUMMARY / OBJECTIVE
      // -------------------------------------------------------------
      if (p.summary) {
        createSectionHeader("Objective");
        doc
          .fillColor(TEXT_COLOR)
          .fontSize(9.5)
          .font("Helvetica")
          .text(p.summary, { align: "justify", lineGap: 3 });
      }

      // -------------------------------------------------------------
      // 3. SKILLS SECTION
      // -------------------------------------------------------------
      const s = resumeData?.skills || {};
      const hasTechnical = s.technical && s.technical.length > 0;
      const hasFrontend = s.frontend && s.frontend.length > 0;
      const hasBackend = s.backend && s.backend.length > 0;
      const hasDatabase = s.database && s.database.length > 0;
      const hasTools = s.tools && s.tools.length > 0;
      const hasSoft = s.soft && s.soft.length > 0;

      if (
        hasTechnical ||
        hasFrontend ||
        hasBackend ||
        hasDatabase ||
        hasTools ||
        hasSoft
      ) {
        createSectionHeader("Skills");

        const renderSkillLine = (label: string, items: string[]) => {
          if (!items || items.length === 0) return;
          doc
            .fillColor(PRIMARY_COLOR)
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .text(`${label}: `, { continued: true })
            .fillColor(TEXT_COLOR)
            .font("Helvetica")
            .text(items.join(", "), { lineGap: 2 });
        };

        if (hasFrontend) renderSkillLine("Frontend", s.frontend);
        if (hasBackend) renderSkillLine("Backend", s.backend);
        if (hasDatabase) renderSkillLine("Database", s.database);
        if (hasTechnical) renderSkillLine("Technical", s.technical);
        if (hasTools) renderSkillLine("Tools", s.tools);
        if (hasSoft) renderSkillLine("Soft Skills", s.soft);
      }

      // -------------------------------------------------------------
      // 4. PROFESSIONAL EXPERIENCE
      // -------------------------------------------------------------
      const exp = resumeData?.experience || [];
      if (exp.length > 0) {
        createSectionHeader("Experience");

        exp.forEach((job: any) => {
          const startY = doc.y;

          // Left: Job Title & Company
          doc
            .fillColor(PRIMARY_COLOR)
            .fontSize(10.5)
            .font("Helvetica-Bold")
            .text(job.title || "", LEFT_MARGIN, startY, { continued: true })
            .fillColor(SECONDARY_COLOR)
            .font("Helvetica")
            .text(job.company ? `  —  ${job.company}` : "");

          // Right: Duration (Same Line)
          if (job.duration) {
            doc
              .fillColor(SECONDARY_COLOR)
              .fontSize(9)
              .font("Helvetica-Oblique")
              .text(job.duration, LEFT_MARGIN, startY, {
                align: "right",
                width: PAGE_WIDTH,
              });
          }

          doc.moveDown(0.3);

          // Bullet Points
          const bulletPoints = job.bulletPoints || [];
          bulletPoints.forEach((point: string) => {
            doc
              .fillColor(TEXT_COLOR)
              .fontSize(9.5)
              .font("Helvetica")
              .text(`•   ${point}`, LEFT_MARGIN + 10, doc.y, {
                width: PAGE_WIDTH - 10,
                align: "justify",
                lineGap: 2.5,
              });
          });

          doc.moveDown(0.6);
        });
      }

      // -------------------------------------------------------------
      // 5. PROJECTS SECTION
      // -------------------------------------------------------------
      const proj = resumeData?.projects || [];
      if (proj.length > 0) {
        createSectionHeader("Projects");

        proj.forEach((project: any) => {
          const startY = doc.y;

          // Project Title
          doc
            .fillColor(PRIMARY_COLOR)
            .fontSize(10.5)
            .font("Helvetica-Bold")
            .text(project.name || "", LEFT_MARGIN, startY, { continued: true });

          // Clickable Links Right-Aligned
          if (project.liveUrl || project.githubUrl) {
            let linksText = "";
            if (project.liveUrl) linksText += "Live Link";
            if (project.liveUrl && project.githubUrl) linksText += "  |  ";
            if (project.githubUrl) linksText += "GitHub";

            doc
              .fillColor(LINK_COLOR)
              .fontSize(9)
              .font("Helvetica")
              .text(linksText, LEFT_MARGIN, startY, {
                align: "right",
                width: PAGE_WIDTH,
              });
          } else {
            doc.text(""); // Clear continued flag
          }

          doc.moveDown(0.3);

          // Project Description / Bullet Points
          if (project.description) {
            doc
              .fillColor(TEXT_COLOR)
              .fontSize(9.5)
              .font("Helvetica")
              .text(project.description, LEFT_MARGIN, doc.y, {
                align: "justify",
                lineGap: 2.5,
              });
          }

          if (project.bulletPoints && project.bulletPoints.length > 0) {
            project.bulletPoints.forEach((point: string) => {
              doc
                .fillColor(TEXT_COLOR)
                .fontSize(9.5)
                .font("Helvetica")
                .text(`•   ${point}`, LEFT_MARGIN + 10, doc.y, {
                  width: PAGE_WIDTH - 10,
                  lineGap: 2,
                });
            });
          }

          if (project.technologies && project.technologies.length > 0) {
            doc.moveDown(0.15);
            doc
              .fillColor(SECONDARY_COLOR)
              .fontSize(8.5)
              .font("Helvetica-Bold")
              .text("Technologies: ", LEFT_MARGIN, doc.y, { continued: true })
              .font("Helvetica")
              .text(project.technologies.join(", "));
          }

          doc.moveDown(0.6);
        });
      }

      // -------------------------------------------------------------
      // 6. EDUCATION SECTION
      // -------------------------------------------------------------
      const edu = resumeData?.education || [];
      if (edu.length > 0) {
        createSectionHeader("Education");

        edu.forEach((school: any) => {
          const startY = doc.y;

          doc
            .fillColor(PRIMARY_COLOR)
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .text(school.degree || "", LEFT_MARGIN, startY, { continued: true })
            .fillColor(TEXT_COLOR)
            .font("Helvetica")
            .text(school.institution ? `, ${school.institution}` : "");

          if (school.year) {
            doc
              .fillColor(SECONDARY_COLOR)
              .fontSize(9)
              .font("Helvetica-Oblique")
              .text(school.year, LEFT_MARGIN, startY, {
                align: "right",
                width: PAGE_WIDTH,
              });
          }
          doc.moveDown(0.4);
        });
      }

      // -------------------------------------------------------------
      // 7. CERTIFICATES / LANGUAGES (OPTIONAL)
      // -------------------------------------------------------------
      const certs = resumeData?.certificates || [];
      if (certs.length > 0) {
        createSectionHeader("Certifications & Achievements");
        certs.forEach((cert: any) => {
          const title =
            typeof cert === "string" ? cert : cert.name || cert.title;
          doc
            .fillColor(TEXT_COLOR)
            .fontSize(9.5)
            .font("Helvetica")
            .text(`•   ${title}`, LEFT_MARGIN + 10, doc.y, { lineGap: 2 });
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const generateResumePdfFromEditedJson = async (
  name: string,
  analyzerId: string,
  editedResumeJson: any,
) => {
  // 1. Locate the resume analyzer database record
  const analyzerRecord = await prisma.resumeAnalyzer.findUnique({
    where: { id: analyzerId },
    select: {
      id: true,
    },
  });

  if (!analyzerRecord) {
    throw new Error(`ResumeAnalyzer record with ID: ${analyzerId} not found.`);
  }

  // 2. Generate PDF Kit document buffer
  const pdfBuffer = await buildResumePdf(editedResumeJson);
  // const pdfBuffer = await generatePdf(PDFTemplates.MODERN, editedResumeJson);

  // 3. Upload PDF file stream to Cloudinary
  const pdfUrl = await PDFUploadToCloudinary(pdfBuffer, name);

  setImmediate(() => {
    (async () => {
      // 4. Save final edited JSON and Cloudinary URL in DB
      await prisma.resumeAnalyzer.update({
        where: { id: analyzerId },
        data: {
          updatedResumeJson: editedResumeJson,
          generatedPdfUrl: pdfUrl,
          isGenerateResume: true,
          status: GenerationStatus.COMPLETED,
        },
      });
    })();
  });

  return {
    pdfUrl: pdfUrl,
  };
};

const getRecentGeneration = async (userId: string) => {
  const generations = await prisma.generated.findMany({
    where: {
      userId,
      type: GenerationType.RESUME_ANALYZER,
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    include: {
      resumeAnalyzers: true,
    },
  });

  return generations;
};

export const ResumeAnalyzerService = {
  analyzeResume,
  analyzeResumeWithGroq,
  generateResumePdfFromEditedJson,
  getRecentGeneration,
};
