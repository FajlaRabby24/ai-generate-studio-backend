-- CreateTable
CREATE TABLE "background_remove" (
    "id" TEXT NOT NULL,
    "generatedId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "imageUrl" TEXT NOT NULL,
    "outputUrls" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_remove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GenerationType" NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "background_remove" ADD CONSTRAINT "background_remove_generatedId_fkey" FOREIGN KEY ("generatedId") REFERENCES "generated"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated" ADD CONSTRAINT "generated_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
