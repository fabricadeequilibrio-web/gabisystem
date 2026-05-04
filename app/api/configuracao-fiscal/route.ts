import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

const schemaFiscal = z.object({
  regimeTributario: z.enum(["MEI", "SIMPLES_NACIONAL", "LUCRO_PRESUMIDO", "LUCRO_REAL"]),
  aliquotaVendaProduto: z.number().min(0).max(100),
  aliquotaPrestacaoServico: z.number().min(0).max(100),
  emiteNotaFiscal: z.enum(["NAO_EMITE", "NFE", "NFSE", "AMBAS"]),
});

export async function GET(req: NextRequest) {
  const sessao = await auth();
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
  }

  const usuario = sessao.user as any;

  const tenant = await prisma.tenant.findUnique({
    where: { id: usuario.tenantId },
    select: { configuracoes: true },
  });

  const config = tenant?.configuracoes as any;

  return NextResponse.json({
    sucesso: true,
    dados: {
      regimeTributario: config?.fiscal?.regimeTributario ?? null,
      aliquotaVendaProduto: config?.fiscal?.aliquotaVendaProduto ?? null,
      aliquotaPrestacaoServico: config?.fiscal?.aliquotaPrestacaoServico ?? null,
      emiteNotaFiscal: config?.fiscal?.emiteNotaFiscal ?? null,
      configurado: !!config?.fiscal?.regimeTributario,
    },
  });
}

export async function POST(req: NextRequest) {
  const sessao = await auth();
  if (!sessao) {
    return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
  }

  const usuario = sessao.user as any;

  try {
    const body = await req.json();
    const dados = schemaFiscal.parse(body);

    const tenant = await prisma.tenant.findUnique({
      where: { id: usuario.tenantId },
      select: { configuracoes: true },
    });

    const configAtual = (tenant?.configuracoes as any) ?? {};

    await prisma.tenant.update({
      where: { id: usuario.tenantId },
      data: {
        configuracoes: {
          ...configAtual,
          fiscal: {
            regimeTributario: dados.regimeTributario,
            aliquotaVendaProduto: dados.aliquotaVendaProduto,
            aliquotaPrestacaoServico: dados.aliquotaPrestacaoServico,
            emiteNotaFiscal: dados.emiteNotaFiscal,
          },
        },
      },
    });

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { sucesso: false, erro: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Erro ao salvar configuração fiscal:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
