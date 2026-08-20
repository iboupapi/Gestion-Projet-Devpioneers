/*
  Warnings:

  - You are about to drop the column `email` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Invitation` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_projectId_fkey";

-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "email",
DROP COLUMN "projectId",
DROP COLUMN "role",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
