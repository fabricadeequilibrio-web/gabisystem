"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TipoProduto = "PRODUTO" | "SERVICO";

const UNIDADES_PRODUTO = ["un", "kg", "g", "l", "ml", "m", "m²", "m³", "cx", "pc", "par", "rolo"];
const UNIDADES_SERVICO = ["hr", "dia", "mês", "un", "projeto"];

export default function NovoProdutoPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    tipo: "PRODUTO" as TipoProduto,
    nome: "",
    descricao: "",
    unidade: "un",
    precoReferencia: "",
    grupo: "",
    subgrupo: "",
    tipoOperacao: "",
  });

  function atualizar(campo: string, valor: string) {
    setForm((prev) => {
      const novo = { ...prev, [campo]: valor };
      if (campo === "tipo") {
        novo.unidade = valor === "SERVICO" ? "hr" : "un";
      }
      return novo;
    });
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
      const preco = form.precoReferencia.replace(",", ".");
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.tipo,
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || undefined,
          unidade: form.unidade,
          precoReferencia: preco ? parseFloat(preco) : undefined,
          grupo: form.grupo.trim() || undefined,
          subgrupo: form.subgrupo.trim() || undefined,
          tipoOperacao: form.tipoOperacao.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.sucesso) {
        setErro(data.erro ?? "Erro ao salvar.");
        return;
      }

      router.push("/produtos");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const unidades = form.tipo === "SERVICO" ? UNIDADES_SERVICO : UNIDADES_PRODUTO;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/produtos" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Produtos e Serviços
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-blue-900">Novo item</h1>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => atualizar("tipo", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PRODUTO">Produto</option>
                  <option value="SERVICO">Serviço</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                <select
                  value={form.unidade}
                  onChange={(e) => atualizar("unidade", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {unidades.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
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
                  placeholder={form.tipo === "PRODUTO" ? "Ex: Caixa de papelão 30x30" : "Ex: Consultoria financeira"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => atualizar("descricao", e.target.value)}
                  placeholder="Descrição detalhada (opcional)"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

            </div>
          </div>

          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Classificação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                <input
                  type="text"
                  value={form.grupo}
                  onChange={(e) => atualizar("grupo", e.target.value)}
                  placeholder="Ex: Embalagens"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subgrupo</label>
                <input
                  type="text"
                  value={form.subgrupo}
                  onChange={(e) => atualizar("subgrupo", e.target.value)}
                  placeholder="Ex: Caixas"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de referência
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                  <input
                    type="text"
                    value={form.precoReferencia}
                    onChange={(e) => atualizar("precoReferencia", e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de operação
                  <span className="ml-1 text-xs text-gray-400 font-normal">(fiscal)</span>
                </label>
                <input
                  type="text"
                  value={form.tipoOperacao}
                  onChange={(e) => atualizar("tipoOperacao", e.target.value)}
                  placeholder="Ex: venda_servico, compra_produto"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Será preenchido automaticamente após configuração fiscal.
                </p>
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
                href="/produtos"
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-5 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? "Salvando..." : "Salvar item"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}