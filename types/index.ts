// ─── TIPOS GLOBAIS DO GABISYSTEM ─────────────────────────────────────────────

// Re-exporta tipos do Prisma para uso em todo o projeto
export type {
  Tenant,
  Usuario,
  Pessoa,
  Produto,
  Movimento,
  MovimentoItem,
  MovimentoContabil,
  TenantContextoIA,
  LogIA,
  ContaPlano,
} from "@prisma/client";

export type {
  Plano,
  Perfil,
  TipoPessoa,
  Relacionamento,
  TipoProduto,
  TipoMovimento,
  OrigemRegistro,
  StatusMovimento,
  TipoConta,
} from "@prisma/client";

// ─── TIPOS DA SESSÃO ─────────────────────────────────────────────────────────

export interface SessaoUsuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  tenantId: string;
  tenantNome: string;
}

// ─── TIPOS DA IA ─────────────────────────────────────────────────────────────

export interface InterpretacaoIA {
  tipo_movimento: "financeiro" | "produto" | "pessoa";
  subtipo: string;
  valor: number | null;
  data: string | null;
  categoria_sugerida: string | null;
  pessoa_envolvida: { id: string | null; nome: string | null } | null;
  produto_envolvido: { id: string | null; nome: string | null } | null;
  campos_faltantes: string[];
  confianca: number;
}

// ─── TIPOS DE RESPOSTA DA API ─────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
  detalhes?: unknown;
}
