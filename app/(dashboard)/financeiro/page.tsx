import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

const LABELS_TIPO_LANCAMENTO: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  TRANSFERENCIA: "Transferência",
};

const LABELS_STATUS: Record<string, string> = {
  PREVISTO: "Previsto",
  CONFIRMADO: "Confirmado",
  PAGO: "Pago",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
};

const CORES_TIPO: Record<string, string> = {
  ENTRADA: "bg-green-100 text-green-800",
  SAIDA: "bg-red-100 text-red-800",
  TRANSFERENCIA: "bg-blue-100 text-blue-800",
};

const CORES_STATUS: Record<string, string> = {
  PREVISTO: "bg-amber-100 text-amber-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  PAGO: "bg-green-100 text-green-800",
  RECEBIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-gray-100 text-gray-500",
};

const LABELS_TIPO_CONTA: Record<string, string> = {
  CONTA_CORRENTE: "Conta Corrente",
  CONTA_POUPANCA: "Poupança",
  CAIXA: "Caixa",
  CARTEIRA: "Carteira",
};

export default async function FinanceiroPage() {
  const sessao = await auth();
  if (!sessao) redirect("/login");

  const usuario = sessao.user as any;

  const [lancamentos, contas, formas] = await Promise.all([
    prisma.lancamentoFinanceiro.findMany({
      where: { tenantId: usuario.tenantId },
      include: {
        contaBancaria: { select: { nome: true } },
        formaPagamento: { select: { nome: true } },
        pessoa: { select: { nome: true } },
      },
      orderBy: { dataVencimento: "asc" },
    }),
    prisma.contaBancaria.findMany({
      where: { tenantId: usuario.tenantId, ativo: true },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.formaPagamento.findMany({
      where: { tenantId: usuario.tenantId, ativo: true },
      orderBy: { criadoEm: "asc" },
    }),
  ]);

  const contadores = {
    total: lancamentos.length,
    entradas: lancamentos.filter((l) => l.tipo === "ENTRADA").length,
    saidas: lancamentos.filter((l) => l.tipo === "SAIDA").length,
    previstos: lancamentos.filter((l) => l.status === "PREVISTO").length,
    contas: contas.length,
    formas: formas.length,
  };

  const formatarValor = (valor: any) =>
    Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatarData = (data: Date) =>
    new Date(data).toLocaleDateString("pt-BR");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-blue-900">Financeiro</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">{usuario.name}</p>
            <p className="text-xs text-gray-500">{usuario.tenantNome}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Título e ações */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Financeiro</h2>
            <p className="text-gray-500 text-sm mt-1">
              Lançamentos, contas e formas de pagamento.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/financeiro/lancamento/novo"
              className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              + Novo lançamento
            </Link>
          </div>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total", valor: contadores.total, cor: "text-gray-800" },
            { label: "Entradas", valor: contadores.entradas, cor: "text-green-700" },
            { label: "Saídas", valor: contadores.saidas, cor: "text-red-700" },
            { label: "Previstos", valor: contadores.previstos, cor: "text-amber-700" },
            { label: "Contas", valor: contadores.contas, cor: "text-blue-700" },
            { label: "Formas pag.", valor: contadores.formas, cor: "text-purple-700" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.cor}`}>{item.valor}</p>
            </div>
          ))}
        </div>

        {/* Links de configuração */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Contas bancárias</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {contadores.contas === 0
                  ? "Nenhuma conta cadastrada"
                  : `${contadores.contas} conta${contadores.contas > 1 ? "s" : ""} cadastrada${contadores.contas > 1 ? "s" : ""}`}
              </p>
              {contas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {contas.map((c) => (
                    <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {c.nome} · {LABELS_TIPO_CONTA[c.tipo]}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/financeiro/conta-bancaria/nova"
              className="flex-shrink-0 text-sm text-blue-700 hover:underline ml-4"
            >
              + Adicionar
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Formas de pagamento</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {contadores.formas === 0
                  ? "Nenhuma forma cadastrada"
                  : `${contadores.formas} forma${contadores.formas > 1 ? "s" : ""} cadastrada${contadores.formas > 1 ? "s" : ""}`}
              </p>
              {formas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formas.map((f) => (
                    <span key={f.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {f.nome}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/financeiro/forma-pagamento/nova"
              className="flex-shrink-0 text-sm text-blue-700 hover:underline ml-4"
            >
              + Adicionar
            </Link>
          </div>
        </div>

        {/* Lançamentos */}
        {lancamentos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">💰</p>
            <p className="font-medium text-gray-700">Nenhum lançamento registrado ainda</p>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Registre entradas, saídas e transferências financeiras.
            </p>
            <Link
              href="/financeiro/lancamento/novo"
              className="inline-block bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Registrar primeiro lançamento
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Descrição</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Vencimento</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Pessoa</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((lancamento, i) => (
                  <tr
                    key={lancamento.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      i % 2 === 0 ? "" : "bg-gray-50/40"
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-gray-800">{lancamento.descricao}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CORES_TIPO[lancamento.tipo] ?? "bg-gray-100 text-gray-600"}`}>
                        {LABELS_TIPO_LANCAMENTO[lancamento.tipo] ?? lancamento.tipo}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CORES_STATUS[lancamento.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {LABELS_STATUS[lancamento.status] ?? lancamento.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatarData(lancamento.dataVencimento)}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {lancamento.pessoa?.nome ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className={`px-5 py-3 text-right font-medium ${lancamento.tipo === "ENTRADA" ? "text-green-700" : lancamento.tipo === "SAIDA" ? "text-red-700" : "text-blue-700"}`}>
                      {formatarValor(lancamento.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
