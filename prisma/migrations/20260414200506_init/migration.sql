-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('FREE', 'BASIC', 'PRO');

-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('DONO', 'GESTOR', 'OPERACIONAL');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('FISICA', 'JURIDICA', 'GOVERNO');

-- CreateEnum
CREATE TYPE "Relacionamento" AS ENUM ('CLIENTE', 'FORNECEDOR', 'FUNCIONARIO', 'SOCIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('PRODUTO', 'SERVICO');

-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('RECEITA', 'CUSTO', 'DESPESA', 'INVESTIMENTO', 'OBRIGACAO_FISCAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoMovimento" AS ENUM ('FINANCEIRO', 'PRODUTO', 'PESSOA');

-- CreateEnum
CREATE TYPE "OrigemRegistro" AS ENUM ('MANUAL', 'IA', 'IMPORTACAO');

-- CreateEnum
CREATE TYPE "StatusMovimento" AS ENUM ('RASCUNHO', 'CONFIRMADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "plano" "Plano" NOT NULL DEFAULT 'FREE',
    "configuracoes" JSONB NOT NULL DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'OPERACIONAL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tipo" "TipoPessoa" NOT NULL,
    "relacionamento" "Relacionamento" NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf_cnpj" TEXT,
    "contato" JSONB NOT NULL DEFAULT '{}',
    "endereco" JSONB NOT NULL DEFAULT '{}',
    "metadados_ia" JSONB NOT NULL DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "unidade" TEXT NOT NULL DEFAULT 'un',
    "preco_referencia" DECIMAL(15,2),
    "grupo" TEXT,
    "subgrupo" TEXT,
    "metadados_ia" JSONB NOT NULL DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_plano" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "subgrupo" TEXT,
    "tipo" "TipoConta" NOT NULL,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contas_plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tipo" "TipoMovimento" NOT NULL,
    "subtipo" TEXT NOT NULL,
    "data_movimento" TIMESTAMP(3) NOT NULL,
    "data_competencia" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "descricao" TEXT,
    "origem_registro" "OrigemRegistro" NOT NULL DEFAULT 'MANUAL',
    "texto_original" JSONB,
    "status" "StatusMovimento" NOT NULL DEFAULT 'RASCUNHO',
    "criado_por" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimento_itens" (
    "id" TEXT NOT NULL,
    "movimento_id" TEXT NOT NULL,
    "pessoa_id" TEXT,
    "produto_id" TEXT,
    "quantidade" DECIMAL(15,4) NOT NULL DEFAULT 1,
    "valor_unitario" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "observacao" TEXT,

    CONSTRAINT "movimento_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_contabil" (
    "id" TEXT NOT NULL,
    "movimento_id" TEXT NOT NULL,
    "conta_debito" TEXT NOT NULL,
    "conta_credito" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "historico" TEXT,

    CONSTRAINT "movimentos_contabil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_contexto_ia" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "segmento_negocio" TEXT,
    "descricao_negocio" TEXT,
    "categorias_customizadas" JSONB NOT NULL DEFAULT '{}',
    "regras_classificacao" JSONB NOT NULL DEFAULT '[]',
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_contexto_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_ia" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "input_usuario" TEXT NOT NULL,
    "interpretacao_ia" JSONB NOT NULL,
    "confirmado_pelo_usuario" BOOLEAN NOT NULL DEFAULT false,
    "correcao_usuario" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_cnpj_key" ON "tenants"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contas_plano_tenant_id_codigo_key" ON "contas_plano"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_contexto_ia_tenant_id_key" ON "tenant_contexto_ia"("tenant_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas" ADD CONSTRAINT "pessoas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_plano" ADD CONSTRAINT "contas_plano_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimento_itens" ADD CONSTRAINT "movimento_itens_movimento_id_fkey" FOREIGN KEY ("movimento_id") REFERENCES "movimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimento_itens" ADD CONSTRAINT "movimento_itens_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimento_itens" ADD CONSTRAINT "movimento_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_contabil" ADD CONSTRAINT "movimentos_contabil_movimento_id_fkey" FOREIGN KEY ("movimento_id") REFERENCES "movimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_contexto_ia" ADD CONSTRAINT "tenant_contexto_ia_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_ia" ADD CONSTRAINT "logs_ia_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_ia" ADD CONSTRAINT "logs_ia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
