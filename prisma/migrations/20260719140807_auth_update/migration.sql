/*
  Warnings:

  - The values [IMAGE_TO_IMAGE] on the enum `GenerationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `errorMsg` on the `generations` table. All the data in the column will be lost.
  - You are about to drop the column `fetchUrl` on the `generations` table. All the data in the column will be lost.
  - You are about to drop the column `inputUrl` on the `generations` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `generations` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `generations` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GenerationType_new" AS ENUM ('TEXT_TO_IMAGE', 'AI_CHATBOT', 'CODE_CHECKER', 'IMAGE_BACKGROUND_REMOVER', 'IMAGE_CAPTION_GENERATOR', 'RESUME_ANALYZER', 'LANGUAGE_TRANSLATOR', 'GRAMMER_IMPROVER', 'TEXT_TO_SPEECH', 'SPEECH_TO_TEXT', 'IMAGE_TO_VIDEO', 'TEXT_TO_VIDEO');
ALTER TABLE "generations" ALTER COLUMN "type" TYPE "GenerationType_new" USING ("type"::text::"GenerationType_new");
ALTER TYPE "GenerationType" RENAME TO "GenerationType_old";
ALTER TYPE "GenerationType_new" RENAME TO "GenerationType";
DROP TYPE "public"."GenerationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "generations" DROP COLUMN "errorMsg",
DROP COLUMN "fetchUrl",
DROP COLUMN "inputUrl",
DROP COLUMN "model",
DROP COLUMN "settings",
ADD COLUMN     "projectId" TEXT,
ALTER COLUMN "outputUrls" SET NOT NULL,
ALTER COLUMN "outputUrls" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "aiChatbot" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "codeChecker" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "grammarChecker" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "imageBackgroundRemover" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "imageCaptionGenerator" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "imageToVideo" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "languageTranslator" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "resumeAnalyzer" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "speechToText" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "textToImage" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "textToSpeech" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "textToVideo" INTEGER NOT NULL DEFAULT 3;
