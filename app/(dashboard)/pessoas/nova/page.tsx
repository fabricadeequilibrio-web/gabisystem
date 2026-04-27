"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TipoPessoa = "FISICA" | "JURIDICA" | "GOVERNO";
type Relacionamento = "CLIENTE" | "FORNECEDOR" | "FUNCIONARIO" | "SOCIO" | "OUTRO";

const LABEL_DOCUMENTO: Record<TipoPessoa, string> = {
  FISICA: "CPF",
  JURIDICA: "CNPJ",
  GOVERNO: "CNPJ / Código",
};

export default function NovaPessoaPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    tipo: "FISICA" as TipoPessoa,
    relacionamento: "CLIENTE" as Relacionamento,
    nome: "",
    cpfCnpj: "",
    telefone: "",
    email: "",
    logradouro: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErro(null);
  }

  async function salvar() {
    if (!form.nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch("/api/pessoas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.tipo,
          relacionamento: form.relacionamento,
          nome: form.nome.trim(),
          cpfCnpj: form.cpfCnpj.trim() || undefined,
          contato: {
            telefone: form.telefone.trim() || undefined,
            email: form.email.trim() || undefined,
          },
          endereco: {
            logradouro: form.logradouro.trim() || undefined,
            cidade: form.cidade.trim() || undefined,
            estado: form.estado.trim() || undefined,
            cep: form.cep.trim() || undefined,
          },
        }),
      });

      const data = await res.json();

      if (!data.sucesso) {
        setErro(data.erro ?? "Erro ao salvar.");
        return;
      }

      router.push("/pessoas");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/pessoas" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Pessoas
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-blue-900">Nova pessoa</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Identificação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de pessoa
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => atualizar("tipo", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FISICA">Pessoa Física</option>
                  <option value="JURIDICA">Pessoa Jurídica</option>
                  <option value="GOVERNO">Governo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vínculo com a empresa
                </label>
                <select
                  value={form.relacionamento}
                  onChange={(e) => atualizar("relacionamento", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CLIENTE">Cliente</option>
                  <option value="FORNECEDOR">Fornecedor</option>
                  <option value="FUNCIONARIO">Funcionário</option>
                  <option value="SOCIO">Sócio</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => atualizar("nome", e.target.value)}
                  placeholder="Nome completo ou razão social"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {LABEL_DOCUMENTO[form.tipo]}
                </label>
                <input
                  type="text"
                  value={form.cpfCnpj}
                  onChange={(e) => atualizar("cpfCnpj", e.target.value)}
                  placeholder={form.tipo === "FISICA" ? "000.000.000-00" : "00.000.000/0000-00"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Contato
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => atualizar("telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => atualizar("email", e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Endereço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                <input
                  type="text"
                  value={form.logradouro}
                  onChange={(e) => atualizar("logradouro", e.target.value)}
                  placeholder="Rua, número, complemento"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={form.cidade}
                  onChange={(e) => atualizar("cidade", e.target.value)}
                  placeholder="Cidade"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input
                    type="text"
                    value={form.estado}
                    onChange={(e) => atualizar("estado", e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={form.cep}
                    onChange={(e) => atualizar("cep", e.target.value)}
                    placeholder="00000-000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center justify-between gap-3">
            {erro ? (
              <p className="text-sm text-red-600">{erro}</p>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Link
                href="/pessoas"
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-5 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? "Salvando..." : "Salvar pessoa"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}