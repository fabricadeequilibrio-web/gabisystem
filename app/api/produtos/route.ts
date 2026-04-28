import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

const schemaCriar = z.object({
  tipo: z.enum(["PRODUTO", "SERVICO"]),
  nome: z.string().min(2, "Nome obrigatório"),
  descricao: z.string().optional(),
  unidade: z.string().default("un"),
  precoReferencia: z.number().positive().optional(),
  grupo: z.string().optional(),
  subgrupo: z.string().optional(),
  tipoOperacao: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const sessao = await auth();
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
  }

  const usuario = sessao.user as any;
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const busca = searchParams.get("busca");

  const produtos = await prisma.produto.findMany({
    where: {
      tenantId: usuario.tenantId,
      ativo: true,
      ...(tipo ? { tipo: tipo as any } : {}),
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: "insensitive" } },
              { grupo: { contains: busca, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json({ sucesso: true, dados: produtos });
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

    const produto = await prisma.produto.create({
      data: {
        tenantId: usuario.tenantId,
        tipo: dados.tipo,
        nome: dados.nome,
        descricao: dados.descricao || null,
        unidade: dados.unidade,
        precoReferencia: dados.precoReferencia ?? null,
        grupo: dados.grupo || null,
        subgrupo: dados.subgrupo || null,
        tipoOperacao: dados.tipoOperacao || null,
      },
    });

    return NextResponse.json({ sucesso: true, dados: produto }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { sucesso: false, erro: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}