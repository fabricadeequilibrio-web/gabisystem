// ─── CAMADA DE SERVIÇO DA IA ─────────────────────────────────────────────────
// Toda comunicação com a API do Claude passa por aqui.
// Para trocar o modelo ou provedor, edite apenas este arquivo.

import { InterpretacaoIA } from "@/types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-5";

// ─── CONTEXTO DO TENANT ───────────────────────────────────────────────────────

interface ContextoTenant {
  nomeEmpresa: string;
  segmento: string | null;
  descricaoNegocio: string | null;
  categoriasCustomizadas: Record<string, unknown>;
  regrasClassificacao: unknown[];
  pessoas: Array<{ nome: string; tipo: string; relacionamento: string }>;
}

// ─── PROMPT PRINCIPAL ────────────────────────────────────────────────────────

function montarPromptSistema(contexto: ContextoTenant): string {
  const categorias =
    Object.keys(contexto.categoriasCustomizadas).length > 0
      ? JSON.stringify(contexto.categoriasCustomizadas, null, 2)
      : "Plano de contas padrão PME brasileiro";

  const regras =
    contexto.regrasClassificacao.length > 0
      ? contexto.regrasClassificacao.map((r) => `- ${JSON.stringify(r)}`).join("\n")
      : "Nenhuma regra específica cadastrada ainda.";

  const pessoas =
    contexto.pessoas.length > 0
      ? contexto.pessoas
          .map((p) => `- ${p.nome} (${p.tipo} | ${p.relacionamento})`)
          .join("\n")
      : "Nenhuma pessoa cadastrada ainda.";

  return `Você é o assistente de gestão da empresa "${contexto.nomeEmpresa}".
Segmento: ${contexto.segmento ?? "não informado"}
Sobre o negócio: ${contexto.descricaoNegocio ?? "não informado"}

Plano de contas desta empresa:
${categorias}

Pessoas cadastradas:
${pessoas}

Regras aprendidas sobre esta empresa:
${regras}

Sua função é interpretar lançamentos em linguagem natural e retornar um JSON estruturado.
Responda APENAS com o JSON, sem explicações, sem markdown, sem texto adicional.

O JSON deve ter exatamente esta estrutura:
{
  "tipo_movimento": "financeiro" | "produto" | "pessoa",
  "subtipo": string,
  "valor": number | null,
  "data": "YYYY-MM-DD" | null,
  "categoria_sugerida": string | null,
  "pessoa_envolvida": { "id": string | null, "nome": string | null } | null,
  "produto_envolvido": { "id": string | null, "nome": string | null } | null,
  "campos_faltantes": string[],
  "confianca": number entre 0 e 1
}`;
}

// ─── FUNÇÃO PRINCIPAL ────────────────────────────────────────────────────────

export async function interpretarMovimento(
  textoUsuario: string,
  contexto: ContextoTenant
): Promise<InterpretacaoIA> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada.");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: montarPromptSistema(contexto),
      messages: [
        {
          role: "user",
          content: textoUsuario,
        },
      ],
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro na API Anthropic: ${response.status} — ${erro}`);
  }

  const data = await response.json();
  const textoResposta = data.content?.[0]?.text ?? "";

  try {
    const interpretacao: InterpretacaoIA = JSON.parse(textoResposta);
    return interpretacao;
  } catch {
    throw new Error(
      `IA retornou resposta inválida: ${textoResposta.slice(0, 200)}`
    );
  }
}
