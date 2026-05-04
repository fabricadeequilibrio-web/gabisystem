/*
  Warnings:

  - You are about to drop the column `subtipo` on the `movimentos` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `movimentos` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `movimentos` table. All the data in the column will be lost.
  - Added the required column `pessoa_id` to the `movimentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_operacao` to the `movimentos` table without a default value. This is not possible if the table is not empty.
  - Made the column `lancamento_financeiro_id` on table `movimentos` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TipoOperacao" AS ENUM ('VENDA', 'COMPRA', 'DESPESA', 'RECEITA', 'TRANSFERENCIA', 'OUTROS');

-- DropForeignKey
ALTER TABLE "movimentos" DROP CONSTRAINT "movimentos_lancamento_financeiro_id_fkey";

-- AlterTable
ALTER TABLE "movimentos" DROP COLUMN "subtipo",
DROP COLUMN "tipo",
DROP COLUMN "valor",
ADD COLUMN     "movimento_pai_id" TEXT,
ADD COLUMN     "pessoa_id" TEXT NOT NULL,
ADD COLUMN     "tipo_operacao" "TipoOperacao" NOT NULL,
ALTER COLUMN "lancamento_financeiro_id" SET NOT NULL;

-- DropEnum
DROP TYPE "SubtipoMovimento";

-- DropEnum
DROP TYPE "TipoMovimento";

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_lancamento_financeiro_id_fkey" FOREIGN KEY ("lancamento_financeiro_id") REFERENCES "lancamentos_financeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_movimento_pai_id_fkey" FOREIGN KEY ("movimento_pai_id") REFERENCES "movimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
