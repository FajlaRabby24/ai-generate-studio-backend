/*
  Warnings:

  - The values [FREE] on the enum `SubscriptionPlan` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lastCreditRefreshAt` on the `user` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('MONTHLY', 'YEARLY');
ALTER TABLE "pricing_plan" ALTER COLUMN "plan" TYPE "SubscriptionPlan_new" USING ("plan"::text::"SubscriptionPlan_new");
ALTER TABLE "subscription" ALTER COLUMN "plan" TYPE "SubscriptionPlan_new" USING ("plan"::text::"SubscriptionPlan_new");
ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";
DROP TYPE "public"."SubscriptionPlan_old";
COMMIT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "lastCreditRefreshAt",
ADD COLUMN     "aiChatbotLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "codeCheckerLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "grammarCheckerLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageBackgroundRemoverLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageCaptionGeneratorLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageToVideoLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "languageTranslatorLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resumeAnalyzerLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "speechToTextLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "textToImageLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "textToSpeechLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "textToVideoLastRefreshAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
