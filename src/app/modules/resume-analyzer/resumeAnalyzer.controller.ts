import type { Request, Response } from "express";
import status from "http-status";
import { PDFParse } from "pdf-parse";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ResumeAnalyzerService } from "./resumeAnalyzer.service";

const resumeAnalyzer = catchAsync(async (req: Request, res: Response) => {
  const pdfBuffer = req.file?.buffer;
  const userId = req.user?.id;
  const { prompt } = req.body;

  if (!pdfBuffer) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "No PDF file uploaded.",
    );
  }

  if (!userId) {
    return sendResponse(
      res,
      status.UNAUTHORIZED,
      false,
      "Authorization token is required.",
    );
  }

  const parser = new PDFParse({ data: pdfBuffer });
  const parseResult = (await parser.getText()).text;

  const result = await ResumeAnalyzerService.analyzeResume(
    userId,
    parseResult,
    prompt,
  );

  sendResponse(res, status.OK, true, "Resume analyzed successfully", result);
});

const analyzeResumeWithGroqController = catchAsync(
  async (req: Request, res: Response) => {
    const pdfBuffer = req.file?.buffer;
    const userId = req.user?.id;
    const { prompt, isGenerateResume } = req.body;

    if (!pdfBuffer) {
      return sendResponse(
        res,
        status.BAD_REQUEST,
        false,
        "No PDF file uploaded.",
      );
    }

    if (!userId) {
      return sendResponse(
        res,
        status.UNAUTHORIZED,
        false,
        "Authorization token is required.",
      );
    }

    const parser = new PDFParse({ data: pdfBuffer });
    const parseResult = (await parser.getText()).text;

    const result = await ResumeAnalyzerService.analyzeResumeWithGroq(
      userId,
      parseResult,
      prompt,
      Boolean(isGenerateResume),
    );

    sendResponse(res, status.OK, true, "Resume analyzed successfully", result);
  },
);

const generateResumePdfController = catchAsync(
  async (req: Request, res: Response) => {
    const { name, analyzerId, editedResumeJson } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(
        res,
        status.UNAUTHORIZED,
        false,
        "Authorization token is required.",
      );
    }

    if (!analyzerId) {
      return sendResponse(
        res,
        status.BAD_REQUEST,
        false,
        "analyzerId is required.",
      );
    }

    if (!editedResumeJson) {
      return sendResponse(
        res,
        status.BAD_REQUEST,
        false,
        "editedResumeJson is required.",
      );
    }

    const result = await ResumeAnalyzerService.generateResumePdfFromEditedJson(
      name,
      analyzerId,
      editedResumeJson,
    );

    sendResponse(res, status.OK, true, "PDF generated successfully", result);
  },
);

const getRecentGeneration = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, status.UNAUTHORIZED, false, "Unauthorized", null);
  }

  const result = await ResumeAnalyzerService.getRecentGeneration(userId);

  sendResponse(
    res,
    status.OK,
    true,
    "Recent generations retrieved successfully",
    result,
  );
});

export const ResumeAnalyzer = {
  resumeAnalyzer,
  analyzeResumeWithGroqController,
  generateResumePdfController,
  getRecentGeneration,
};
