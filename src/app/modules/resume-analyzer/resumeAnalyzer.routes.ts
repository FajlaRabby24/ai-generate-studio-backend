import { Router } from "express";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";
import { ResumeAnalyzer } from "./resumeAnalyzer.controller";
import { ResumeAnalyzerValidation } from "./resumeAnalyzer.zod";

const router = Router();

router.post(
  "/",
  multerUpload.single("single-pdf"),
  validateRequest(ResumeAnalyzerValidation.analyzeValidationSchema),
  ResumeAnalyzer.resumeAnalyzer,
);

export const ResumeAnalyzerRoutes = router;
