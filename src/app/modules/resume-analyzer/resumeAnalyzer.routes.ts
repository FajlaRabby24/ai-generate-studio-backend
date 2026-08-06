import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ResumeAnalyzer } from "./resumeAnalyzer.controller";
import { ResumeAnalyzerValidation } from "./resumeAnalyzer.zod";

const router = Router();

// router.post(
//   "/",
//   multerUpload.single("single-pdf"),
//   validateRequest(ResumeAnalyzerValidation.analyzeValidationSchema),
//   ResumeAnalyzer.resumeAnalyzer,
// );

router.post(
  "/",
  multerUpload.single("single-pdf"),
  validateRequest(ResumeAnalyzerValidation.analyzeValidationSchema),
  checkAuth(),
  checkGenerateAuth(GenerationType.RESUME_ANALYZER),
  ResumeAnalyzer.analyzeResumeWithGroqController,
);

router.post(
  "/generate-pdf",
  validateRequest(ResumeAnalyzerValidation.generatePdfValidationSchema),
  checkAuth(),
  ResumeAnalyzer.generateResumePdfController,
);

export const ResumeAnalyzerRoutes = router;
