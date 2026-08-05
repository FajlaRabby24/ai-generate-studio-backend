/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `image_to_video` table. All the data in the column will be lost.
  - You are about to drop the column `outputUrls` on the `image_to_video` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `image_to_video` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `image_to_video` table. All the data in the column will be lost.
  - You are about to drop the `chat_history` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `generatedId` to the `image_to_video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outputUrl` to the `image_to_video` table without a default value. This is not possible if the table is not empty.
  - Made the column `imageUrl` on table `image_to_video` required. This step will fail if there are existing NULL values in that column.
  - Made the column `requestId` on table `image_to_video` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "chat_history" DROP CONSTRAINT "chat_history_userId_fkey";

-- DropForeignKey
ALTER TABLE "image_to_video" DROP CONSTRAINT "image_to_video_userId_fkey";

-- AlterTable
ALTER TABLE "image_to_video" DROP COLUMN "isDeleted",
DROP COLUMN "outputUrls",
DROP COLUMN "type",
DROP COLUMN "userId",
ADD COLUMN     "generatedId" TEXT NOT NULL,
ADD COLUMN     "outputUrl" TEXT NOT NULL,
ALTER COLUMN "imageUrl" SET NOT NULL,
ALTER COLUMN "requestId" SET NOT NULL;

-- DropTable
DROP TABLE "chat_history";

-- CreateTable
CREATE TABLE "ai_chat" (
    "id" TEXT NOT NULL,
    "generatedId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "chatHistory" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "text_to_image" (
    "id" TEXT NOT NULL,
    "generatedId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "outputUrl" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "text_to_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "text_to_video" (
    "id" TEXT NOT NULL,
    "generatedId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "outputUrl" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "text_to_video_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_generatedId_fkey" FOREIGN KEY ("generatedId") REFERENCES "generated"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_to_video" ADD CONSTRAINT "image_to_video_generatedId_fkey" FOREIGN KEY ("generatedId") REFERENCES "generated"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "text_to_image" ADD CONSTRAINT "text_to_image_generatedId_fkey" FOREIGN KEY ("generatedId") REFERENCES "generated"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "text_to_video" ADD CONSTRAINT "text_to_video_generatedId_fkey" FOREIGN KEY ("generatedId") REFERENCES "generated"("id") ON DELETE CASCADE ON UPDATE CASCADE;
