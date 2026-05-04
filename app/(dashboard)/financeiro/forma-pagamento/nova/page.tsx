"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TIPOS_FORMA = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "Pix" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "TRANSFERENCIA", label: "Transferência Bancária" },
  { value: "OUTRO", label: "Outro" },
];

export default function NovaFormaPagamentoPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    tipo: "",
    nome: "",
  });

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  // Preenche o nome automaticamente ao selecionar o tipo
  function selecionarTipo(tipo: string) {
    const label = TIPOS_FORMA.find((t) => t.value === tipo)?.label ?? "";
    setForm((prev) => ({ ...prev, tipo, nome: prev.nome || label }));
  }

  async function salvar() {
    setErro("");

    if (!form.tipo) { setErro("Selecione o tipo de pagamento."); return; }
    if (!form.nome.trim()) { setErro("Informe um nome para identificar a forma de pagamento."); return; }

    setSalvando(true);
    try {
      const res = await fetch("/api/formas-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.tipo,
          nome: form.nome.trim(),
        }),
      });

      const data = await res.json();
      if (!data.sucesso) { setErro(data.erro || "Erro ao salvar."); return; }

      router.push("/financeiro");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/financeiro" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Financeiro
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-blue-900">Nova forma de pagamento</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Forma de pagamento</h2>
          <p className="text-gray-500 text-sm mt-1">
            Como o dinheiro se movimenta nos lançamentos.
          </p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {erro}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              value={form.tipo}
              onChange={(e) => selecionarTipo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione o tipo</option>
              {TIPOS_FORMA.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome para identificação <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => atualizar("nome", e.target.value)}
              placeholder="Ex: Pix, Cartão Cielo, Boleto Bradesco"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Pode personalizar o nome para diferenciar quando tiver mais de uma do mesmo tipo.
            </p>
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Link
            href="/financeiro"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </main>
    </div>
  );
}
