-- CreateTable
CREATE TABLE "text_to_speech" (
    "id" TEXT NOT NULL,
    "generatedId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "text_to_speech_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "text_to_speech_generatedId_idx" ON "text_to_speech"("generatedId");

-- AddForeignKey
ALTER TABLE "text_to_speech" ADD CONSTRAINT "text_to_speech_generatedId_fkey" FOREIGN KEY ("generatedId") REFERENCES "generated"("id") ON DELETE CASCADE ON UPDATE CASCADE;
