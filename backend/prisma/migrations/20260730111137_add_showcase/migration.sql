-- CreateEnum
CREATE TYPE "ShowcaseType" AS ENUM ('SAAS', 'MOBILE_APP', 'WEB', 'AUTRE');

-- CreateTable
CREATE TABLE "Showcase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ShowcaseType" NOT NULL DEFAULT 'AUTRE',
    "url" TEXT,
    "imageUrl" TEXT,
    "imageMime" TEXT,
    "imageSize" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Showcase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Showcase" ADD CONSTRAINT "Showcase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
