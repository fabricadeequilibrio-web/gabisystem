import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// Plano de contas padrão para contexto da IA
const CONTAS_CONTEXTO = `
1.01 - Venda de Produtos (RECEITA)
1.02 - Prestação de Serviços (RECEITA)
1.03 - Receitas de Projetos (RECEITA)
1.10 - Rendimentos Financeiros (RECEITA)
2.01 - Custo de Mercadorias Vendidas (CUSTO)
2.02 - Custo de Serviços Prestados (CUSTO)
2.03 - Matéria-Prima (CUSTO)
3.01 - Salários e Encargos (DESPESA)
3.02 - Aluguel (DESPESA)
3.03 - Energia Elétrica (DESPESA)
3.04 - Água e Esgoto (DESPESA)
3.05 - Internet e Telefone (DESPESA)
3.06 - Marketing e Publicidade (DESPESA)
3.07 - Manutenção e Reparos (DESPESA)
3.09 - Transporte e Frete (DESPESA)
3.11 - Honorários Contábeis (DESPESA)
4.01 - Juros Pagos (DESPESA)
4.02 - Tarifas Bancárias (DESPESA)
5.01 - Equipamentos (INVESTIMENTO)
6.01 - Impostos sobre Vendas (OBRIGACAO_FISCAL)
6.02 - Contribuições Previdenciárias (OBRIGACAO_FISCAL)
`;

async function gerarRegrasPorSegmento(segmento: string): Promise<any[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

  const prompt = `Você é um especialista em gestão financeira e contábil de pequenas e médias empresas brasileiras.

Uma empresa do segmento "${segmento}" está se cadastrando em um sistema de gestão.

Com base nesse segmento, gere as regras de classificação contábil específicas para os eventos mais comuns desse tipo de negócio.

Plano de contas disponível:
${CONTAS_CONTEXTO}

Para cada evento típico desse segmento, indique em qual conta do plano deve ser registrado.
Considere que o mesmo evento pode ter classificações diferentes dependendo do segmento.
Por exemplo: frete é RECEITA para transportadora mas DESPESA para supermercado.

Retorne APENAS um array JSON válido, sem explicações, sem markdown, sem texto adicional:
[
  {
    "evento": "descrição clara do evento em português",
    "codigo_conta": "código da conta (ex: 1.02)",
    "nome_conta": "nome da conta",
    "tipo": "RECEITA ou CUSTO ou DESPESA ou INVESTIMENTO ou OBRIGACAO_FISCAL",
    "exemplo": "exemplo prático em uma frase curta"
  }
]

Gere entre 8 e 15 regras relevantes para o segmento "${segmento}".`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  const data = await response.json();
  const texto = data.content?.[0]?.text ?? "[]";

  try {
    return JSON.parse(texto);
  } catch {
    // Tenta extrair JSON se vier com texto extra
    const match = texto.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error("IA retornou formato inválido");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessao = await auth();
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
    }

    const usuario = sessao.user as any;
    const { segmento, descricaoNegocio } = await req.json();

    if (!segmento) {
      return NextResponse.json({ sucesso: false, erro: "Segmento é obrigatório" }, { status: 400 });
    }

    // Gera regras via IA
    const regras = await gerarRegrasPorSegmento(segmento);

    // Salva no contexto da IA do tenant
    await prisma.tenantContextoIA.upsert({
      where: { tenantId: usuario.tenantId },
      update: {
        segmentoNegocio: segmento,
        descricaoNegocio: descricaoNegocio || null,
        regrasClassificacao: regras,
      },
      create: {
        tenantId: usuario.tenantId,
        segmentoNegocio: segmento,
        descricaoNegocio: descricaoNegocio || null,
        regrasClassificacao: regras,
        categoriasCustomizadas: {},
      },
    });

    // Marca onboarding como completo
    await prisma.tenant.update({
      where: { id: usuario.tenantId },
      data: {
        configuracoes: {
          segmento,
          onboardingCompleto: true,
        },
      },
    });

    return NextResponse.json({ sucesso: true, dados: { regras, total: regras.length } });
  } catch (error) {
    console.error("Erro no onboarding:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro ao gerar regras de classificação" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessao = await auth();
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: "Não autorizado" }, { status: 401 });
    }

    const usuario = sessao.user as any;

    const contexto = await prisma.tenantContextoIA.findUnique({
      where: { tenantId: usuario.tenantId },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: usuario.tenantId },
      select: { configuracoes: true },
    });

    const config = tenant?.configuracoes as any;

    return NextResponse.json({
      sucesso: true,
      dados: {
        onboardingCompleto: config?.onboardingCompleto ?? false,
        segmento: contexto?.segmentoNegocio ?? null,
        totalRegras: Array.isArray(contexto?.regrasClassificacao)
          ? (contexto.regrasClassificacao as any[]).length
          : 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ sucesso: false, erro: "Erro interno" }, { status: 500 });
  }
}
