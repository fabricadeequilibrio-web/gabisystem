import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

const schemaCriar = z.object({
  tipo: z.enum([
    "DINHEIRO",
    "PIX",
    "BOLETO",
    "CARTAO_CREDITO",
    "CARTAO_DEBITO",
    "CHEQUE",
    "TRANSFERENCIA",
    "OUTRO",
  ]),
  nome: z.string().min(2, "Nome obrigatório"),
});

export async function GET(req: NextRequest) {
  const sessao = await auth();
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
  }

  const usuario = sessao.user as any;

  const formas = await prisma.formaPagamento.findMany({
    where: { tenantId: usuario.tenantId, ativo: true },
    orderBy: { criadoEm: "asc" },
  });

  return NextResponse.json({ sucesso: true, dados: formas });
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

    const forma = await prisma.formaPagamento.create({
      data: {
        tenantId: usuario.tenantId,
        tipo: dados.tipo,
        nome: dados.nome,
      },
    });

    return NextResponse.json({ sucesso: true, dados: forma }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { sucesso: false, erro: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Erro ao criar forma de pagamento:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
