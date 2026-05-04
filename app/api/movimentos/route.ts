import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

const schemaItem = z.object({
  produtoId: z.string().min(1, "Produto obrigatório"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.number().min(0, "Valor inválido"),
  observacao: z.string().optional(),
});

const schemaCriar = z.object({
  tipoOperacao: z.enum(["VENDA", "COMPRA", "DESPESA", "RECEITA", "TRANSFERENCIA", "OUTROS"]),
  pessoaId: z.string().min(1, "Pessoa obrigatória"),
  dataMovimento: z.string().min(1, "Data do movimento obrigatória"),
  dataCompetencia: z.string().min(1, "Data de competência obrigatória"),
  descricao: z.string().optional(),
  itens: z.array(schemaItem).min(1, "Adicione ao menos um produto ou serviço"),
  // Dados do lançamento financeiro
  lancamento: z.object({
    tipo: z.enum(["ENTRADA", "SAIDA", "TRANSFERENCIA"]),
    valor: z.number().positive("Valor deve ser maior que zero"),
    dataVencimento: z.string().min(1, "Data de vencimento obrigatória"),
    contaBancariaId: z.string().optional(),
    formaPagamentoId: z.string().optional(),
    observacao: z.string().optional(),
  }),
});

export async function GET(req: NextRequest) {
  const sessao = await auth();
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
  }

  const usuario = sessao.user as any;
  const { searchParams } = new URL(req.url);
  const tipoOperacao = searchParams.get("tipoOperacao");
  const status = searchParams.get("status");

  const movimentos = await prisma.movimento.findMany({
    where: {
      tenantId: usuario.tenantId,
      movimentoPaiId: null, // só movimentos raiz, não filhos fiscais
      ...(tipoOperacao ? { tipoOperacao: tipoOperacao as any } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      pessoa: { select: { id: true, nome: true, relacionamento: true } },
      lancamentoFinanc: {
        select: { id: true, tipo: true, valor: true, status: true, dataVencimento: true },
      },
      itens: {
        include: {
          produto: { select: { id: true, nome: true, tipo: true } },
        },
      },
      movimentosFilhos: {
        select: { id: true, tipoOperacao: true, descricao: true },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json({ sucesso: true, dados: movimentos });
}

export async function POST(req: NextRequest) {
  const sessao = await auth();
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
  }

  const usuario = sessao.user as any;

  try {
    const body = await req.json();
    const dados = schemaCriar.parse(body);

    // Busca configuração fiscal do tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: usuario.tenantId },
      select: { configuracoes: true },
    });
    const fiscal = (tenant?.configuracoes as any)?.fiscal;

    // Determina se gera filho fiscal
    // Aplica imposto em VENDA com alíquota configurada > 0
    const gerarFilhoFiscal =
      dados.tipoOperacao === "VENDA" &&
      fiscal?.aliquotaVendaProduto > 0;

    const valorImposto = gerarFilhoFiscal
      ? Number((dados.lancamento.valor * fiscal.aliquotaVendaProduto / 100).toFixed(2))
      : 0;

    // Tudo em transação: lançamento + movimento + itens + filho fiscal
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Cria lançamento financeiro principal
      const lancamento = await tx.lancamentoFinanceiro.create({
        data: {
          tenantId: usuario.tenantId,
          tipo: dados.lancamento.tipo,
          descricao: dados.descricao || `${dados.tipoOperacao} — movimento`,
          valor: dados.lancamento.valor,
          dataVencimento: new Date(dados.lancamento.dataVencimento),
          dataCompetencia: new Date(dados.dataCompetencia),
          contaBancariaId: dados.lancamento.contaBancariaId || null,
          formaPagamentoId: dados.lancamento.formaPagamentoId || null,
          pessoaId: dados.pessoaId,
          observacao: dados.lancamento.observacao || null,
          criadoPor: usuario.id,
        },
      });

      // 2. Cria o movimento principal
      const movimento = await tx.movimento.create({
        data: {
          tenantId: usuario.tenantId,
          tipoOperacao: dados.tipoOperacao,
          pessoaId: dados.pessoaId,
          lancamentoFinanceiroId: lancamento.id,
          dataMovimento: new Date(dados.dataMovimento),
          dataCompetencia: new Date(dados.dataCompetencia),
          descricao: dados.descricao || null,
          criadoPor: usuario.id,
        },
      });

      // 3. Cria os itens do movimento
      await tx.movimentoItem.createMany({
        data: dados.itens.map((item) => ({
          movimentoId: movimento.id,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorTotal: Number((item.quantidade * item.valorUnitario).toFixed(2)),
          observacao: item.observacao || null,
        })),
      });

      // 4. Gera filho fiscal se aplicável
      if (gerarFilhoFiscal && valorImposto > 0) {
        const lancamentoFiscal = await tx.lancamentoFinanceiro.create({
          data: {
            tenantId: usuario.tenantId,
            tipo: "SAIDA",
            descricao: `Imposto sobre venda (${fiscal.aliquotaVendaProduto}%)`,
            valor: valorImposto,
            dataVencimento: new Date(dados.lancamento.dataVencimento),
            dataCompetencia: new Date(dados.dataCompetencia),
            pessoaId: dados.pessoaId,
            criadoPor: usuario.id,
          },
        });

        await tx.movimento.create({
          data: {
            tenantId: usuario.tenantId,
            tipoOperacao: "DESPESA",
            pessoaId: dados.pessoaId,
            lancamentoFinanceiroId: lancamentoFiscal.id,
            movimentoPaiId: movimento.id,
            dataMovimento: new Date(dados.dataMovimento),
            dataCompetencia: new Date(dados.dataCompetencia),
            descricao: `Imposto sobre venda (${fiscal.aliquotaVendaProduto}%)`,
            criadoPor: usuario.id,
          },
        });
      }

      return movimento;
    });

    return NextResponse.json({ sucesso: true, dados: resultado }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { sucesso: false, erro: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Erro ao criar movimento:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
