import type { Request, Response } from "express";
import status from "http-status";
import { PDFParse } from "pdf-parse";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ResumeAnalyzerService } from "./resumeAnalyzer.service";

const resumeAnalyzer = catchAsync(async (req: Request, res: Response) => {
  const pdfBuffer = req.file?.buffer;
  //   const userId = req.user?.id;
  const { prompt } = req.body;

  if (!pdfBuffer) {
    return sendResponse(
      res,
      status.BAD_REQUEST,
      false,
      "No PDF file uploaded.",
    );
  }

  //   if (!userId) {
  //     return sendResponse(
  //       res,
  //       status.UNAUTHORIZED,
  //       false,
  //       "Authorization token is required.",
  //     );
  //   }

  const parser = new PDFParse({ data: pdfBuffer });
  const parseResult = (await parser.getText()).text;

  const result = await ResumeAnalyzerService.analyzeResume(
    // userId,
    parseResult,
    prompt,
  );

  sendResponse(res, status.OK, true, "Resume analyzed successfully", result);
});

export const ResumeAnalyzer = {
  resumeAnalyzer,
};
