import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

const LABELS_RELACIONAMENTO: Record<string, string> = {
  CLIENTE: "Cliente",
  FORNECEDOR: "Fornecedor",
  FUNCIONARIO: "Funcionário",
  SOCIO: "Sócio",
  OUTRO: "Outro",
};

const LABELS_TIPO: Record<string, string> = {
  FISICA: "Pessoa Física",
  JURIDICA: "Pessoa Jurídica",
  GOVERNO: "Governo",
};

const CORES_RELACIONAMENTO: Record<string, string> = {
  CLIENTE: "bg-blue-100 text-blue-800",
  FORNECEDOR: "bg-green-100 text-green-800",
  FUNCIONARIO: "bg-purple-100 text-purple-800",
  SOCIO: "bg-amber-100 text-amber-800",
  OUTRO: "bg-gray-100 text-gray-600",
};

export default async function PessoasPage() {
  const sessao = await auth();
  if (!sessao) redirect("/login");

  const usuario = sessao.user as any;

  const pessoas = await prisma.pessoa.findMany({
    where: { tenantId: usuario.tenantId, ativo: true },
    orderBy: { criadoEm: "desc" },
  });

  const contadores = {
    total: pessoas.length,
    clientes: pessoas.filter((p) => p.relacionamento === "CLIENTE").length,
    fornecedores: pessoas.filter((p) => p.relacionamento === "FORNECEDOR").length,
    funcionarios: pessoas.filter((p) => p.relacionamento === "FUNCIONARIO").length,
    governo: pessoas.filter((p) => p.tipo === "GOVERNO").length,
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
            <h1 className="text-xl font-bold text-blue-900">Pessoas</h1>
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
            <h2 className="text-2xl font-bold text-gray-800">Pessoas cadastradas</h2>
            <p className="text-gray-500 text-sm mt-1">
              Clientes, fornecedores, funcionários e outros vínculos da empresa.
            </p>
          </div>
          <Link
            href="/pessoas/nova"
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            + Nova pessoa
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
         {[
            { label: "Total", valor: contadores.total, cor: "text-gray-800" },
            { label: "Clientes", valor: contadores.clientes, cor: "text-blue-700" },
            { label: "Fornecedores", valor: contadores.fornecedores, cor: "text-green-700" },
            { label: "Funcionários", valor: contadores.funcionarios, cor: "text-purple-700" },
            { label: "Governo", valor: contadores.governo, cor: "text-orange-700" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.cor}`}>{item.valor}</p>
            </div>
          ))}
        </div>

        {pessoas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium text-gray-700">Nenhuma pessoa cadastrada ainda</p>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Cadastre clientes, fornecedores e funcionários para usar nos movimentos.
            </p>
            <Link
              href="/pessoas/nova"
              className="inline-block bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Cadastrar primeira pessoa
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Vínculo</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">CPF / CNPJ</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Contato</th>
                </tr>
              </thead>
              <tbody>
                {pessoas.map((pessoa, i) => {
                  const contato = pessoa.contato as any;
                  return (
                    <tr
                      key={pessoa.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        i % 2 === 0 ? "" : "bg-gray-50/40"
                      }`}
                    >
                      <td className="px-5 py-3 font-medium text-gray-800">{pessoa.nome}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {LABELS_TIPO[pessoa.tipo] ?? pessoa.tipo}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                            CORES_RELACIONAMENTO[pessoa.relacionamento] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {LABELS_RELACIONAMENTO[pessoa.relacionamento] ?? pessoa.relacionamento}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {pessoa.cpfCnpj ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {contato?.telefone || contato?.email || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}