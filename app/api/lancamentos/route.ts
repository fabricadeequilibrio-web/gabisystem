import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

const schemaCriar = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA", "TRANSFERENCIA"]),
  descricao: z.string().min(2, "Descrição obrigatória"),
  valor: z.number().positive("Valor deve ser maior que zero"),
  dataVencimento: z.string().min(1, "Data de vencimento obrigatória"),
  dataCompetencia: z.string().min(1, "Data de competência obrigatória"),
  contaBancariaId: z.string().optional(),
  formaPagamentoId: z.string().optional(),
  pessoaId: z.string().optional(),
  contaPlanoId: z.string().optional(),
  observacao: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const sessao = await auth();
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
  }

  const usuario = sessao.user as any;
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");

  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where: {
      tenantId: usuario.tenantId,
      ...(tipo ? { tipo: tipo as any } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      contaBancaria: { select: { id: true, nome: true } },
      formaPagamento: { select: { id: true, nome: true } },
      pessoa: { select: { id: true, nome: true } },
      contaPlano: { select: { id: true, nome: true, codigo: true } },
    },
    orderBy: { dataVencimento: "asc" },
  });

  return NextResponse.json({ sucesso: true, dados: lancamentos });
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

    const lancamento = await prisma.lancamentoFinanceiro.create({
      data: {
        tenantId: usuario.tenantId,
        tipo: dados.tipo,
        descricao: dados.descricao,
        valor: dados.valor,
        dataVencimento: new Date(dados.dataVencimento),
        dataCompetencia: new Date(dados.dataCompetencia),
        contaBancariaId: dados.contaBancariaId || null,
        formaPagamentoId: dados.formaPagamentoId || null,
        pessoaId: dados.pessoaId || null,
        contaPlanoId: dados.contaPlanoId || null,
        observacao: dados.observacao || null,
        criadoPor: usuario.id,
      },
    });

    return NextResponse.json({ sucesso: true, dados: lancamento }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { sucesso: false, erro: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Erro ao criar lançamento:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
