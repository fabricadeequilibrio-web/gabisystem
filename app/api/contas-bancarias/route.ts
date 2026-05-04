import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

const schemaCriar = z.object({
  tipo: z.enum(["CONTA_CORRENTE", "CONTA_POUPANCA", "CAIXA", "CARTEIRA"]),
  nome: z.string().min(2, "Nome obrigatório"),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  numeroConta: z.string().optional(),
  saldoInicial: z.number().default(0),
});

export async function GET(req: NextRequest) {
  const sessao = await auth();
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
  }

  const usuario = sessao.user as any;

  const contas = await prisma.contaBancaria.findMany({
    where: { tenantId: usuario.tenantId, ativo: true },
    orderBy: { criadoEm: "asc" },
  });

  return NextResponse.json({ sucesso: true, dados: contas });
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

    const conta = await prisma.contaBancaria.create({
      data: {
        tenantId: usuario.tenantId,
        tipo: dados.tipo,
        nome: dados.nome,
        banco: dados.banco || null,
        agencia: dados.agencia || null,
        numeroConta: dados.numeroConta || null,
        saldoInicial: dados.saldoInicial,
      },
    });

    return NextResponse.json({ sucesso: true, dados: conta }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { sucesso: false, erro: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Erro ao criar conta bancária:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
