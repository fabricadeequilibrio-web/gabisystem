import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

const LABELS_TIPO: Record<string, string> = {
  PRODUTO: "Produto",
  SERVICO: "Serviço",
};

const CORES_TIPO: Record<string, string> = {
  PRODUTO: "bg-blue-100 text-blue-800",
  SERVICO: "bg-green-100 text-green-800",
};

export default async function ProdutosPage() {
  const sessao = await auth();
  if (!sessao) redirect("/login");

  const usuario = sessao.user as any;

  const produtos = await prisma.produto.findMany({
    where: { tenantId: usuario.tenantId, ativo: true },
    orderBy: { criadoEm: "desc" },
  });

  const contadores = {
    total: produtos.length,
    produtos: produtos.filter((p) => p.tipo === "PRODUTO").length,
    servicos: produtos.filter((p) => p.tipo === "SERVICO").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-blue-900">Produtos e Serviços</h1>
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
            <h2 className="text-2xl font-bold text-gray-800">Produtos e Serviços</h2>
            <p className="text-gray-500 text-sm mt-1">
              Tudo que sua empresa vende, compra ou usa nos movimentos.
            </p>
          </div>
          <Link
            href="/produtos/novo"
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            + Novo item
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", valor: contadores.total, cor: "text-gray-800" },
            { label: "Produtos", valor: contadores.produtos, cor: "text-blue-700" },
            { label: "Serviços", valor: contadores.servicos, cor: "text-green-700" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.cor}`}>{item.valor}</p>
            </div>
          ))}
        </div>

        {produtos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium text-gray-700">Nenhum produto ou serviço cadastrado ainda</p>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Cadastre o que sua empresa vende, compra ou usa para usar nos movimentos.
            </p>
            <Link
              href="/produtos/novo"
              className="inline-block bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Cadastrar primeiro item
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Unidade</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Grupo</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Preço ref.</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo operação</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto, i) => (
                  <tr
                    key={produto.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      i % 2 === 0 ? "" : "bg-gray-50/40"
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-gray-800">{produto.nome}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          CORES_TIPO[produto.tipo] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {LABELS_TIPO[produto.tipo] ?? produto.tipo}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{produto.unidade}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {produto.grupo ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {produto.precoReferencia
                        ? `R$ ${Number(produto.precoReferencia).toFixed(2)}`
                        : "—"}
                    </td>
                   <td className="px-5 py-3 text-gray-500">
                      {produto.tipoOperacao ?? "—"}
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