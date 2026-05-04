import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

const LABELS_OPERACAO: Record<string, string> = {
  VENDA: "Venda",
  COMPRA: "Compra",
  DESPESA: "Despesa",
  RECEITA: "Receita",
  TRANSFERENCIA: "Transferência",
  OUTROS: "Outros",
};

const CORES_OPERACAO: Record<string, string> = {
  VENDA: "bg-green-100 text-green-800",
  COMPRA: "bg-blue-100 text-blue-800",
  DESPESA: "bg-red-100 text-red-800",
  RECEITA: "bg-green-100 text-green-800",
  TRANSFERENCIA: "bg-purple-100 text-purple-800",
  OUTROS: "bg-gray-100 text-gray-600",
};

const CORES_STATUS: Record<string, string> = {
  RASCUNHO: "bg-amber-100 text-amber-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  CANCELADO: "bg-gray-100 text-gray-500",
};

const LABELS_STATUS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
};

export default async function MovimentosPage() {
  const sessao = await auth();
  if (!sessao) redirect("/login");

  const usuario = sessao.user as any;

  const movimentos = await prisma.movimento.findMany({
    where: {
      tenantId: usuario.tenantId,
      movimentoPaiId: null,
    },
    include: {
      pessoa: { select: { nome: true, relacionamento: true } },
      lancamentoFinanc: { select: { tipo: true, valor: true, status: true } },
      itens: {
        include: { produto: { select: { nome: true } } },
      },
      movimentosFilhos: { select: { id: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  const contadores = {
    total: movimentos.length,
    vendas: movimentos.filter((m) => m.tipoOperacao === "VENDA").length,
    compras: movimentos.filter((m) => m.tipoOperacao === "COMPRA").length,
    despesas: movimentos.filter((m) => m.tipoOperacao === "DESPESA").length,
    comFilhoFiscal: movimentos.filter((m) => m.movimentosFilhos.length > 0).length,
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
            <h1 className="text-xl font-bold text-blue-900">Movimentos</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">{usuario.name}</p>
            <p className="text-xs text-gray-500">{usuario.tenantNome}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Movimentos</h2>
            <p className="text-gray-500 text-sm mt-1">
              Registros completos com Pessoa, Produto/Serviço e Financeiro.
            </p>
          </div>
          <Link
            href="/movimentos/novo"
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            + Novo movimento
          </Link>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total", valor: contadores.total, cor: "text-gray-800" },
            { label: "Vendas", valor: contadores.vendas, cor: "text-green-700" },
            { label: "Compras", valor: contadores.compras, cor: "text-blue-700" },
            { label: "Despesas", valor: contadores.despesas, cor: "text-red-700" },
            { label: "Com imposto", valor: contadores.comFilhoFiscal, cor: "text-purple-700" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.cor}`}>{item.valor}</p>
            </div>
          ))}
        </div>

        {movimentos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">🔄</p>
            <p className="font-medium text-gray-700">Nenhum movimento registrado ainda</p>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Um movimento une Pessoa, Produto/Serviço e Financeiro em um único registro.
            </p>
            <Link
              href="/movimentos/novo"
              className="inline-block bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Registrar primeiro movimento
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Operação</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Descrição</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Pessoa</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Itens</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Data</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Valor</th>
                </tr>
              </thead>
              <tbody>
                {movimentos.map((mov, i) => (
                  <tr
                    key={mov.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      i % 2 === 0 ? "" : "bg-gray-50/40"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CORES_OPERACAO[mov.tipoOperacao] ?? "bg-gray-100 text-gray-600"}`}>
                          {LABELS_OPERACAO[mov.tipoOperacao] ?? mov.tipoOperacao}
                        </span>
                        {mov.movimentosFilhos.length > 0 && (
                          <span className="text-xs text-purple-600" title="Gerou lançamento fiscal automático">⚡</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {mov.descricao ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{mov.pessoa.nome}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {mov.itens.length === 1
                        ? mov.itens[0].produto?.nome
                        : `${mov.itens.length} itens`}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CORES_STATUS[mov.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {LABELS_STATUS[mov.status] ?? mov.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatarData(mov.dataMovimento)}
                    </td>
                    <td className={`px-5 py-3 text-right font-medium ${
                      mov.lancamentoFinanc?.tipo === "ENTRADA" ? "text-green-700" :
                      mov.lancamentoFinanc?.tipo === "SAIDA" ? "text-red-700" : "text-blue-700"
                    }`}>
                      {mov.lancamentoFinanc ? formatarValor(mov.lancamentoFinanc.valor) : "—"}
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
