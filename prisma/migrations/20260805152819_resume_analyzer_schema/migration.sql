-- CreateTable
CREATE TABLE "resume_analyzers" (
    "id" TEXT NOT NULL,
    "generatedId" TEXT NOT NULL,
    "atsScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "missingKeywords" TEXT[],
    "actionableSuggestions" TEXT[],
    "updatedResumeJson" JSONB,
    "generatedPdfUrl" TEXT,
    "isGenerateResume" BOOLEAN NOT NULL DEFAULT false,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_analyzers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "resume_analyzers" ADD CONSTRAINT "resume_analyzers_generatedId_fkey" FOREIGN KEY ("generatedId") REFERENCES "generated"("id") ON DELETE CASCADE ON UPDATE CASCADE;
