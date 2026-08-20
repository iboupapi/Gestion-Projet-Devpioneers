/*
  Warnings:

  - The values [MAQUETTE] on the enum `MessageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MessageType_new" AS ENUM ('TEXTE', 'LIEN');
ALTER TABLE "Message" ALTER COLUMN "type" TYPE "MessageType_new" USING ("type"::text::"MessageType_new");
ALTER TYPE "MessageType" RENAME TO "MessageType_old";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";
DROP TYPE "public"."MessageType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'MAINTENANCE';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isMockup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validationComment" TEXT;
