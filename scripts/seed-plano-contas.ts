// scripts/seed-plano-contas.ts
// Popula o plano de contas padrão para um tenant
// Uso: npx ts-node scripts/seed-plano-contas.ts <tenantId>

import { prisma } from "../lib/prisma/client";

export const PLANO_CONTAS_PADRAO = [
  // ─── RECEITAS OPERACIONAIS ───────────────────────────────────────────────
  { codigo: "1.01", nome: "Venda de Produtos", grupo: "Receitas Operacionais", tipo: "RECEITA" as const },
  { codigo: "1.02", nome: "Prestação de Serviços", grupo: "Receitas Operacionais", tipo: "RECEITA" as const },
  { codigo: "1.03", nome: "Receitas de Projetos", grupo: "Receitas Operacionais", tipo: "RECEITA" as const },

  // ─── RECEITAS NÃO OPERACIONAIS ───────────────────────────────────────────
  { codigo: "1.10", nome: "Rendimentos Financeiros", grupo: "Receitas Não Operacionais", tipo: "RECEITA" as const },
  { codigo: "1.11", nome: "Outras Receitas", grupo: "Receitas Não Operacionais", tipo: "RECEITA" as const },

  // ─── CUSTOS DIRETOS ──────────────────────────────────────────────────────
  { codigo: "2.01", nome: "Custo de Mercadorias Vendidas", grupo: "Custos Diretos", tipo: "CUSTO" as const },
  { codigo: "2.02", nome: "Custo de Serviços Prestados", grupo: "Custos Diretos", tipo: "CUSTO" as const },
  { codigo: "2.03", nome: "Matéria-Prima", grupo: "Custos Diretos", tipo: "CUSTO" as const },

  // ─── DESPESAS OPERACIONAIS ───────────────────────────────────────────────
  { codigo: "3.01", nome: "Salários e Encargos", grupo: "Despesas Operacionais", tipo: "DESPESA" as const },
  { codigo: "3.02", nome: "Aluguel", grupo: "Despesas Operacionais", tipo: "DESPESA" as const },
  { codigo: "3.03", nome: "Energia Elétrica", grupo: "Despesas Operacionais", subgrupo: "Utilidades", tipo: "DESPESA" as const },
  { codigo: "3.04", nome: "Água e Esgoto", grupo: "Despesas Operacionais", subgrupo: "Utilidades", tipo: "DESPESA" as const },
  { codigo: "3.05", nome: "Internet e Telefone", grupo: "Despesas Operacionais", subgrupo: "Utilidades", tipo: "DESPESA" as const },
  { codigo: "3.06", nome: "Marketing e Publicidade", grupo: "Despesas Operacionais", tipo: "DESPESA" as const },
  { codigo: "3.07", nome: "Manutenção e Reparos", grupo: "Despesas Operacionais", tipo: "DESPESA" as const },
  { codigo: "3.08", nome: "Material de Escritório", grupo: "Despesas Operacionais", tipo: "DESPESA" as const },
  { codigo: "3.09", nome: "Transporte e Frete", grupo: "Despesas Operacionais", tipo: "DESPESA" as const },
  { codigo: "3.10", nome: "Seguros", grupo: "Despesas Operacionais", tipo: "DESPESA" as const },
  { codigo: "3.11", nome: "Honorários Contábeis", grupo: "Despesas Operacionais", tipo: "DESPESA" as const },
  { codigo: "3.12", nome: "Outras Despesas Operacionais", grupo: "Despesas Operacionais", tipo: "DESPESA" as const },

  // ─── DESPESAS FINANCEIRAS ────────────────────────────────────────────────
  { codigo: "4.01", nome: "Juros Pagos", grupo: "Despesas Financeiras", tipo: "DESPESA" as const },
  { codigo: "4.02", nome: "Tarifas Bancárias", grupo: "Despesas Financeiras", tipo: "DESPESA" as const },
  { codigo: "4.03", nome: "IOF", grupo: "Despesas Financeiras", tipo: "DESPESA" as const },

  // ─── INVESTIMENTOS ───────────────────────────────────────────────────────
  { codigo: "5.01", nome: "Equipamentos", grupo: "Investimentos", tipo: "INVESTIMENTO" as const },
  { codigo: "5.02", nome: "Software e Licenças", grupo: "Investimentos", tipo: "INVESTIMENTO" as const },
  { codigo: "5.03", nome: "Obras e Benfeitorias", grupo: "Investimentos", tipo: "INVESTIMENTO" as const },
  { codigo: "5.04", nome: "Veículos", grupo: "Investimentos", tipo: "INVESTIMENTO" as const },

  // ─── OBRIGAÇÕES FISCAIS ──────────────────────────────────────────────────
  { codigo: "6.01", nome: "Impostos sobre Vendas", grupo: "Obrigações Fiscais", tipo: "OBRIGACAO_FISCAL" as const },
  { codigo: "6.02", nome: "Contribuições Previdenciárias", grupo: "Obrigações Fiscais", tipo: "OBRIGACAO_FISCAL" as const },
  { codigo: "6.03", nome: "IRPJ / CSLL", grupo: "Obrigações Fiscais", tipo: "OBRIGACAO_FISCAL" as const },
  { codigo: "6.04", nome: "Parcelamentos Fiscais", grupo: "Obrigações Fiscais", tipo: "OBRIGACAO_FISCAL" as const },
];

export async function seedPlanoConta(tenantId: string) {
  const registros = PLANO_CONTAS_PADRAO.map((conta) => ({
    tenantId,
    codigo: conta.codigo,
    nome: conta.nome,
    grupo: conta.grupo,
    subgrupo: (conta as { subgrupo?: string }).subgrupo ?? null,
    tipo: conta.tipo,
    padrao: true,
  }));

  await prisma.contaPlano.createMany({
    data: registros,
    skipDuplicates: true,
  });

  console.log(`✓ Plano de contas padrão criado para tenant ${tenantId} — ${registros.length} contas`);
}
