/*
  Warnings:

  - Changed the type of `subtipo` on the `movimentos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubtipoMovimento" AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "movimentos" DROP COLUMN "subtipo",
ADD COLUMN     "subtipo" "SubtipoMovimento" NOT NULL;
