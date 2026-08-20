/*
  Warnings:

  - You are about to drop the column `projectId` on the `Attachment` table. All the data in the column will be lost.
  - Made the column `messageId` on table `Attachment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStatus" ADD VALUE 'EN_ATTENTE';
ALTER TYPE "ProjectStatus" ADD VALUE 'TERMINE';

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_messageId_fkey";

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_projectId_fkey";

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "projectId",
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "size" INTEGER,
ALTER COLUMN "messageId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
