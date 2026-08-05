/*
  Warnings:

  - You are about to drop the column `input` on the `ai_chat` table. All the data in the column will be lost.
  - You are about to drop the column `output` on the `ai_chat` table. All the data in the column will be lost.
  - The `chatHistory` column on the `ai_chat` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ai_chat" DROP COLUMN "input",
DROP COLUMN "output",
ADD COLUMN     "title" TEXT,
DROP COLUMN "chatHistory",
ADD COLUMN     "chatHistory" JSONB[];
