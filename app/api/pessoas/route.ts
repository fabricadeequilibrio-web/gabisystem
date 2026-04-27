import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

const schemaCriar = z.object({
  tipo: z.enum(["FISICA", "JURIDICA", "GOVERNO"]),
  relacionamento: z.enum(["CLIENTE", "FORNECEDOR", "FUNCIONARIO", "SOCIO", "OUTRO"]),
  nome: z.string().min(2, "Nome obrigatório"),
  cpfCnpj: z.string().optional(),
  contato: z
    .object({
      telefone: z.string().optional(),
      email: z.string().email("Email inválido").optional().or(z.literal("")),
    })
    .optional()
    .default({}),
  endereco: z
    .object({
      logradouro: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      cep: z.string().optional(),
    })
    .optional()
    .default({}),
});

export async function GET(req: NextRequest) {
  const sessao = await auth();
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
  }

  const usuario = sessao.user as any;
  const { searchParams } = new URL(req.url);
  const relacionamento = searchParams.get("relacionamento");
  const busca = searchParams.get("busca");

  const pessoas = await prisma.pessoa.findMany({
    where: {
      tenantId: usuario.tenantId,
      ativo: true,
      ...(relacionamento ? { relacionamento: relacionamento as any } : {}),
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: "insensitive" } },
              { cpfCnpj: { contains: busca } },
            ],
          }
        : {}),
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json({ sucesso: true, dados: pessoas });
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

    const pessoa = await prisma.pessoa.create({
      data: {
        tenantId: usuario.tenantId,
        tipo: dados.tipo,
        relacionamento: dados.relacionamento,
        nome: dados.nome,
        cpfCnpj: dados.cpfCnpj || null,
        contato: dados.contato ?? {},
        endereco: dados.endereco ?? {},
      },
    });

    return NextResponse.json({ sucesso: true, dados: pessoa }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { sucesso: false, erro: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Erro ao criar pessoa:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}