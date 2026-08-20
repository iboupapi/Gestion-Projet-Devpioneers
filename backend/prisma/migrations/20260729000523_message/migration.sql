-- CreateEnum
CREATE TYPE "LinkKind" AS ENUM ('TEST', 'FINAL');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "linkKind" "LinkKind";
