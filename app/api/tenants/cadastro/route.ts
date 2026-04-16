import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { seedPlanoConta } from "@/scripts/seed-plano-contas";

const schema = z.object({
  // Dados da empresa
  nomeEmpresa: z.string().min(2, "Nome da empresa obrigatório"),
  cnpj: z.string().optional(),
  segmento: z.string().optional(),
  // Dados do usuário dono
  nomeUsuario: z.string().min(2, "Seu nome é obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dados = schema.parse(body);

    // Verifica se email já existe
    const emailExiste = await prisma.usuario.findUnique({
      where: { email: dados.email },
    });

    if (emailExiste) {
      return NextResponse.json(
        { sucesso: false, erro: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Verifica se CNPJ já existe
    if (dados.cnpj) {
      const cnpjExiste = await prisma.tenant.findUnique({
        where: { cnpj: dados.cnpj },
      });
      if (cnpjExiste) {
        return NextResponse.json(
          { sucesso: false, erro: "CNPJ já cadastrado" },
          { status: 400 }
        );
      }
    }

    const senhaHash = await bcrypt.hash(dados.senha, 12);

    // Cria tenant e usuário em uma transação
    const resultado = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          nome: dados.nomeEmpresa,
          cnpj: dados.cnpj || null,
          plano: "FREE",
          configuracoes: {
            segmento: dados.segmento || null,
            onboardingCompleto: false,
          },
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          tenantId: tenant.id,
          nome: dados.nomeUsuario,
          email: dados.email,
          senhaHash,
          perfil: "DONO",
        },
      });

      // Contexto inicial da IA
      await tx.tenantContextoIA.create({
        data: {
          tenantId: tenant.id,
          segmentoNegocio: dados.segmento || null,
          descricaoNegocio: null,
          categoriasCustomizadas: {},
          regrasClassificacao: [],
        },
      });

      return { tenant, usuario };
    });

    // Seed do plano de contas padrão (fora da transação)
    await seedPlanoConta(resultado.tenant.id);

    return NextResponse.json({
      sucesso: true,
      dados: {
        tenantId: resultado.tenant.id,
        usuarioId: resultado.usuario.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { sucesso: false, erro: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Erro no cadastro:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
